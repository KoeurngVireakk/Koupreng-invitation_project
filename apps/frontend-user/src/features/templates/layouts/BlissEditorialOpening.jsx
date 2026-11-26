import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

const REVEAL_MS = 700;

/**
 * BlissEditorialOpening — an original, opt-in ceremony cover for the
 * "bliss-editorial-wedding" renderer.
 *
 * A printed magazine cover lifts away like a turned page (transform/opacity
 * only) to reveal the editorial invitation beneath. Guest-initiated with one
 * tap, skippable, no focus trap, no scroll lock, no audio, and completely
 * bypassed under prefers-reduced-motion or in the studio preview.
 */
export default function BlissEditorialOpening({ content = {}, preview = false, onOpen }) {
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
            className="bliss-opening"
            data-state={opening ? "opening" : "idle"}
            role="region"
            aria-label={isEn ? "Wedding invitation cover" : "គម្របសំបុត្រអញ្ជើញ"}
        >
            <div className="bliss-opening__stage" aria-hidden="true">
                <span className="bliss-opening__rule" />
            </div>

            <article className="bliss-opening__cover">
                <p className="bliss-opening__issue">{isEn ? "The Wedding Edition — No. 01" : "បោះពុម្ពមង្គល — លេខ ០១"}</p>
                <h2 className="bliss-opening__masthead">
                    {content.title || (isEn ? "The Wedding Issue" : "មង្គលការ")}
                </h2>
                <span className="bliss-opening__hairline" aria-hidden="true" />
                <p className="bliss-opening__names">
                    {groom} <span aria-hidden="true">&amp;</span> {bride}
                </p>
                {content.dateText && <p className="bliss-opening__date">{content.dateText}</p>}
                {content.subtitle && <p className="bliss-opening__subtitle">{content.subtitle}</p>}
                <div className="bliss-opening__actions">
                    <button type="button" className="bliss-opening__turn" onClick={reveal} disabled={opening}>
                        {opening
                            ? (isEn ? "Turning…" : "កំពុងបើក…")
                            : (isEn ? "Turn the page" : "បើកទំព័រ")}
                    </button>
                    <button type="button" className="bliss-opening__skip" onClick={finish}>
                        {isEn ? "Skip opening" : "រំលងការបើក"}
                    </button>
                </div>
            </article>
        </div>
    );
}
