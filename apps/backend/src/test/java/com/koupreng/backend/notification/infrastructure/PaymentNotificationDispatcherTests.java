package com.koupreng.backend.notification.infrastructure;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.koupreng.backend.notification.domain.Notification;
import com.koupreng.backend.notification.domain.NotificationStatus;
import com.koupreng.backend.notification.infrastructure.persistence.NotificationRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramGuestReminderRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository;
import com.koupreng.backend.payment.infrastructure.config.PaymentProperties;
import com.koupreng.backend.user.domain.AppUser;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

class PaymentNotificationDispatcherTests {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final TelegramOwnerRepository owners = mock(TelegramOwnerRepository.class);
    private final HttpClient client = mock(HttpClient.class);
    private final PlatformTransactionManager transactions = mock(PlatformTransactionManager.class);
    private final Notification notification = new Notification();

    @BeforeEach
    void scheduleNotification() {
        AppUser owner = new AppUser();
        owner.setId(27L);
        notification.setId(17L);
        notification.setUser(owner);
        notification.setTitle("Scheduled fixture");
        notification.setMessage("Notification");
        notification.setRecipientTelegramId("12345");
        notification.setPaymentDeliveryKey("owner:countdown:1:2026-12-01:7");
        notification.setNextDeliveryAt(Instant.now().minusSeconds(1));
        when(repository.lock(17L)).thenReturn(Optional.of(notification));
        when(repository.paymentDeliveries(any(), eq(true), eq(false), any())).thenReturn(List.of(17L));
        when(owners.activeOwner(12345L)).thenReturn(Optional.of(27L));
        when(transactions.getTransaction(any())).thenAnswer(invocation -> new SimpleTransactionStatus());
    }

    @Test
    void rejectedRateLimitedAttemptsRetryAfterTheProviderDelay() throws Exception {
        HttpResponse<String> limited = response(429, """
                {"ok":false,"parameters":{"retry_after":120}}
                """);
        HttpResponse<String> accepted = response(200, """
                {"ok":true,"result":{"message_id":987}}
                """);
        when(client.send(any(), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenReturn(limited, accepted);

        Instant before = Instant.now();
        worker().dispatch();
        assertEquals(NotificationStatus.PENDING, notification.getStatus());
        assertFalse(notification.isTelegramDeliveryInFlight());
        assertTrue(notification.getNextDeliveryAt().isAfter(before.plusSeconds(119)));
        worker().dispatch();
        verify(client).send(any(), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any());

        notification.setNextDeliveryAt(Instant.now().minusSeconds(1));
        worker().dispatch();
        assertEquals(NotificationStatus.SENT, notification.getStatus());
        assertEquals("987", notification.getProviderMessageId());
        assertFalse(notification.isTelegramDeliveryInFlight());
        verify(client, times(2)).send(any(), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any());
    }

    @Test
    void expiredUnacknowledgedLeaseIsMarkedFailedWithoutResendingAcrossRestart() {
        notification.setDeliveryAttempts(1);
        notification.setTelegramDeliveryInFlight(true);
        worker().dispatch();
        assertEquals(NotificationStatus.FAILED, notification.getStatus());
        assertFalse(notification.isTelegramDeliveryInFlight());
        assertTrue(notification.getErrorMessage().contains("acknowledgement lost"));
        worker().dispatch();
        verifyNoInteractions(client);
    }

    private PaymentNotificationDispatcher worker() {
        var bot = new TelegramUserBotProperties("12345:" + "x".repeat(35), "fixture_bot", "x".repeat(32));
        return new PaymentNotificationDispatcher(repository, new PaymentProperties(), transactions, new ObjectMapper(),
                bot, owners, mock(TelegramGuestReminderRepository.class), client);
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> response(int status, String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        return response;
    }
}
