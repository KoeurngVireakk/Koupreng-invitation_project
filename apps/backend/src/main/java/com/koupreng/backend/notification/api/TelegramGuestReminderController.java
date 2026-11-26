package com.koupreng.backend.notification.api;

import com.koupreng.backend.notification.application.TelegramOwnerService;
import com.koupreng.backend.notification.application.TelegramOwnerService.ConnectLink;
import com.koupreng.backend.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TelegramGuestReminderController {
    private final TelegramOwnerService telegram;

    public TelegramGuestReminderController(TelegramOwnerService telegram) {
        this.telegram = telegram;
    }

    @PostMapping("/api/v1/public/invitations/{slug}/telegram-reminders/link")
    @Operation(summary = "Create a guest Telegram reminder opt-in link")
    public ResponseEntity<ApiResponse<ConnectLink>> begin(@PathVariable String slug,
            @Valid @RequestBody GuestReminderLinkRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(ApiResponse.success("Guest Telegram reminder link created",
                        telegram.beginGuestReminders(slug, request.inviteToken())));
    }

    public record GuestReminderLinkRequest(
            @Schema(accessMode = Schema.AccessMode.WRITE_ONLY) @NotBlank @Size(max = 128) String inviteToken) {}
}
