import { useCallback, useEffect, useRef, useState } from "react";
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";

import TemplateReveal from "../shared/TemplateReveal";
import TemplateImage from "../shared/TemplateImage";
import TemplateSectionHeader from "../shared/TemplateSectionHeader";
import { templateIcons } from "../../config/templateIcons";

const FOCUSABLE_SELECTOR = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * TemplateGallery — adaptive masonry gallery with an accessible, full-screen lightbox.
 *
 * The lightbox moves focus inside the dialog on open, traps Tab inside it,
 * restores focus to the thumbnail that opened it on close, and supports
 * Escape / ArrowLeft / ArrowRight / Home / End. Broken images fall back to the
 * shared TemplateImage placeholder, and body scroll is always released.
 */
export default function TemplateGallery({ content = {} }) {
    const images = content?.gallery || [];
    const [activeIndex, setActiveIndex] = useState(null);
    const isOpen = activeIndex !== null;

    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const thumbnailRefs = useRef([]);
    const lastTriggerRef = useRef(null);

    const close = useCallback(() => setActiveIndex(null), []);

    const openAt = useCallback((index) => {
        lastTriggerRef.current = thumbnailRefs.current[index] || null;
        setActiveIndex(index);
    }, []);

    const prev = useCallback((event) => {
        event?.stopPropagation();
        setActiveIndex((current) => {
            if (current === null) return current;
            return current > 0 ? current - 1 : images.length - 1;
        });
    }, [images.length]);

    const next = useCallback((event) => {
        event?.stopPropagation();
        setActiveIndex((current) => {
            if (current === null) return current;
            return current < images.length - 1 ? current + 1 : 0;
        });
    }, [images.length]);

    const first = useCallback((event) => {
        event?.stopPropagation();
        setActiveIndex((current) => (current === null ? current : 0));
    }, []);

    const last = useCallback((event) => {
        event?.stopPropagation();
        setActiveIndex((current) => (current === null ? current : images.length - 1));
    }, [images.length]);

    // Move focus into the dialog on open and hand it back to the invoking
    // thumbnail on close/unmount so keyboard users never lose their place.
    useEffect(() => {
        if (!isOpen) return undefined;
        const trigger = lastTriggerRef.current;
        const target = closeButtonRef.current || dialogRef.current;
        target?.focus?.({ preventScroll: true });
        return () => {
            trigger?.focus?.({ preventScroll: true });
        };
    }, [isOpen]);

    // Release the scroll lock whenever the dialog closes or the gallery
    // unmounts while it is still open.
    useEffect(() => {
        if (!isOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                close();
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prev();
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                next();
                return;
            }
            if (event.key === "Home") {
                event.preventDefault();
                first();
                return;
            }
            if (event.key === "End") {
                event.preventDefault();
                last();
                return;
            }
            if (event.key !== "Tab") return;

            const dialog = dialogRef.current;
            if (!dialog) return;
            const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR));
            if (!focusables.length) {
                event.preventDefault();
                dialog.focus?.({ preventScroll: true });
                return;
            }
            const firstFocusable = focusables[0];
            const lastFocusable = focusables[focusables.length - 1];
            const active = document.activeElement;
            const focusIsInside = dialog.contains(active);

            if (event.shiftKey) {
                if (!focusIsInside || active === firstFocusable) {
                    event.preventDefault();
                    lastFocusable.focus?.();
                }
                return;
            }
            if (!focusIsInside || active === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus?.();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, close, prev, next, first, last]);

    if (!images.length) return null;

    return (
        <section className="tx-section tx-gallery" data-tx-section="gallery" aria-labelledby="tx-gallery-title">
            <div className="tx-shell">
                <TemplateSectionHeader
                    id="tx-gallery-title"
                    icon={templateIcons.gallery}
                    kicker="រូបភាព"
                    title="អនុស្សាវរីយ៍ស្នេហា"
                    subtitle="OUR GALLERY"
                />

                {images.length ? (
                    <TemplateReveal className="tx-gallery__grid">
                        {images.map((img, index) => {
                            const src = typeof img === "string" ? img : img?.src;
                            return (
                                <button
                                    type="button"
                                    key={`${src}-${index}`}
                                    ref={(node) => {
                                        thumbnailRefs.current[index] = node;
                                    }}
                                    className={`tx-gallery__item is-${img?.span || "small"}`}
                                    onClick={() => openAt(index)}
                                    aria-label={`មើលរូបភាពទី ${index + 1}`}
                                    aria-haspopup="dialog"
                                >
                                    <TemplateImage src={src} alt={`អនុស្សាវរីយ៍ ${index + 1}`} />
                                    <span className="tx-gallery__overlay" aria-hidden="true" />
                                </button>
                            );
                        })}
                    </TemplateReveal>
                ) : null}
            </div>

            {isOpen && (
                <div
                    ref={dialogRef}
                    className="tx-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="រូបភាព"
                    tabIndex={-1}
                    onClick={close}
                >
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="tx-lightbox__close"
                        onClick={close}
                        aria-label="បិទ"
                    >
                        <IoClose aria-hidden="true" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="tx-lightbox__nav-btn tx-lightbox__nav-btn--prev"
                                onClick={prev}
                                aria-label="រូបភាពមុន"
                            >
                                <IoChevronBack aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="tx-lightbox__nav-btn tx-lightbox__nav-btn--next"
                                onClick={next}
                                aria-label="រូបភាពបន្ទាប់"
                            >
                                <IoChevronForward aria-hidden="true" />
                            </button>
                            <div className="tx-lightbox__counter" aria-live="polite">
                                {activeIndex + 1} / {images.length}
                            </div>
                        </>
                    )}

                    <div className="tx-lightbox__figure" onClick={(event) => event.stopPropagation()}>
                        <TemplateImage
                            className="tx-lightbox__img"
                            src={images[activeIndex]?.src}
                            alt={`អនុស្សាវរីយ៍ ${activeIndex + 1}`}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
