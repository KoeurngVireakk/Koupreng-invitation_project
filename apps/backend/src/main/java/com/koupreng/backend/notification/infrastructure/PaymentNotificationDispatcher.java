package com.koupreng.backend.notification.infrastructure;

import com.koupreng.backend.notification.domain.NotificationStatus;
import com.koupreng.backend.notification.domain.Notification;
import com.koupreng.backend.notification.infrastructure.persistence.NotificationRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramGuestReminderRepository;
import com.koupreng.backend.payment.infrastructure.config.PaymentProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@EnableScheduling
public class PaymentNotificationDispatcher {
    private static final Logger log = LoggerFactory.getLogger(PaymentNotificationDispatcher.class);
    private final NotificationRepository repository;
    private final PaymentProperties properties;
    private final TransactionTemplate transaction;
    private final ObjectMapper mapper;
    private final TelegramUserBotProperties userBot;
    private final TelegramOwnerRepository owners;
    private final TelegramGuestReminderRepository guestReminders;
    private final HttpClient client;

    @Autowired
    public PaymentNotificationDispatcher(NotificationRepository repository, PaymentProperties properties,
            PlatformTransactionManager manager, ObjectMapper mapper,
            TelegramUserBotProperties userBot, TelegramOwnerRepository owners, TelegramGuestReminderRepository guestReminders) {
        this(repository, properties, manager, mapper, userBot, owners, guestReminders,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    PaymentNotificationDispatcher(NotificationRepository repository, PaymentProperties properties,
            PlatformTransactionManager manager, ObjectMapper mapper, TelegramUserBotProperties userBot,
            TelegramOwnerRepository owners, TelegramGuestReminderRepository guestReminders, HttpClient client) {
        this.repository = repository;
        this.properties = properties;
        this.transaction = new TransactionTemplate(manager);
        this.mapper = mapper;
        this.userBot = userBot;
        this.owners = owners;
        this.guestReminders = guestReminders;
        this.client = client;
    }

    @Scheduled(fixedDelay = 15000, initialDelay = 15000)
    public void dispatch() {
        boolean adminEnabled = !properties.getTelegramBotUrl().isBlank();
        if (!adminEnabled && !userBot.enabled()) return;
        var ids = repository.paymentDeliveries(Instant.now(), userBot.enabled(), adminEnabled, PageRequest.of(0, 10));
        for (Long id : ids) {
            Delivery delivery = transaction.execute(status -> {
                var n = repository.lock(id).orElseThrow();
                if (n.getStatus() != NotificationStatus.PENDING || n.getNextDeliveryAt().isAfter(Instant.now())) return null;
                String key = n.getPaymentDeliveryKey();
                boolean scheduled = key.startsWith("owner:countdown:") || key.startsWith("owner:rsvp-daily:")
                        || key.startsWith("owner:guest-reminder:");
                if (n.isTelegramDeliveryInFlight()) {
                    n.setTelegramDeliveryInFlight(false);
                    n.setStatus(NotificationStatus.FAILED);
                    n.setErrorMessage("Telegram acknowledgement lost. Check delivery before retrying.");
                    log.warn("Telegram delivery lease expired without acknowledgement id={}", id);
                    return null;
                }
                if (n.getDeliveryAttempts() >= 3) return null;
                boolean ownerDelivery = key.startsWith("owner:");
                if (ownerDelivery && !canDeliver(n, key)) {
                    n.setStatus(NotificationStatus.CANCELLED);
                    return null;
                }
                n.setDeliveryAttempts(n.getDeliveryAttempts() + 1);
                n.setTelegramDeliveryInFlight(scheduled);
                n.setNextDeliveryAt(Instant.now().plusSeconds(60));
                return new Delivery(n.getRecipientTelegramId(), n.getTitle() + "\n\n" + n.getMessage(),
                        ownerDelivery, scheduled, n.getDeliveryAttempts());
            });
            if (delivery == null) continue;
            DeliveryResult result = send(id, delivery);
            transaction.executeWithoutResult(status -> {
                var n = repository.lock(id).orElseThrow();
                if (n.getDeliveryAttempts() != delivery.attempt() || n.getStatus() != NotificationStatus.PENDING) return;
                n.setTelegramDeliveryInFlight(false);
                if (result.sent()) {
                    n.setStatus(NotificationStatus.SENT);
                    n.setSentAt(Instant.now());
                    if (result.providerId() != null) n.setProviderMessageId(result.providerId());
                    n.setErrorMessage(null);
                } else if (result.retrySeconds() > 0 && delivery.attempt() < 3) {
                    if (delivery.scheduled()) n.setNextDeliveryAt(Instant.now().plusSeconds(result.retrySeconds()));
                    n.setErrorMessage("Temporary Telegram delivery failure. Retry scheduled.");
                } else {
                    n.setStatus(NotificationStatus.FAILED);
                    n.setErrorMessage(result.error());
                }
            });
            if (Thread.currentThread().isInterrupted()) return;
        }
    }

    private boolean canDeliver(Notification notification, String key) {
        long chatId = Long.parseLong(notification.getRecipientTelegramId());
        if (key.startsWith("owner:guest-reminder:")) {
            return notification.getGuest() != null && guestReminders.canDeliver(notification.getGuest().getId(), chatId,
                    LocalDate.parse(key.substring(key.lastIndexOf(':') + 1)), Instant.now());
        }
        return owners.activeOwner(chatId)
                .filter(userId -> notification.getUser() != null && userId.equals(notification.getUser().getId())).isPresent();
    }

    private DeliveryResult send(Long id, Delivery delivery) {
        try {
            HttpRequest request = request(id, delivery);
            if (delivery.scheduled()) {
                var response = client.send(request, HttpResponse.BodyHandlers.ofString());
                DeliveryResult result = scheduledResult(response);
                if (!result.sent()) log.warn("Telegram scheduled delivery failed id={} status={}", id, response.statusCode());
                return result;
            }
            return client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode() == 200
                    ? DeliveryResult.success(null) : DeliveryResult.retry(60);
        } catch (ConnectException unavailable) {
            log.warn("Telegram connection unavailable for notification id={}", id);
            return DeliveryResult.retry(60);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        } catch (IOException | IllegalArgumentException exception) {
            log.warn("Telegram delivery failed id={} type={}", id, exception.getClass().getSimpleName());
        }
        return delivery.scheduled() ? DeliveryResult.unknown() : DeliveryResult.retry(60);
    }

    private DeliveryResult scheduledResult(HttpResponse<String> response) throws IOException {
        if (response.statusCode() == 429) {
            var body = mapper.readTree(response.body());
            int retryAfter = body == null ? 0 : body.path("parameters").path("retry_after").asInt(0);
            return DeliveryResult.retry(Math.max(60, retryAfter));
        }
        var body = mapper.readTree(response.body());
        if (body == null) return DeliveryResult.unknown();
        if (response.statusCode() == 200 && body.path("ok").asBoolean()) {
            return DeliveryResult.success(body.path("result").path("message_id").asText(null));
        }
        if (body.path("ok").isBoolean() && !body.path("ok").booleanValue()) {
            if (response.statusCode() >= 500) return DeliveryResult.retry(60);
            return new DeliveryResult(false, 0, null, "Telegram rejected the notification.");
        }
        return DeliveryResult.unknown();
    }

    private HttpRequest request(Long id, Delivery delivery) throws IOException {
        String url = delivery.owner()
                ? "https://api.telegram.org/bot" + userBot.token() + "/sendMessage"
                : properties.getTelegramBotUrl() + "/internal/payment-notifications";
        var request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(15)).header("Content-Type", "application/json");
        var body = delivery.owner()
                ? Map.of("chat_id", delivery.chatId(), "text", delivery.text())
                : Map.of("notificationId", id.toString(), "chatId", delivery.chatId(), "text", delivery.text());
        if (!delivery.owner()) request.header("X-ADMIN-PAYMENT-SECRET", properties.getAdminSecret());
        return request.POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body))).build();
    }

    private record Delivery(String chatId, String text, boolean owner, boolean scheduled, int attempt) {}

    private record DeliveryResult(boolean sent, int retrySeconds, String providerId, String error) {
        static DeliveryResult success(String providerId) {
            return new DeliveryResult(true, 0, providerId, null);
        }

        static DeliveryResult retry(int seconds) {
            return new DeliveryResult(false, seconds, null, "Telegram delivery failed after three attempts.");
        }

        static DeliveryResult unknown() {
            return new DeliveryResult(false, 0, null, "Telegram acknowledgement lost. Check delivery before retrying.");
        }
    }
}
