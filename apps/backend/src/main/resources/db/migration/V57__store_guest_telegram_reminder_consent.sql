CREATE TABLE telegram_guest_reminder_links (
    guest_id BIGINT NOT NULL PRIMARY KEY,
    invite_token_digest CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    chat_id BIGINT,
    consented_at DATETIME(6),
    challenge_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin UNIQUE,
    challenge_expires_at DATETIME(6),
    INDEX idx_telegram_guest_reminder_chat (chat_id),
    CONSTRAINT fk_telegram_guest_reminder_guest FOREIGN KEY (guest_id) REFERENCES guests (guest_id) ON DELETE CASCADE
);
