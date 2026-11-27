import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { EventContext } from "@/features/events/workspace/EventContext";
import { exportRsvpsToCsv } from "@/features/guests/model/guestCsvUtils";
import RsvpDashboardPage from "./RsvpDashboardPage";

vi.mock("@/features/guests/model/guestCsvUtils", () => ({
  exportRsvpsToCsv: vi.fn(() => true),
}));

vi.mock("./api/rsvpApi", () => {
  const rsvps = [
    { id: 101, guestName: "Vireak", status: "ATTENDING", partySize: 2, wish: "Congratulations!" },
  ];
  const summary = { attending: 1, declined: 0, pending: 0 };

  return {
    rsvpService: {
      listByInvitation: vi.fn().mockResolvedValue(rsvps),
      summary: vi.fn().mockResolvedValue(summary),
      wishes: vi.fn().mockResolvedValue(rsvps),
    },
    default: {
      listByInvitation: vi.fn().mockResolvedValue(rsvps),
      summary: vi.fn().mockResolvedValue(summary),
      wishes: vi.fn().mockResolvedValue(rsvps),
    },
  };
});

vi.mock("@/features/invitations/api/invitationApi", () => ({
  invitationService: {
    get: vi.fn().mockResolvedValue({ id: 1, title: "Dara & Sophea Wedding" }),
  },
}));
vi.mock("@/features/guests/api/guestApi", () => ({ guestService: { listByInvitation: vi.fn().mockResolvedValue([]) } }));

describe("RsvpDashboardPage Module", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    useLanguageStore.setState({ lang: "en" });
  });
  it("renders host RSVP summary and responses table", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/invitations/1/rsvp"]}>
        <Routes>
          <Route path="/dashboard/invitations/:invitationId/rsvp" element={<RsvpDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dara & Sophea Wedding")).toBeInTheDocument();
      expect(screen.getByText("Vireak")).toBeInTheDocument();
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    });
  });

  it("allows switching to wishes card view mode", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/invitations/1/rsvp"]}>
        <Routes>
          <Route path="/dashboard/invitations/:invitationId/rsvp" element={<RsvpDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Wishes/i })[0]).toBeInTheDocument();
    });

    const wishesBtn = screen.getAllByRole("button", { name: /Wishes/i })[0];
    wishesBtn.click();

    await waitFor(() => {
      expect(screen.getByText("“Congratulations!”")).toBeInTheDocument();
    });
  });

  it("exports filtered RSVP responses as CSV and hides edit/delete actions for read-only staff", async () => {
    render(
      <EventContext.Provider value={{ eventId: "1", isOwner: false, access: { owner: false, permissions: ["VIEW_GUESTS"] } }}>
        <MemoryRouter initialEntries={["/dashboard/invitations/1/rsvp"]}>
          <Routes>
            <Route path="/dashboard/invitations/:invitationId/rsvp" element={<RsvpDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </EventContext.Provider>
    );

    await waitFor(() => expect(screen.getByText("Vireak")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Edit RSVP" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete RSVP" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(exportRsvpsToCsv).toHaveBeenCalledTimes(1);
  });
});

