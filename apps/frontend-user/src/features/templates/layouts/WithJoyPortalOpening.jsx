import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

const REVEAL_MS = 700;

/**
 * WithJoyPortalOpening — an original, opt-in ceremony cover for the
 * "withjoy-modern-portal" renderer.
 *
 * The invitation is always mounted underneath; this layer is a pure,
 * guest-initiated reveal (one tap). Two glassmorphism panels part vertically
 * and the splash card fades away over transform/opacity only. There is no
 * focus trap, no scroll lock, no audio, and the gate is skipped entirely under
 * prefers-reduced-motion or inside the studio preview.
 */
export default function WithJoyPortalOpening({ content = {}, preview = false, onOpen }) {
    const reduced = usePrefersReducedMotion();
    const [phase, setPhase] = useState("idle");
    const timerRef = useRef(null);
    const isEn = String(content.languageMode).toLowerCase() === "en";
    const optedOut = content.design?.showOpening === false || content.openingStyle === "none";
    const bypassed = reduced || preview || optedOut;

    useEffect(() => () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    }, []);

    const finish = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setPhase("done");
    }, []);

    const reveal = useCallback(() => {
        if (phase !== "idle") return;
        setPhase("opening");
        onOpen?.();
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            setPhase("done");
        }, REVEAL_MS);
    }, [onOpen, phase]);

    useEffect(() => {
        if (bypassed || phase === "done") return undefined;
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                finish();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [bypassed, finish, phase]);

    if (bypassed || phase === "done") return null;

    const opening = phase === "opening";
    const groom = content.groom || "";
    const bride = content.bride || "";

    return (
        <div
            className="wj-opening"
            data-state={opening ? "opening" : "idle"}
            role="region"
            aria-label={isEn ? "Wedding invitation cover" : "គម្របសំបុត្រអញ្ជើញ"}
        >
            <div className="wj-opening__panel wj-opening__panel--top" aria-hidden="true" />
            <div className="wj-opening__panel wj-opening__panel--bottom" aria-hidden="true" />

            <div className="wj-opening__card">
                <span className="wj-opening__tag">{isEn ? "Digital Wedding Invitation" : "សំបុត្រអញ្ជើញឌីជីថល"}</span>
                <p className="wj-opening__names">
                    {groom}
                    <span aria-hidden="true"> &amp; </span>
                    {bride}
                </p>
                {content.dateText && <p className="wj-opening__date">{content.dateText}</p>}
                {content.subtitle && <p className="wj-opening__subtitle">{content.subtitle}</p>}
                <div className="wj-opening__actions">
                    <button type="button" className="wj-opening__enter" onClick={reveal} disabled={opening}>
                        {opening
                            ? (isEn ? "Opening…" : "កំពុងបើក…")
                            : (isEn ? "Open invitation" : "បើកសំបុត្រអញ្ជើញ")}
                    </button>
                    <button type="button" className="wj-opening__skip" onClick={finish}>
                        {isEn ? "Skip opening" : "រំលងការបើក"}
                    </button>
                </div>
            </div>
        </div>
    );
}
