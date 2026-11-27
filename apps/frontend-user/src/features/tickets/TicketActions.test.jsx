import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TicketActions from "./TicketActions";
import PublicTicketAccess from "./PublicTicketAccess";

vi.mock("./ticketRenderer", () => ({
  renderTicket: vi.fn().mockResolvedValue(undefined),
  ticketBlob: vi.fn().mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

vi.mock("@/features/guests/model/guestMappers", () => ({
  copyText: vi.fn().mockResolvedValue(true),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Phase 16 Ticket & In-App Browser Controls", () => {
  it("hides public Telegram share for personal GUEST tickets while keeping it for GENERAL tickets", () => {
    const guestTicket = { kind: "GUEST", invitationUrl: "https://example.test/i/wed?token=secret-1" };
    const { rerender } = render(<TicketActions ticket={guestTicket} ready={true} languageMode="EN" />);
    expect(screen.queryByRole("link", { name: "Telegram" })).toBeNull();
    expect(screen.getByRole("button", { name: "Copy invitation link" })).toBeInTheDocument();

    rerender(<TicketActions ticket={{ kind: "GENERAL", invitationUrl: "https://example.test/i/wed" }} ready={true} languageMode="EN" />);
    expect(screen.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", expect.stringContaining("https://t.me/share/url"));
  });

  it("shows inline ticket image preview fallback when download is triggered inside an in-app browser", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 TelegramBot Android");
    if (!URL.createObjectURL) URL.createObjectURL = vi.fn();
    if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:ticket-preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    render(<TicketActions ticket={{ kind: "GUEST", invitationUrl: "https://example.test/i/wed?token=secret" }} ready={true} languageMode="KH" />);
    fireEvent.click(screen.getByRole("button", { name: "ទាញយក PNG · 2×" }));

    await waitFor(() => {
      expect(screen.getByAltText("រូបភាពកាតអញ្ជើញសម្រាប់រក្សាទុក")).toHaveAttribute("src", "blob:ticket-preview");
    });
  });

  it("hides PublicTicketAccess while a guest types in an RSVP field", async () => {
    render(
      <div>
        <input aria-label="Guest name" />
        <PublicTicketAccess slug="wed" languageMode="EN" />
      </div>
    );
    const btn = screen.getByRole("button", { name: "Invitation ticket" });
    expect(btn).not.toHaveAttribute("data-keyboard-hidden");

    fireEvent.focusIn(screen.getByLabelText("Guest name"));
    expect(btn).toHaveAttribute("data-keyboard-hidden", "true");
    expect(btn).toHaveAttribute("tabindex", "-1");
  });

  it("triggers print preview when Print / PDF is clicked on a ready ticket", () => {
    const originalPrint = window.print;
    const printSpy = vi.fn();
    window.print = printSpy;
    try {
      render(<TicketActions ticket={{ kind: "GUEST", invitationUrl: "https://example.test/i/wed?token=secret-1" }} ready={true} languageMode="EN" />);
      fireEvent.click(screen.getByRole("button", { name: "Print / PDF" }));
      expect(printSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.print = originalPrint;
    }
  });
});
