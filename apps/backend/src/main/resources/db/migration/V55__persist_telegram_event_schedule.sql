CREATE TABLE telegram_event_schedule_checkpoint (
    invitation_id BIGINT NOT NULL PRIMARY KEY,
    checked_through DATETIME(6) NOT NULL,
    CONSTRAINT fk_telegram_schedule_invitation FOREIGN KEY (invitation_id)
        REFERENCES invitations (invitation_id) ON DELETE CASCADE
);
