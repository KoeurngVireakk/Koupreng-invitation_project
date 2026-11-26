package com.koupreng.backend.notification.application;

import com.koupreng.backend.guest.infrastructure.persistence.GuestRepository;
import com.koupreng.backend.notification.infrastructure.TelegramUserBotProperties;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramGuestReminderRepository;
import com.koupreng.backend.notification.infrastructure.persistence.TelegramOwnerRepository.UpcomingInvitation;
import com.koupreng.backend.rsvp.infrastructure.persistence.RsvpRepository;
import com.koupreng.backend.shared.config.AppProperties;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class TelegramEventSchedule {
    private static final Logger log = LoggerFactory.getLogger(TelegramEventSchedule.class);
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Phnom_Penh");
    private static final Set<Long> COUNTDOWN_DAYS = Set.of(7L, 3L, 1L);
    private final TelegramUserBotProperties bot;
    private final TelegramOwnerRepository owners;
    private final GuestRepository guests;
    private final TelegramGuestReminderRepository guestReminders;
    private final RsvpRepository rsvps;
    private final String baseUrl;
    private final LocalTime deliveryTime;
    private final boolean dailyReports;
    private final TransactionTemplate transaction;

    public TelegramEventSchedule(TelegramUserBotProperties bot, TelegramOwnerRepository owners,
            GuestRepository guests, TelegramGuestReminderRepository guestReminders, RsvpRepository rsvps,
            AppProperties app, PlatformTransactionManager manager,
            @Value("${app.telegram.user.daily-report-time:08:00}") String deliveryTime,
            @Value("${app.telegram.user.daily-report-enabled:true}") boolean dailyReports) {
        this.bot = bot;
        this.owners = owners;
        this.guests = guests;
        this.guestReminders = guestReminders;
        this.rsvps = rsvps;
        this.baseUrl = app.getInvitation().getPublicBaseUrl().replaceAll("/+$", "");
        this.deliveryTime = LocalTime.parse(deliveryTime);
        this.dailyReports = dailyReports;
        this.transaction = new TransactionTemplate(manager);
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 65000)
    public void enqueueDue() {
        if (!bot.enabled()) return;
        Instant now = Instant.now();
        var utcDate = now.atZone(ZoneOffset.UTC).toLocalDate();
        long cursor = 0;
        while (true) {
            var events = owners.upcoming(cursor, utcDate.minusDays(1), utcDate.plusDays(31));
            if (events.isEmpty()) return;
            for (UpcomingInvitation event : events) {
                try {
                    enqueue(event, now);
                } catch (org.springframework.dao.DataAccessException exception) {
                    log.warn("Telegram schedule update will retry for invitationId={} type={}",
                            event.id(), exception.getClass().getSimpleName());
                }
            }
            cursor = events.getLast().id();
        }
    }

    @Scheduled(fixedDelay = 3600000, initialDelay = 120000)
    public void expireWebhookUpdates() {
        if (bot.enabled()) owners.expireUpdates(Instant.now().minus(7, ChronoUnit.DAYS));
    }

    void enqueue(UpcomingInvitation event, Instant now) {
        ZoneId zone = eventZone(event.timezone());
        LocalDate today = now.atZone(zone).toLocalDate();
        if (event.date().isBefore(today)) return;

        transaction.executeWithoutResult(status -> {
            Instant firstCheck = today.atStartOfDay(zone).toInstant().minus(1, ChronoUnit.MICROS);
            Instant since = owners.lockScheduleCheckpoint(event.id(), firstCheck);
            if (!since.isBefore(now)) return;
            enqueueElapsedDates(event, zone, since, now, today);
            owners.advanceScheduleCheckpoint(event.id(), now);
        });
    }

    private void enqueueElapsedDates(UpcomingInvitation event, ZoneId zone, Instant since, Instant now, LocalDate today) {
        LocalDate firstDate = since.atZone(zone).toLocalDate();
        LocalDate deadline = event.rsvpDeadline() != null && event.rsvpDeadline().isBefore(event.date())
                ? event.rsvpDeadline() : event.date();
        LocalDate guestReminderDate = deadline.minusDays(1);
        Instant reminderDue = guestReminderDate.atTime(deliveryTime).atZone(zone).toInstant();
        if (!today.isAfter(deadline) && reminderDue.isAfter(since) && !reminderDue.isAfter(now)) {
            guestReminders.enqueue(event.id(), guestReminderDate, reminderDue);
        }
        if (owners.linkedChat(event.userId()).isEmpty()) return;

        LocalDate reportHorizon = event.date().minusDays(30);
        if (firstDate.isBefore(reportHorizon)) firstDate = reportHorizon;
        String link = baseUrl + "/app/events/" + event.id();
        String report = null;
        for (LocalDate date = firstDate; !date.isAfter(today); date = date.plusDays(1)) {
            Instant due = date.atTime(deliveryTime).atZone(zone).toInstant();
            if (!due.isAfter(since) || due.isAfter(now)) continue;
            long days = ChronoUnit.DAYS.between(date, event.date());
            if (COUNTDOWN_DAYS.contains(days)) {
                owners.enqueue(event.userId(), "countdown:" + event.id() + ":" + event.date() + ":" + days,
                        "រាប់ថ្ងៃថយក្រោយ / Event countdown",
                        event.title() + "\n" + days + " ថ្ងៃ / days · " + event.date() + "\n" + link);
            }
            if (dailyReports) {
                if (report == null) report = rsvpSummary(event.id());
                owners.enqueue(event.userId(), "rsvp-daily:" + event.id() + ":" + date,
                        "របាយការណ៍ការចូលរួម / Daily RSVP report",
                        event.title() + "\n" + date + " · " + zone + "\n" + report + "\n" + link + "/rsvp");
            }
        }
    }

    private String rsvpSummary(long invitationId) {
        var counts = rsvps.summarizeByInvitationId(invitationId);
        return "ភ្ញៀវ / Invited " + guests.countByInvitationId(invitationId)
                + " · ចូលរួម / Yes " + counts.getAttending()
                + " · មិនចូលរួម / No " + counts.getNotAttending()
                + " · មិនទាន់ឆ្លើយ / Pending " + rsvps.countPendingGuests(invitationId)
                + " · ប្រហែល / Maybe " + counts.getMaybe()
                + "\nចំនួនអ្នកចូលរួម / Expected attendance " + counts.getTotalAttendeeCount();
    }

    private ZoneId eventZone(String value) {
        if (value == null) return DEFAULT_ZONE;
        try {
            return ZoneId.of(value);
        } catch (DateTimeException invalidLegacyTimezone) {
            return DEFAULT_ZONE;
        }
    }
}
