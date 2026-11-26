package com.koupreng.backend.notification.infrastructure.persistence;

import java.sql.Timestamp;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class TelegramGuestReminderRepository {
    private static final String ELIGIBLE = """
            i.status = 'PUBLISHED' AND i.moderation_status = 'ACTIVE' AND i.deleted = FALSE
            AND u.status = 'ACTIVE' AND u.deleted = FALSE
            AND g.invite_token IS NOT NULL AND SHA2(g.invite_token, 256) = l.invite_token_digest
            AND NOT EXISTS (SELECT 1 FROM rsvps r WHERE r.guest_id = g.guest_id AND r.response_status IS NOT NULL)
            """;
    private static final String LINK_CONTEXT = """
            FROM telegram_guest_reminder_links l
            JOIN guests g ON g.guest_id = l.guest_id
            JOIN invitations i ON i.invitation_id = g.invitation_id
            JOIN users u ON u.user_id = i.user_id
            """;

    private final JdbcClient jdbc;

    public TelegramGuestReminderRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean createChallenge(String slug, String inviteToken, String digest, Instant expiresAt) {
        return jdbc.sql("""
                INSERT INTO telegram_guest_reminder_links
                    (guest_id, invite_token_digest, challenge_hash, challenge_expires_at)
                SELECT g.guest_id, SHA2(g.invite_token, 256), :digest, :expiresAt
                FROM invitations i JOIN guests g ON g.invitation_id = i.invitation_id
                JOIN users u ON u.user_id = i.user_id
                WHERE i.slug = :slug AND i.status = 'PUBLISHED' AND i.moderation_status = 'ACTIVE'
                  AND i.deleted = FALSE AND u.status = 'ACTIVE' AND u.deleted = FALSE
                  AND BINARY g.invite_token = BINARY :inviteToken
                ON DUPLICATE KEY UPDATE
                    chat_id = IF(invite_token_digest = SHA2(:inviteToken, 256), chat_id, NULL),
                    consented_at = IF(invite_token_digest = SHA2(:inviteToken, 256), consented_at, NULL),
                    invite_token_digest = SHA2(:inviteToken, 256),
                    challenge_hash = :digest,
                    challenge_expires_at = :expiresAt
                """).param("slug", slug).param("inviteToken", inviteToken).param("digest", digest)
                .param("expiresAt", Timestamp.from(expiresAt)).update() > 0;
    }

    public boolean consumeChallenge(String digest, long chatId, Instant now) {
        return jdbc.sql("""
                UPDATE telegram_guest_reminder_links l
                JOIN guests g ON g.guest_id = l.guest_id
                JOIN invitations i ON i.invitation_id = g.invitation_id
                JOIN users u ON u.user_id = i.user_id
                SET l.chat_id = :chatId, l.consented_at = :now,
                    l.challenge_hash = NULL, l.challenge_expires_at = NULL
                WHERE l.challenge_hash = :digest AND l.challenge_expires_at > :now AND
                """ + ELIGIBLE).param("digest", digest).param("chatId", chatId)
                .param("now", Timestamp.from(now)).update() == 1;
    }

    public void revoke(long chatId) {
        jdbc.sql("DELETE FROM telegram_guest_reminder_links WHERE chat_id = :chatId")
                .param("chatId", chatId).update();
    }

    public void enqueue(long invitationId, LocalDate reminderDate, Instant due) {
        jdbc.sql("""
                INSERT INTO notifications (user_id, invitation_id, guest_id, recipient_telegram_id, payment_delivery_key,
                    channel, status, type, title, message, next_delivery_at, delivery_attempts, created_at, updated_at)
                SELECT i.user_id, i.invitation_id, g.guest_id, l.chat_id,
                    CONCAT('owner:guest-reminder:', g.guest_id, ':', :reminderDate),
                    'TELEGRAM', 'PENDING', 'REMINDER', :title, :message,
                    UTC_TIMESTAMP(6), 0, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
                """ + LINK_CONTEXT + """
                WHERE g.invitation_id = :invitationId AND l.chat_id IS NOT NULL AND l.consented_at <= :due AND
                """ + ELIGIBLE + """
                ON DUPLICATE KEY UPDATE payment_delivery_key = notifications.payment_delivery_key
                """).param("invitationId", invitationId).param("reminderDate", reminderDate.toString())
                .param("due", Timestamp.from(due)).param("title", "រំលឹកការឆ្លើយតប / RSVP reminder")
                .param("message", "សូមបើកតំណអញ្ជើញរបស់អ្នក ដើម្បីឆ្លើយតប។\nOpen your original invitation link to RSVP.")
                .update();
    }

    public boolean canDeliver(long guestId, long chatId, LocalDate reminderDate, Instant now) {
        return jdbc.sql("""
                SELECT LEAST(COALESCE(i.rsvp_deadline, i.event_date), i.event_date) AS deadline,
                       CASE WHEN JSON_VALID(i.content_json)
                            THEN JSON_UNQUOTE(JSON_EXTRACT(i.content_json, '$.eventTimezone')) END AS timezone
                """ + LINK_CONTEXT + """
                WHERE g.guest_id = :guestId AND l.chat_id = :chatId AND l.consented_at IS NOT NULL
                AND
                """ + ELIGIBLE).param("guestId", guestId).param("chatId", chatId)
                .query((rs, row) -> {
                    LocalDate deadline = rs.getObject("deadline", LocalDate.class);
                    ZoneId zone = eventZone(rs.getString("timezone"));
                    return deadline != null && deadline.minusDays(1).equals(reminderDate)
                            && !now.atZone(zone).toLocalDate().isAfter(deadline);
                }).optional().orElse(false);
    }

    private static ZoneId eventZone(String timezone) {
        ZoneId businessZone = ZoneId.of("Asia/Phnom_Penh");
        if (timezone == null) return businessZone;
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException invalidLegacyTimezone) {
            return businessZone;
        }
    }
}
