import { useCallback, useContext, useEffect, useState } from "react";
import { templateIcons } from "../../config/templateIcons";
import { InvitationLocaleContext } from "../../../shared/invitationLocaleContext";
import { useLanguageStore } from "@/stores/useLanguageStore";

const NAV_ITEMS = [
    { section: "schedule", labelKm: "កម្មវិធី", labelEn: "Program", icon: templateIcons.schedule },
    { section: "venue", labelKm: "ទីតាំង", labelEn: "Venue", icon: templateIcons.venue },
    { section: "gallery", labelKm: "រូបភាព", labelEn: "Gallery", icon: templateIcons.gallery },
    { section: "gift", labelKm: "ចំណងដៃ", labelEn: "Gift QR", icon: templateIcons.gift },
    { section: "rsvp", labelKm: "ឆ្លើយតប", labelEn: "RSVP", icon: templateIcons.invitation },
    { section: "footer", labelKm: "អរគុណ", labelEn: "Thanks", icon: templateIcons.thank },
];

const COMPACT_QUERY = "(max-width: 359px)";

function isTextField(element) {
    if (!element || element.nodeType !== 1) return false;
    const tag = element.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable === true;
}

function useCompactViewport() {
    const [compact, setCompact] = useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
        return window.matchMedia(COMPACT_QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
        const query = window.matchMedia(COMPACT_QUERY);
        const onChange = (event) => setCompact(event.matches);
        setCompact(query.matches);
        query.addEventListener?.("change", onChange);
        return () => query.removeEventListener?.("change", onChange);
    }, []);

    return compact;
}

/**
 * TemplateQuickNav — the mobile action dock for the guest invitation.
 *
 * Stays clear of the device safe area, collapses labels to icons under 360px,
 * gives RSVP the single primary emphasis, and hides itself while a form field
 * is focused (or the on-screen keyboard is open) so it never covers the RSVP
 * form. It also steps aside while the RSVP section is on screen.
 */
export default function TemplateQuickNav({ enabledSections, onNavigate, languageMode }) {
    const localeContext = useContext(InvitationLocaleContext);
    const storeLang = useLanguageStore((state) => state.lang);
    const effectiveLang = languageMode || (localeContext && localeContext !== "both" ? localeContext : storeLang) || "km";
    const isEn = String(effectiveLang).toLowerCase() === "en";
    const compact = useCompactViewport();

    const [fieldFocused, setFieldFocused] = useState(false);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [rsvpInView, setRsvpInView] = useState(false);

    const items = NAV_ITEMS.filter(({ section }) => {
        if (section === "footer") return true;
        const key = section === "venue" ? "map" : section;
        return enabledSections?.[key] !== false;
    });

    const handleNavigate = useCallback((section) => {
        onNavigate?.(section);
    }, [onNavigate]);

    // Hide the dock while the guest is typing so it cannot obscure the field
    // or the RSVP submit button on small screens.
    useEffect(() => {
        if (typeof document === "undefined") return undefined;

        const onFocus = (event) => {
            // Any focus move tells us exactly where the guest is; only text
            // fields should hide the dock.
            setFieldFocused(isTextField(event.target));
        };
        const onBlur = () => {
            window.setTimeout(() => {
                if (!isTextField(document.activeElement)) setFieldFocused(false);
            }, 0);
        };

        document.addEventListener("focusin", onFocus);
        document.addEventListener("focus", onFocus, true);
        document.addEventListener("focusout", onBlur);
        document.addEventListener("blur", onBlur, true);
        return () => {
            document.removeEventListener("focusin", onFocus);
            document.removeEventListener("focus", onFocus, true);
            document.removeEventListener("focusout", onBlur);
            document.removeEventListener("blur", onBlur, true);
        };
    }, []);

    // On-screen keyboards shrink the visual viewport without firing blur in
    // some mobile browsers; treat a large shrink as "field focused".
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const viewport = window.visualViewport;
        if (!viewport) return undefined;

        const onResize = () => {
            const shrink = window.innerHeight - viewport.height;
            setKeyboardOpen(shrink > 140);
        };
        viewport.addEventListener("resize", onResize);
        return () => viewport.removeEventListener("resize", onResize);
    }, []);

    // Step aside while the RSVP card is on screen so it never covers the form.
    useEffect(() => {
        if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") return undefined;
        const rsvp = document.querySelector('[data-tx-section="rsvp"]');
        if (!rsvp) return undefined;
        const observer = new IntersectionObserver((entries) => {
            setRsvpInView(entries.some((entry) => entry.isIntersecting));
        }, { threshold: 0.2 });
        observer.observe(rsvp);
        return () => observer.disconnect();
    }, []);

    const hidden = fieldFocused || keyboardOpen || rsvpInView;

    return (
        <nav
            className={`tx-quick-nav${hidden ? " is-hidden" : ""}`}
            aria-label={isEn ? "Invitation navigation" : "រុករកសន្លឹកការ"}
            aria-hidden={hidden ? "true" : undefined}
            data-compact={compact ? "true" : undefined}
            style={{ "--tx-quick-nav-count": items.length }}
        >
            {items.map(({ section, labelKm, labelEn, icon: Icon }) => {
                const label = isEn ? labelEn : labelKm;
                const isPrimary = section === "rsvp";
                return (
                    <button
                        key={section}
                        type="button"
                        className={`tx-quick-nav__item${isPrimary ? " tx-quick-nav__item--primary" : ""}`}
                        onClick={() => handleNavigate(section)}
                        title={label}
                        aria-label={label}
                    >
                        <Icon className="tx-quick-nav__icon" aria-hidden="true" />
                        <span className="tx-quick-nav__label">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
