import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import TemplateQuickNav from "./TemplateQuickNav";
import { useLanguageStore } from "@/stores/useLanguageStore";

const allSections = {
    schedule: true,
    venue: true,
    gallery: true,
    gift: true,
    rsvp: true,
};

function mockMatchMedia(matches) {
    window.matchMedia = vi.fn((query) => ({
        matches: Boolean(matches),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
    }));
}

beforeEach(() => {
    useLanguageStore.setState({ lang: "km" });
    mockMatchMedia(false);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("TemplateQuickNav", () => {
    it("renders quick navigation items filtered by enabledSections in Khmer", () => {
        const enabled = {
            schedule: true,
            venue: true,
            gallery: false,
            gift: false,
            rsvp: true,
        };
        render(<TemplateQuickNav enabledSections={enabled} onNavigate={() => {}} />);

        expect(screen.getByRole("navigation", { name: "រុករកសន្លឹកការ" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "កម្មវិធី" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ទីតាំង" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ឆ្លើយតប" })).toBeInTheDocument();

        // Disabled sections should not appear
        expect(screen.queryByRole("button", { name: "រូបភាព" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "ចំណងដៃ" })).not.toBeInTheDocument();
    });

    it("renders English labels when store language is English", () => {
        useLanguageStore.setState({ lang: "en" });
        render(<TemplateQuickNav enabledSections={allSections} onNavigate={() => {}} />);

        expect(screen.getByRole("navigation", { name: "Invitation navigation" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Program" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Venue" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gallery" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gift QR" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "RSVP" })).toBeInTheDocument();
    });

    it("calls onNavigate callback when clicking a section item", () => {
        const handleNavigate = vi.fn();
        const enabled = { schedule: true };
        render(<TemplateQuickNav enabledSections={enabled} onNavigate={handleNavigate} />);

        const scheduleBtn = screen.getByRole("button", { name: "កម្មវិធី" });
        fireEvent.click(scheduleBtn);
        expect(handleNavigate).toHaveBeenCalledWith("schedule");
    });

    it("gives RSVP the only primary emphasis", () => {
        render(<TemplateQuickNav enabledSections={allSections} onNavigate={() => {}} />);

        const rsvp = screen.getByRole("button", { name: "ឆ្លើយតប" });
        expect(rsvp.className).toContain("tx-quick-nav__item--primary");

        const others = screen
            .getAllByRole("button")
            .filter((button) => button !== rsvp);
        expect(others.length).toBeGreaterThan(0);
        others.forEach((button) => {
            expect(button.className).not.toContain("tx-quick-nav__item--primary");
        });
    });

    it("flags the compact icon-only mode below 360px and keeps every item rendered", () => {
        mockMatchMedia(true);
        render(<TemplateQuickNav enabledSections={allSections} onNavigate={() => {}} />);

        const nav = screen.getByRole("navigation", { name: "រុករកសន្លឹកការ" });
        expect(nav).toHaveAttribute("data-compact", "true");
        // Six sections at 320px: all remain reachable as 44px icon targets.
        expect(screen.getAllByRole("button")).toHaveLength(6);
        screen.getAllByRole("button").forEach((button) => {
            expect(button.querySelector(".tx-quick-nav__label")).not.toBeNull();
            expect(button.querySelector(".tx-quick-nav__icon")).not.toBeNull();
        });
    });

    it("hides itself while a text field is focused and returns after blur", async () => {
        render(
            <div>
                <TemplateQuickNav enabledSections={allSections} onNavigate={() => {}} />
                <label htmlFor="guest-note">Note</label>
                <input id="guest-note" type="text" />
            </div>
        );

        const nav = screen.getByRole("navigation", { name: "រុករកសន្លឹកការ" });
        expect(nav).not.toHaveClass("is-hidden");

        const input = screen.getByLabelText("Note");
        fireEvent.focus(input);

        await waitFor(() => {
            expect(nav).toHaveClass("is-hidden");
            expect(nav).toHaveAttribute("aria-hidden", "true");
        });

        fireEvent.blur(input);
        fireEvent.focus(document.body);
        await waitFor(() => {
            expect(nav).not.toHaveClass("is-hidden");
        });
    });
});
