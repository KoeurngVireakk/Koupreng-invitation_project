import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlissEditorialLayout from "./BlissEditorialLayout";
import WithJoyPortalLayout from "./WithJoyPortalLayout";
import EmeraldLuxeLayout from "./EmeraldLuxe/EmeraldLuxeLayout";
import DigitalYesLayout from "./DigitalYes/DigitalYesLayout";
import TemplateVenue from "../experience/components/sections/TemplateVenue";

describe("Phase 16 Renderer Parity, Typography, and Hosted Data Boundaries", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("BlissEditorialLayout skips empty gallery frames under hasHostContent and renders Gift & custom Map links", () => {
    const { container } = render(
      <MemoryRouter>
        <BlissEditorialLayout
          preview
          content={{
            hasHostContent: true,
            groom: "សុខ ដារ៉ា",
            bride: "ចាន់ មាលា",
            groomEn: "Dara",
            brideEn: "Mealea",
            gallery: [],
            venue: { name: "Koh Pich", address: "Phnom Penh" },
            googleMapsUrl: "https://maps.google.com/?q=BlissVenue",
            bankAccount: { bank: "ABA Bank", accountNumber: "001 234 567", accountName: "Dara Sok" },
            enabledSections: { gallery: true, map: true, gift: true },
          }}
        />
      </MemoryRouter>
    );

    expect(container.querySelectorAll(".bliss-gallery-frame")).toHaveLength(0);
    const mapLink = container.querySelector('a[href="https://maps.google.com/?q=BlissVenue"]');
    expect(mapLink).toBeInTheDocument();
    expect(screen.getByText("001 234 567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ចម្លងលេខគណនី/i })).toBeInTheDocument();
  });

  it("WithJoyPortalLayout prefers authored googleMapsUrl and exposes Copy Account action", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    const { container } = render(
      <MemoryRouter>
        <WithJoyPortalLayout
          preview
          content={{
            hasHostContent: true,
            groom: "សុវណ្ណ",
            bride: "ស្រីនាថ",
            venue: { name: "Chroy Changvar", address: "Phnom Penh" },
            googleMapsUrl: "https://maps.google.com/?q=WithJoyVenue",
            bankAccount: { bank: "ACLEDA", accountNumber: "099 888 777" },
            enabledSections: { map: true, gift: true },
          }}
        />
      </MemoryRouter>
    );

    expect(container.querySelector('a[href="https://maps.google.com/?q=WithJoyVenue"]')).toBeInTheDocument();
    const copyBtn = screen.getByRole("button", { name: /ចម្លងលេខគណនី/i });
    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("099 888 777");
  });

  it("EmeraldLuxeLayout renders schedule, venue, and gift sections and honors reduced-motion audio state", () => {
    const { container } = render(
      <MemoryRouter>
        <EmeraldLuxeLayout
          preview
          tpl={{
            id: "emerald-canva-luxe-wedding",
            hasHostContent: true,
            groom: "វិសាល",
            bride: "ពេជ្រ",
            venueName: "Diamond Island",
            venueAddress: "Phnom Penh",
            googleMapsUrl: "https://maps.google.com/?q=EmeraldVenue",
            schedule: [{ time: "17:00", title: "ពិធីទទួលភ្ញៀវ" }],
            bankAccount: { bank: "ABA", accountNumber: "012 345 678" },
            enabledSections: { schedule: true, map: true, gift: true },
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("ពិធីទទួលភ្ញៀវ").length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="https://maps.google.com/?q=EmeraldVenue"]')).toBeInTheDocument();
    expect(screen.getAllByText(/012 345 678/).length).toBeGreaterThan(0);

    const audioBtn = screen.getByRole("button", { name: /ចាក់ភ្លេង|Play audio/i });
    expect(audioBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(audioBtn);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("TemplateVenue never fabricates demo banquet tables for hosted invitations", () => {
    const { container } = render(
      <TemplateVenue
        content={{
          hasHostContent: true,
          guestTable: "តុ A1",
          venue: { name: "Hotel Cambodiana", address: "Phnom Penh" },
          seatingTables: [],
        }}
      />
    );

    expect(screen.getByText(/តុ A1/)).toBeInTheDocument();
    expect(container.textContent).not.toContain("តុ VIP ១");
  });

  it("DigitalYesLayout avoids Khmer tracking-[0.3em], strips javascript: URLs, and clears sticky action bar cleanly", () => {
    const { container } = render(
      <MemoryRouter>
        <DigitalYesLayout
          preview={false}
          useTemplateLink="/app/templates/use/digital-yes"
          tpl={{
            groom: "ជា វណ្ណដា",
            bride: "សុខ ស្រីពេជ្រ",
            venueName: "Premier Center",
            venueAddress: "Sen Sok",
            googleMapsUrl: "javascript:alert(1)",
            enabledSections: { map: true },
          }}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /រំលង|Skip/i }));
    expect(container.innerHTML).not.toContain("tracking-[0.3em]");
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector(".tdy-sticky-bar")).toBeInTheDocument();
  });
});
