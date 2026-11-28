import { useState, useRef } from "react";
import { IoAddOutline, IoChevronDownOutline, IoSearchOutline } from "react-icons/io5";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { getGuestLabel } from "./guestLabels";
import { budgetMoney } from '@/features/budget/currencyTotals';

function isGiftForGuest(gift, guest, guests) {
    if (gift.guestId != null) return String(gift.guestId) === String(guest.id);
    const matchingGuests = guests.filter((candidate) => candidate.name === guest.name);
    return matchingGuests.length === 1 && gift.name === guest.name;
}

export function GuestSelectField({ value, guestId, onChange, options = [], placeholder, existingGifts = [], ariaLabel, t }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef();
    useClickOutside(ref, () => {
        setOpen(false);
        setQuery("");
    });

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = options.filter((guest) => {
        const label = getGuestLabel(guest, options).toLowerCase();
        const details = [guest.phone, guest.side, guest.group].filter(Boolean).join(" ").toLowerCase();
        return label.includes(normalizedQuery) || details.includes(normalizedQuery);
    });
    const isCustom = normalizedQuery && !options.some((guest) => guest.name.toLowerCase() === normalizedQuery);

    const selectedById = guestId == null ? null : options.find((guest) => String(guest.id) === String(guestId));
    const sameNameOptions = options.filter((guest) => guest.name === value);
    const selectedOption = selectedById
        || (sameNameOptions.length === 1 ? sameNameOptions[0] : null)
        || (value ? { name: value } : null);
    const selectedLabel = selectedOption ? getGuestLabel(selectedOption, options) : "";
    const existingGiftForSelected = selectedOption
        ? existingGifts.find((gift) => isGiftForGuest(gift, selectedOption, options))
        : null;

    const selectGuest = (guest) => {
        onChange({ name: guest.name, guestId: guest.id ?? null });
        setOpen(false);
        setQuery("");
    };

    const selectCustomName = (name) => {
        onChange({ name, guestId: null });
        setOpen(false);
        setQuery("");
    };

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            <button
                type="button"
                aria-label={`${selectedLabel || placeholder}${ariaLabel ? ` — ${ariaLabel}` : ""}`}
                aria-expanded={open}
                data-gift-name-input="true"
                onClick={() => setOpen(!open)}
                style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px",
                    width: "100%", padding: "8px 12px", border: existingGiftForSelected ? "1.5px solid var(--ui-theme-danger, #e11d48)" : "1px solid var(--app-border)",
                    borderRadius: "10px", background: "var(--app-surface)", fontSize: "13.5px",
                    cursor: "pointer", color: value ? "var(--app-ink)" : "var(--app-muted)", textAlign: "left",
                    fontFamily: "inherit", minHeight: "44px", minWidth: 0, transition: "border-color 0.2s"
                }}
            >
                {selectedOption ? (
                    <span style={{ fontWeight: 600, color: "var(--app-ink)", fontSize: "13.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                        {selectedLabel}
                    </span>
                ) : (
                    <span style={{ color: "var(--app-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{placeholder}</span>
                )}
                <IoChevronDownOutline style={{ 
                    fontSize: "15px", color: "var(--app-muted)", flexShrink: 0,
                    transform: open ? "rotate(180deg)" : "none", 
                    transition: "transform 0.2s ease" 
                }} />
            </button>

            {existingGiftForSelected && !open && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ color: "var(--ui-theme-danger, #e11d48)", fontSize: "12.5px", marginBottom: "6px" }}>
                        {t ? t("alreadyGiven") || "This guest has already given a gift." : "This guest has already given a gift."}
                    </div>
                    <div style={{ 
                        display: "inline-block", background: "var(--ui-theme-info-soft, #dbeafe)", color: "var(--ui-theme-info, #1d4ed8)", 
                        padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "500"
                    }}>
                        {existingGiftForSelected.method?.toUpperCase() || '—'}: {budgetMoney(existingGiftForSelected.amount, existingGiftForSelected.currency || 'USD')}
                    </div>
                </div>
            )}

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, minWidth: "240px",
                    background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "12px",
                    boxShadow: "var(--ui-theme-shadow-elevated, 0 10px 24px rgba(80,55,20,0.12))", zIndex: 20,
                    padding: "8px", display: "flex", flexDirection: "column", gap: "8px"
                }}>
                    <div style={{ position: "relative" }}>
                        <IoSearchOutline style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--app-muted)", fontSize: "18px" }} />
                        <input 
                            aria-label={placeholder}
                            type="text" 
                            value={query} 
                            onChange={e => setQuery(e.target.value)} 
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (query.trim() && isCustom) {
                                        selectCustomName(query.trim());
                                    } else if (filtered.length > 0) {
                                        selectGuest(filtered[0]);
                                    }
                                }
                            }}
                            placeholder={placeholder} 
                            style={{ 
                                width: "100%", padding: "10px 10px 10px 36px", border: "none", borderBottom: "1px solid #f0f0f0", 
                                borderRadius: "0", fontSize: "15px", boxSizing: "border-box", outline: "none",
                                fontFamily: "inherit"
                            }} 
                            autoFocus
                        />
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                        {isCustom && (
                            <button
                                type="button"
                                onClick={() => selectCustomName(query.trim())}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px", width: "100%", 
                                    padding: "12px 14px", border: "none", background: "var(--app-subtle)",
                                    textAlign: "left", cursor: "pointer", fontSize: "14px", color: "#B0926A",
                                    borderRadius: "8px", fontWeight: "bold", marginBottom: "4px",
                                    fontFamily: "inherit"
                                }}
                            >
                                <IoAddOutline /> {t ? t("useNewName") || "ប្រើឈ្មោះថ្មី:" : "ប្រើឈ្មោះថ្មី:"} "{query.trim()}"
                            </button>
                        )}
                        {filtered.length === 0 && !isCustom && (
                            <div style={{ padding: "16px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                                {t ? t("noData") || "មិនមានទិន្នន័យ" : "មិនមានទិន្នន័យ"}
                            </div>
                        )}
                        {filtered.map(g => {
                            const pastGift = existingGifts.find((gift) => isGiftForGuest(gift, g, options));
                            return (
                                <button
                                    key={g.id || g.name}
                                    type="button"
                                    aria-label={getGuestLabel(g, options)}
                                    onClick={() => selectGuest(g)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "10px", width: "100%", 
                                        padding: "10px 14px", border: "none", background: "transparent",
                                        textAlign: "left", cursor: "pointer", fontSize: "14px", color: "var(--app-ink)",
                                        borderBottom: "1px solid #f9f9f9", transition: "background 0.2s",
                                        fontFamily: "inherit"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = "var(--app-subtle)"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    <span style={{ flexGrow: 1, display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                                        {getGuestLabel(g, options)}
                                        {pastGift && (
                                            <span style={{ 
                                                background: "#FB7185", color: "white", padding: "2px 8px", 
                                                borderRadius: "12px", fontSize: "11px", fontWeight: "500" 
                                            }}>
                                                {t ? t("givenGift") || "Given Gift" : "Given Gift"}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuestSelectField;
