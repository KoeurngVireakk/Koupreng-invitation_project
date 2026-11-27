import { useLanguageStore } from "@/stores/useLanguageStore";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => useLanguageStore.setState({ lang: "en" }));
import NotificationsPage from "./NotificationsPage";
import TelegramNotificationSettings from "./components/TelegramNotificationSettings";
import { notificationsApi } from "./api/notificationsApi";
import { api } from "@/shared/api/httpClient";

describe("Notifications Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders notification summaries and notification items", async () => {
    vi.spyOn(notificationsApi, "summary").mockResolvedValue({
      unread: 2,
      sent: 10,
      delivered: 8,
      failed: 0,
    });

    vi.spyOn(notificationsApi, "list").mockResolvedValue([
      {
        id: 1,
        title: "Guest RSVP Confirmed",
        message: "Sok Dara accepted the invitation.",
        type: "RSVP",
        channel: "TELEGRAM",
        status: "DELIVERED",
        readAt: null,
        createdAt: "2026-09-01T10:00:00Z",
      },
    ]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Guest RSVP Confirmed")).toBeInTheDocument();
      expect(screen.getByText("Sok Dara accepted the invitation.")).toBeInTheDocument();
      expect(screen.getByText("Unread")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("handles marking a notification as read", async () => {
    vi.spyOn(notificationsApi, "summary").mockResolvedValue({
      unread: 1,
      sent: 5,
      delivered: 5,
      failed: 0,
    });

    vi.spyOn(notificationsApi, "list").mockResolvedValue([
      {
        id: 1,
        title: "Unread Alert",
        message: "Please review your budget.",
        type: "SYSTEM_ALERT",
        channel: "EMAIL",
        status: "SENT",
        readAt: null,
        createdAt: "2026-09-01T11:00:00Z",
      },
    ]);

    vi.spyOn(notificationsApi, "markRead").mockResolvedValue({
      id: 1,
      readAt: "2026-09-01T11:05:00Z",
      status: "READ",
    });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Unread Alert")).toBeInTheDocument();
    });

    const markReadBtn = screen.getByRole("button", { name: /^Mark read$/i });
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(notificationsApi.markRead).toHaveBeenCalledWith(1);
    });
  });

  it("filters unread/failed notifications and preserves list on markRead failure", async () => {
    vi.spyOn(notificationsApi, "summary").mockResolvedValue({
      unread: 1,
      sent: 2,
      delivered: 1,
      failed: 1,
    });

    vi.spyOn(notificationsApi, "list").mockResolvedValue([
      {
        id: 10,
        title: "Failed Email",
        message: "Delivery bounced.",
        type: "INVITATION_SENT",
        channel: "EMAIL",
        status: "FAILED",
        errorMessage: "SMTP rejected recipient",
        readAt: null,
        createdAt: "2026-09-02T10:00:00Z",
      },
      {
        id: 11,
        title: "Payment Confirmed",
        message: "Package unlocked.",
        type: "PAYMENT_CONFIRMED",
        channel: "SYSTEM",
        status: "DELIVERED",
        actionUrl: "/app/packages",
        readAt: "2026-09-02T09:00:00Z",
        createdAt: "2026-09-02T08:00:00Z",
      },
    ]);

    vi.spyOn(notificationsApi, "markRead").mockRejectedValueOnce(new Error("Temporary server error"));

    render(<NotificationsPage />);
    expect(await screen.findByText("Failed Email")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View details/i })).toHaveAttribute("href", "/app/packages");

    fireEvent.click(screen.getByRole("button", { name: /Failed delivery/i }));
    expect(screen.getByText("Failed Email")).toBeInTheDocument();
    expect(screen.queryByText("Payment Confirmed")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Mark read$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Temporary server error");
    expect(screen.getByText("Failed Email")).toBeInTheDocument();
  });

  it("requires confirmation before disconnecting Telegram notifications", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: { available: true, connected: true } });
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValue({});

    render(<TelegramNotificationSettings />);
    const disconnectBtn = await screen.findByRole("button", { name: /Disconnect Telegram/i });
    fireEvent.click(disconnectBtn);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    const confirmBtns = screen.getAllByRole("button", { name: /Disconnect Telegram/i });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/v1/telegram/user/link");
    });
  });
});
