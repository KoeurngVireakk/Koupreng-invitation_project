import { ArrowDown } from "lucide-react";

export default function OpenInvitationCTA({ label = "Open invitation", onOpen, autoFocus = true }) {
  return (
    <div className="kc-opening__cta-wrapper">
      <button
        type="button"
        className="kc-opening__button kc-opening__cta-button"
        onClick={onOpen}
        autoFocus={autoFocus}
      >
        <span>{label}</span>
        <ArrowDown size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
