import { useEffect, useRef, useState } from "react";
import { Ticket } from 'lucide-react';
import TicketModal from "./TicketModal";

function isTextField(element) {
  if (!element || element.nodeType !== 1) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable === true;
}

export default function PublicTicketAccess({ slug, token, accessToken, languageMode, displayContent, compact = false }) {
  const [open, setOpen] = useState(false);
  const [keyboardHidden, setKeyboardHidden] = useState(false);
  const trigger = useRef(null);
  const label = String(languageMode).toLowerCase() === "en" ? (token ? "My ticket" : "Invitation ticket") : token ? "កាតរបស់ខ្ញុំ · My ticket" : "កាតអញ្ជើញ · Invitation ticket";

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return undefined;
    const onFocusIn = (event) => {
      if (isTextField(event.target)) setKeyboardHidden(true);
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isTextField(document.activeElement)) setKeyboardHidden(false);
      }, 0);
    };
    const vv = window.visualViewport;
    const onViewportResize = () => {
      if (!vv) return;
      setKeyboardHidden(window.innerHeight - vv.height > 140 || isTextField(document.activeElement));
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    vv?.addEventListener("resize", onViewportResize);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      vv?.removeEventListener("resize", onViewportResize);
    };
  }, []);

  return <>
    <meta name="referrer" content="no-referrer" />
    <meta name="robots" content="noindex,nofollow" />
    <button
      ref={trigger}
      type="button"
      className="public-ticket-button"
      data-compact={compact || undefined}
      data-keyboard-hidden={keyboardHidden || undefined}
      aria-label={label}
      aria-hidden={keyboardHidden ? "true" : undefined}
      tabIndex={keyboardHidden ? -1 : undefined}
      title={label}
      onClick={() => { trigger.current?.focus(); setOpen(true); }}
    >
      {compact ? <Ticket size={20} aria-hidden="true" /> : label}
    </button>
    {open && <TicketModal displayContent={displayContent} slug={slug} publicParams={{ token, accessToken }} onClose={() => setOpen(false)} />}
  </>;
}
