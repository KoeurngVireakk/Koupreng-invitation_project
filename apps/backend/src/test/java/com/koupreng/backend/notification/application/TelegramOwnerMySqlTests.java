package com.koupreng.backend.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.koupreng.backend.guest.domain.Guest;
import com.koupreng.backend.notification.infrastructure.persistence.NotificationRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramGuestReminderRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository.UpcomingInvitation;
import com.koupreng.backend.guest.infrastructure.persistence.GuestRepository;
import com.koupreng.backend.invitation.domain.InvitationStatus;
import com.koupreng.backend.invitation.domain.UserInvitation;
import com.koupreng.backend.invitation.infrastructure.persistence.UserInvitationRepository;
import com.koupreng.backend.notification.infrastructure.TelegramUserBotProperties;
import com.koupreng.backend.rsvp.infrastructure.persistence.RsvpRepository;
import com.koupreng.backend.shared.config.AppProperties;
import com.koupreng.backend.user.domain.AppUser;
import com.koupreng.backend.user.infrastructure.persistence.AppUserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "RUN_FLYWAY_INTEGRATION", matches = "true")
class TelegramOwnerMySqlTests {
    @Autowired TelegramOwnerRepository owners;
    @Autowired AppUserRepository users;
    @Autowired NotificationRepository notifications;
    @Autowired UserInvitationRepository invitations;
    @Autowired GuestRepository guests;
    @Autowired TelegramGuestReminderRepository guestReminders;
    @Autowired RsvpRepository rsvps;
    @Autowired AppProperties app;
    @Autowired PlatformTransactionManager transactions;

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("FLYWAY_TEST_DB_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("FLYWAY_TEST_DB_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("FLYWAY_TEST_DB_PASSWORD"));
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
    }

    @Test
    void challengeIsSingleUseAndDeliveryIsBoundToTheOptedInOwner() {
        var owner = user();
        var other = user();
        long chat = 9000000000L + owner.getId();
        Instant now = Instant.now();
        String expired = digestFixture();
        owners.createChallenge(owner.getId(), expired, now.minusSeconds(1));
        assertFalse(owners.consumeChallenge(expired, chat, now));

        String digest = digestFixture();
        owners.createChallenge(owner.getId(), digest, now.plusSeconds(300));
        assertTrue(owners.consumeChallenge(digest, chat, now));
        assertFalse(owners.consumeChallenge(digest, chat + 1, now));
        assertTrue(owners.linkedChat(other.getId()).isEmpty());

        String delivery = UUID.randomUUID().toString();
        owners.enqueue(owner.getId(), delivery, "Event notice", "Fixture");
        owners.enqueue(owner.getId(), delivery, "Duplicate", "Fixture");
        owners.enqueue(other.getId(), UUID.randomUUID().toString(), "No consent", "Fixture");
        var queued = notifications.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, queued.size());
        assertEquals(Long.toString(chat), queued.getFirst().getRecipientTelegramId());
        assertTrue(notifications.findByUserIdOrderByCreatedAtDesc(other.getId()).isEmpty());

        owners.disconnect(owner.getId());
        assertTrue(owners.activeOwner(chat).isEmpty());
        owners.enqueue(owner.getId(), UUID.randomUUID().toString(), "Disconnected", "Fixture");
        assertEquals(1, notifications.findByUserIdOrderByCreatedAtDesc(owner.getId()).size());
    }

    @Test
    void webhookReplayIsScopedToEachBotIdentity() {
        long update = Instant.now().toEpochMilli();
        assertTrue(owners.acceptUpdate("991001", update));
        assertFalse(owners.acceptUpdate("991001", update));
        assertTrue(owners.acceptUpdate("991002", update));
    }

    @Test
    void checkpointsRecoverElapsedReportsAndCountdownsOnceAcrossRestartAndCompetingWorkers() throws Exception {
        var owner = user();
        var invitation = new UserInvitation();
        invitation.setUser(owner);
        invitation.setTitle("Telegram schedule fixture");
        invitation.setSlug("telegram-qa-" + UUID.randomUUID());
        invitation.setEventDate(LocalDate.of(2026, 12, 3));
        invitation.setStatus(InvitationStatus.PUBLISHED);
        invitations.saveAndFlush(invitation);
        var event = new UpcomingInvitation(invitation.getId(), owner.getId(), invitation.getTitle(),
                invitation.getEventDate(), null, "Asia/Phnom_Penh");
        Instant beforeFirstReport = Instant.parse("2026-11-26T00:50:00Z");
        String challenge = digestFixture();
        owners.createChallenge(owner.getId(), challenge, beforeFirstReport.plusSeconds(300));
        assertTrue(owners.consumeChallenge(challenge, 9200000000L + owner.getId(), beforeFirstReport));
        scheduler().enqueue(event, beforeFirstReport);
        assertTrue(notifications.findByUserIdOrderByCreatedAtDesc(owner.getId()).isEmpty());

        Instant afterDowntime = beforeFirstReport.plus(6, ChronoUnit.DAYS).plusSeconds(7200);
        var start = new CountDownLatch(1);
        try (var workers = Executors.newFixedThreadPool(2)) {
            var first = workers.submit(() -> {
                start.await();
                scheduler().enqueue(event, afterDowntime);
                return null;
            });
            var second = workers.submit(() -> {
                start.await();
                scheduler().enqueue(event, afterDowntime);
                return null;
            });
            start.countDown();
            first.get(15, TimeUnit.SECONDS);
            second.get(15, TimeUnit.SECONDS);
        }
        scheduler().enqueue(event, afterDowntime.plusSeconds(60));
        var queued = notifications.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(10, queued.size());
        Set<String> keys = queued.stream().map(n -> n.getPaymentDeliveryKey()).collect(Collectors.toSet());
        for (int offset : new int[] {7, 3, 1}) {
            assertTrue(keys.contains("owner:countdown:" + event.id() + ":" + event.date() + ":" + offset));
        }
        for (int day = 0; day <= 6; day++) {
            assertTrue(keys.contains("owner:rsvp-daily:" + event.id() + ":" + event.date().minusDays(7 - day)));
        }
    }

    @Test
    void guestReminderRequiresTimelyConsentAndRevocationBlocksQueuedDelivery() {
        var owner = user();
        var invitation = new UserInvitation();
        invitation.setUser(owner);
        invitation.setTitle("Guest reminder fixture");
        invitation.setSlug("reminder-qa-" + UUID.randomUUID());
        invitation.setEventDate(LocalDate.of(2026, 12, 1));
        invitation.setRsvpDeadline(LocalDate.of(2026, 11, 27));
        invitation.setStatus(InvitationStatus.PUBLISHED);
        invitations.saveAndFlush(invitation);
        Guest optedIn = guest(invitation);
        Guest notOptedIn = guest(invitation);
        long chatId = 9300000000L + owner.getId();
        Instant beforeReminder = Instant.parse("2026-11-26T00:55:00Z");
        String challenge = digestFixture();
        assertFalse(guestReminders.createChallenge("wrong-slug", optedIn.getInviteToken(), challenge,
                beforeReminder.plusSeconds(300)));
        assertTrue(guestReminders.createChallenge(invitation.getSlug(), optedIn.getInviteToken(), challenge,
                beforeReminder.plusSeconds(300)));
        assertTrue(guestReminders.consumeChallenge(challenge, chatId, beforeReminder));
        assertFalse(guestReminders.consumeChallenge(challenge, chatId + 1, beforeReminder));
        var event = new UpcomingInvitation(invitation.getId(), owner.getId(), invitation.getTitle(),
                invitation.getEventDate(), invitation.getRsvpDeadline(), "Asia/Phnom_Penh");
        scheduler().enqueue(event, beforeReminder);
        Instant catchUp = beforeReminder.plusSeconds(3600);
        scheduler().enqueue(event, catchUp);
        scheduler().enqueue(event, catchUp.plusSeconds(60));
        assertEquals(1, notifications.findByGuestIdOrderByCreatedAtDesc(optedIn.getId()).size());
        assertTrue(notifications.findByGuestIdOrderByCreatedAtDesc(notOptedIn.getId()).isEmpty());
        LocalDate reminderDate = invitation.getRsvpDeadline().minusDays(1);
        assertTrue(guestReminders.canDeliver(optedIn.getId(), chatId, reminderDate, catchUp));
        assertFalse(guestReminders.canDeliver(optedIn.getId(), chatId + 1, reminderDate, catchUp));
        guestReminders.revoke(chatId);
        assertFalse(guestReminders.canDeliver(optedIn.getId(), chatId, reminderDate, catchUp));
    }

    private Guest guest(UserInvitation invitation) {
        Guest guest = new Guest();
        guest.setGuestName("Reminder fixture");
        guest.setInvitation(invitation);
        guest.setInviteToken(UUID.randomUUID().toString());
        return guests.saveAndFlush(guest);
    }

    private TelegramEventSchedule scheduler() {
        return new TelegramEventSchedule(new TelegramUserBotProperties("", "", ""), owners, guests, guestReminders, rsvps,
                app, transactions, "08:00", true);
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setFullName("Telegram QA");
        user.setEmail(UUID.randomUUID() + "@example.test");
        return users.saveAndFlush(user);
    }

    private String digestFixture() {
        return java.util.HexFormat.of().formatHex(
                UUID.randomUUID().toString().substring(0, 32).getBytes(java.nio.charset.StandardCharsets.US_ASCII));
    }
}
