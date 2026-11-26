import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WithJoyPortalOpening from "./WithJoyPortalOpening";
import BlissEditorialOpening from "./BlissEditorialOpening";
import RibbonOpening from "../shared/Openings/RibbonOpening";
import FloatingAudioPlayer from "../shared/AudioPlayer/FloatingAudioPlayer";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

vi.mock("@/shared/hooks/usePrefersReducedMotion", () => ({
    usePrefersReducedMotion: vi.fn(() => false),
}));

const content = {
    groom: "Sokha",
    bride: "Maly",
    dateText: "20 December 2027",
    subtitle: "Phnom Penh, Cambodia",
    languageMode: "en",
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("WithJoyPortalOpening", () => {
    it("reveals the invitation over 700ms and skips instantly", () => {
        render(<WithJoyPortalOpening content={content} />);
        const cover = screen.getByRole("region", { name: "Wedding invitation cover" });
        expect(cover).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Open invitation" }));
        expect(cover).toHaveAttribute("data-state", "opening");

        act(() => vi.advanceTimersByTime(700));
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();

        cleanup();
        render(<WithJoyPortalOpening content={content} />);
        fireEvent.click(screen.getByRole("button", { name: "Skip opening" }));
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });

    it("is fully bypassed under prefers-reduced-motion", () => {
        vi.mocked(usePrefersReducedMotion).mockReturnValue(true);
        render(<WithJoyPortalOpening content={content} />);
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });

    it("does not render in the studio preview", () => {
        render(<WithJoyPortalOpening content={content} preview />);
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });
});

describe("BlissEditorialOpening", () => {
    it("turns the editorial page and skips instantly with a single gesture", () => {
        render(<BlissEditorialOpening content={content} />);
        const cover = screen.getByRole("region", { name: "Wedding invitation cover" });
        expect(cover).toHaveAttribute("data-state", "idle");

        fireEvent.click(screen.getByRole("button", { name: "Turn the page" }));
        expect(cover).toHaveAttribute("data-state", "opening");

        act(() => vi.advanceTimersByTime(700));
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });

    it("skips on Escape and on the skip control", () => {
        render(<BlissEditorialOpening content={content} />);
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();

        cleanup();
        render(<BlissEditorialOpening content={content} />);
        fireEvent.click(screen.getByRole("button", { name: "Skip opening" }));
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });

    it("is fully bypassed under prefers-reduced-motion or when the author opts out", () => {
        vi.mocked(usePrefersReducedMotion).mockReturnValue(true);
        render(<BlissEditorialOpening content={content} />);
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();

        cleanup();
        vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
        render(<BlissEditorialOpening content={{ ...content, design: { showOpening: false } }} />);
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });

    it("reveals instantaneously under minimal studio motion", () => {
        render(<BlissEditorialOpening content={{ ...content, studioStyle: { motion: "minimal" } }} />);
        fireEvent.click(screen.getByRole("button", { name: "Turn the page" }));
        expect(screen.queryByRole("region", { name: "Wedding invitation cover" })).not.toBeInTheDocument();
    });
});

describe("RibbonOpening & FloatingAudioPlayer", () => {
    it("renders semantic open and skip buttons on RibbonOpening and reveals immediately under reduced motion", () => {
        vi.mocked(usePrefersReducedMotion).mockReturnValue(true);
        const onOpen = vi.fn();
        const onSkip = vi.fn();
        render(<RibbonOpening groom="Sokha" bride="Maly" onOpen={onOpen} onSkip={onSkip} />);

        const openBtn = screen.getByRole("button", { name: /Open invitation/ });
        expect(openBtn).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Skip opening/ })).toBeInTheDocument();

        fireEvent.click(openBtn);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("does not autoplay music on default mount without guest gesture", () => {
        const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        render(<FloatingAudioPlayer src="/audio/sample.mp3" />);
        expect(playSpy).not.toHaveBeenCalled();
    });
});
