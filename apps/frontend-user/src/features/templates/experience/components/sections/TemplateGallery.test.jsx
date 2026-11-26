import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TemplateGallery from "./TemplateGallery";

afterEach(cleanup);

describe("TemplateGallery", () => {
    const sampleImages = [
        { src: "/images/wedding1.jpg", span: "large" },
        { src: "/images/wedding2.jpg", span: "small" },
        { src: "/images/wedding3.jpg", span: "small" },
    ];

    it("renders gallery items with appropriate accessible labels", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        const buttons = screen.getAllByRole("button", { name: /មើលរូបភាពទី/i });
        expect(buttons).toHaveLength(3);
    });

    it("opens lightbox on item click and displays navigation and counter", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        const firstItem = screen.getByRole("button", { name: "មើលរូបភាពទី 1" });
        fireEvent.click(firstItem);

        // Lightbox dialog should be open
        const dialog = screen.getByRole("dialog", { name: "រូបភាព" });
        expect(dialog).toBeInTheDocument();

        // Counter should show 1 / 3
        expect(screen.getByText("1 / 3")).toBeInTheDocument();

        // Prev and Next buttons
        const nextBtn = screen.getByRole("button", { name: "រូបភាពបន្ទាប់" });
        const prevBtn = screen.getByRole("button", { name: "រូបភាពមុន" });
        expect(nextBtn).toBeInTheDocument();
        expect(prevBtn).toBeInTheDocument();

        // Clicking next updates counter to 2 / 3
        fireEvent.click(nextBtn);
        expect(screen.getByText("2 / 3")).toBeInTheDocument();

        // Clicking prev goes back to 1 / 3
        fireEvent.click(prevBtn);
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("navigates images with keyboard ArrowRight and ArrowLeft", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));
        expect(screen.getByText("1 / 3")).toBeInTheDocument();

        fireEvent.keyDown(window, { key: "ArrowRight" });
        expect(screen.getByText("2 / 3")).toBeInTheDocument();

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("supports Home and End keys to jump to the first and last image", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));

        fireEvent.keyDown(window, { key: "End" });
        expect(screen.getByText("3 / 3")).toBeInTheDocument();

        fireEvent.keyDown(window, { key: "Home" });
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("moves focus into the dialog on open and restores it to the invoking thumbnail on close", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        const trigger = screen.getByRole("button", { name: "មើលរូបភាពទី 2" });
        fireEvent.click(trigger);

        const closeBtn = screen.getByRole("button", { name: "បិទ" });
        expect(closeBtn).toHaveFocus();

        fireEvent.click(closeBtn);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("traps Tab inside the dialog in both directions", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));

        const closeBtn = screen.getByRole("button", { name: "បិទ" });
        const nextBtn = screen.getByRole("button", { name: "រូបភាពបន្ទាប់" });
        expect(closeBtn).toHaveFocus();

        // Shift+Tab from the first control wraps to the last control.
        fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
        expect(nextBtn).toHaveFocus();

        // Tab from the last control wraps back to the first.
        fireEvent.keyDown(window, { key: "Tab" });
        expect(closeBtn).toHaveFocus();
    });

    it("closes lightbox with close button or Escape key and restores body overflow", () => {
        render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(document.body.style.overflow).toBe("hidden");

        const closeBtn = screen.getByRole("button", { name: "បិទ" });
        fireEvent.click(closeBtn);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe("");

        // Test Escape key
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe("");
    });

    it("falls back to TemplateImage's placeholder when the lightbox image fails", () => {
        const { container } = render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));

        const lightboxImage = container.querySelector(".tx-lightbox .tx-lightbox__img");
        expect(lightboxImage).toBeInTheDocument();
        fireEvent.error(lightboxImage);

        expect(container.querySelector(".tx-lightbox .tx-image-fallback")).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("always releases the body scroll lock when unmounted while open", () => {
        const { unmount } = render(<TemplateGallery content={{ gallery: sampleImages }} />);
        fireEvent.click(screen.getByRole("button", { name: "មើលរូបភាពទី 1" }));
        expect(document.body.style.overflow).toBe("hidden");

        act(() => unmount());
        expect(document.body.style.overflow).toBe("");
    });
});
