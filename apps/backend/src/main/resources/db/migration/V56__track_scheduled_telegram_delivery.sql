ALTER TABLE notifications
    ADD COLUMN telegram_delivery_in_flight BOOLEAN NOT NULL DEFAULT FALSE;
