import InvitationLightbox from "../shared/Gallery/InvitationLightbox";
import DemoRsvpNotice from "../shared/RSVP/DemoRsvpNotice";
import InvitationLabel from '@/features/templates/shared/InvitationLabel';
import Modal from '@/shared/ui/Modal';
import IllustratedMap from '@/features/templates/shared/IllustratedMap';
import { safeDirections } from '../shared/invitationFeatures';
import { safeIntroMedia } from '../shared/cinematicIntro';
import SaveTheDate from '../shared/SaveTheDate';
import AuthoredClosing from '../shared/AuthoredClosing';
import InvitationBranding from '../shared/InvitationBranding';
import AuthoredFamilies from '../shared/AuthoredFamilies';
import { authoredHeadingStyle } from '../shared/templateTypography';
import ProgramTimeline from '../shared/ProgramTimeline';
import ProgramDetails from "../shared/ProgramDetails";
import { useId, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, CheckCircle2, QrCode, Copy, Check, ExternalLink } from "lucide-react";
import FloatingAudioPlayer from "../shared/AudioPlayer/FloatingAudioPlayer";
import defaultMusicUrl from "../../../assets/music/Instrumental Wedding Music (VioSounds Cover).m4a";
import CoverBackground from "../shared/Openings/CoverBackground";
import { isTrustedPreviewMessage, readEmbeddedPreviewChannel } from "@/shared/preview/previewMessaging";
import BlissEditorialOpening from "./BlissEditorialOpening";
import "./bliss-editorial.css";

export default function BlissEditorialLayout({
  content = {},
  preview = false,
  previewChannel,
  showBack = true,
  backTo = "/templates",
  backLabel = "ត្រឡប់ទៅគំរូទាំងអស់",
  useTemplateLink,
  children,
}) {
  const rsvpId = useId();
  const [liveData, setLiveData] = useState(null);
  const effectiveContent = { ...content, ...liveData };

  useEffect(() => {
    const channel = previewChannel || readEmbeddedPreviewChannel();
    if (!channel) return undefined;
    const handleMessage = (e) => {
      if (!isTrustedPreviewMessage(e, channel)) return;
      if (e.data?.type === "LIVE_PREVIEW_SYNC" && e.data.data) {
        setLiveData(e.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewChannel]);

  const groom = effectiveContent.groom || "";
  const bride = effectiveContent.bride || "";
  const groomEn = effectiveContent.groomEn || "";
  const brideEn = effectiveContent.brideEn || "";
  const dateText = effectiveContent.dateText || "";
  const dateTextEn = effectiveContent.dateTextEn || "";
  const venue = effectiveContent.venue || {
    name: "",
    hall: "",
    address: "",
  };
  const defaultGallery = [
    "/images/wedding/couple-hero-meadow.webp",
    "/images/wedding/couple-celebration-confetti.webp",
    "/images/wedding/couple-studio-bow.webp",
    "/images/wedding/couple-garden-rings.webp",
  ];

  const galleryImages = (effectiveContent.gallery && effectiveContent.gallery.length)
    ? effectiveContent.gallery.map(img => safeIntroMedia(typeof img === "string" ? img : img.src || img.url)).filter(Boolean)
    : effectiveContent.hasHostContent ? [] : defaultGallery;
  const coverImage = safeIntroMedia(effectiveContent.coverImage) || galleryImages[0] || (effectiveContent.hasHostContent ? "" : "/images/wedding/couple-hero-meadow.webp");
  const musicUrl = effectiveContent.music?.url || effectiveContent.music || (effectiveContent.hasHostContent ? "" : defaultMusicUrl);

  // RSVP Drawer state & Gallery lightbox state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState("");
  const [rsvpState, setRsvpState] = useState({
    name: "",
    attending: "yes",
    guests: "1",
    note: "",
    submitted: false,
  });

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    setRsvpState((prev) => ({ ...prev, submitted: true }));
  };

  const handleCopyAccount = async (accountNum, key) => {
    if (!accountNum) return;
    try {
      await navigator.clipboard?.writeText(String(accountNum));
      setCopiedAccount(key);
      window.setTimeout(() => setCopiedAccount(""), 2000);
    } catch {
      setCopiedAccount("");
    }
  };

  const isEnabled = (key) => effectiveContent.enabledSections?.[key] !== false;
  const dressColors = Array.isArray(effectiveContent.dressCode)
    ? effectiveContent.dressCode
    : (Array.isArray(effectiveContent.dressCode?.colors) ? effectiveContent.dressCode.colors : (effectiveContent.dressColors || [
        { hex: "#2C2C2C", name: "Charcoal" },
        { hex: "#8E8279", name: "Taupe" },
        { hex: "#D6CFC7", name: "Cream" },
        { hex: "#FFFFFF", name: "White" },
      ]));
  const faqList = Array.isArray(effectiveContent.faq) && effectiveContent.faq.length > 0 ? effectiveContent.faq : [
    { id: "f1", q: "តើមានចំណតរថយន្តដែរឬទេ?", a: "បាទ/ចាស មានចំណតរថយន្តធំទូលាយដោយឥតគិតថ្លៃសម្រាប់ភ្ញៀវកិត្តិយសទាំងអស់។" },
    { id: "f2", q: "តើអាចនាំកុមារតូចៗមកបានទេ?", a: "យើងខ្ញុំស្វាគមន៍វត្តមានកុមារតូចៗទាំងអស់ក្នុងពិធីមង្គលការ។" },
    { id: "f3", q: "តើកម្មវិធីចាប់ផ្ដើម និងបញ្ចប់នៅម៉ោងប៉ុន្មាន?", a: "កម្មវិធីទទួលភ្ញៀវចាប់ផ្ដើមពីម៉ោង ០៥:០០ ល្ងាច តទៅ។" },
  ];
  const mapsHref = safeDirections(effectiveContent.googleMapsUrl || venue.mapLink || effectiveContent.googleMapUrl) || (
    (venue.name || venue.address)
      ? `https://maps.google.com/?q=${encodeURIComponent(`${venue.name || ""} ${venue.address || ""}`.trim())}`
      : ""
  );
  const safeQrUrl = safeIntroMedia(effectiveContent.bankAccount?.qrUrl);
  const giftEntries = Array.isArray(effectiveContent.gift) ? effectiveContent.gift.filter((item) => item && (item.account || item.number || item.qrUrl || item.qrValue)) : [];
  const hasBankGift = Boolean(effectiveContent.bankAccount?.accountNumber || effectiveContent.bankAccount?.qrUrl || giftEntries.length > 0);
  const isEnglishOnly = String(effectiveContent.languageMode).toLowerCase() === "en";

  return (
    <div className="bliss-container">
      <FloatingAudioPlayer src={musicUrl} />

      {/* Editorial Minimalist Header */}
      <header className="bliss-header">
        <div className="bliss-monogram">
          {(groomEn || groom).charAt(0)} &amp; {(brideEn || bride).charAt(0)}
        </div>
        <nav className="bliss-header-nav">
          <a href="#editorial-hero" className="bliss-header-link"><InvitationLabel value={"សេចក្តីផ្តើម"} /></a>
          {isEnabled("schedule") && <a href="#editorial-program" className="bliss-header-link"><InvitationLabel value={"កម្មវិធី"} /></a>}
          {isEnabled("gallery") && galleryImages.length > 0 && <a href="#editorial-spread" className="bliss-header-link"><InvitationLabel value={"កម្រងរូបភាព"} /></a>}
          {isEnabled("dressCode") && <a href="#editorial-dress" className="bliss-header-link">Dress Code</a>}
          {isEnabled("map") && (venue.name || venue.address || mapsHref || !effectiveContent.hasHostContent) && <a href="#editorial-venue" className="bliss-header-link"><InvitationLabel value={"ទីតាំង"} /></a>}
          {isEnabled("gift") && hasBankGift && <a href="#editorial-gift" className="bliss-header-link"><InvitationLabel value={"ចំណងដៃ"} /></a>}
          {isEnabled("faq") && faqList.length > 0 && <a href="#editorial-faq" className="bliss-header-link">FAQ</a>}
          {isEnabled("rsvp") && (
            <button type="button" className="bliss-rsvp-trigger" onClick={() => setDrawerOpen(true)}>
              RSVP
            </button>
          )}
          {showBack && (
            <Link to={backTo} className="bliss-header-link" style={{ color: "var(--bliss-charcoal)" }}>
              ← {backLabel}
            </Link>
          )}
        </nav>
      </header>

      {/* Split-Screen Hero */}
      <section id="editorial-hero" className="bliss-hero-split">
        <div className="bliss-hero-visual">
          <CoverBackground
            content={effectiveContent}
            templateDefault={{
              src: coverImage,
              type: "image",
              poster: coverImage,
            }}
          />
        </div>
        <div className="bliss-hero-editorial">
          <span className="bliss-issue-tag">{effectiveContent.title || 'THE WEDDING CELEBRATION'}</span>
          {effectiveContent.subtitle && <p>{effectiveContent.subtitle}</p>}
          <h1 className="bliss-editorial-names" style={authoredHeadingStyle(effectiveContent, groom + bride)}>
            {groom} &amp;<br />
            {bride}
          </h1>
          <p className="bliss-editorial-date">{dateText}</p>
          <AuthoredFamilies content={effectiveContent} />
          <blockquote className="bliss-quote">
            {effectiveContent.messageTitle && <p>{effectiveContent.messageTitle}</p>}
            {effectiveContent.message || 'សេចក្តីស្រឡាញ់ពិតមិនមែនជាការសម្លឹងមើលមុខគ្នានោះទេ ប៉ុន្តែជាការសម្លឹងទៅកាន់ទិសដៅតែមួយរួមគ្នាជាមួយមនុស្សជាទីស្រឡាញ់។'}
          </blockquote>
          {isEnabled("rsvp") && (
            <div>
              <button type="button" className="bliss-rsvp-trigger" onClick={() => setDrawerOpen(true)}><InvitationLabel value={"សូមបញ្ជាក់ការចូលរួម • RSVP NOW"} /></button>
            </div>
          )}
        </div>
      </section>

      {/* Editorial Program Section */}
      {isEnabled("countdown") && <section className="bliss-section"><SaveTheDate content={effectiveContent} /></section>}
      {isEnabled("schedule") && (
        <section id="editorial-program" className="bliss-section">
          <div className="bliss-section-heading">
            <p className="bliss-kicker">Order of Events</p>
            <h2 className="bliss-title"><InvitationLabel value={"កាលវិភាគពិធីមង្គលការ"} /></h2>
          </div>

          {(effectiveContent.programDays || effectiveContent.invitationStyleV1?.program) ? <ProgramTimeline content={effectiveContent} /> : <div className="bliss-program-list">{(effectiveContent.schedule || []).map((item, i) => <article className="bliss-program-row" key={item.id || i}><div className="bliss-program-time">{item.time}<ProgramDetails item={item} content={effectiveContent} /></div><div><h3 className="bliss-program-title">{item.title}</h3><p className="bliss-program-desc">{item.description}</p></div></article>)}</div>}
        </section>
      )}

      {/* Dress Code Section */}
      {isEnabled("dressCode") && dressColors.length > 0 && (
        <section id="editorial-dress" className="bliss-section" style={{ textAlign: "center", borderTop: "1px solid var(--bliss-border)" }}>
          <p className="bliss-kicker">Palette &amp; Attire</p>
          <h2 className="bliss-title" style={{ marginBottom: "1.5rem" }}>{effectiveContent.dressCode?.name || "ពណ៌សម្លៀកបំពាក់ (Dress Code)"}</h2>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", maxWidth: "600px", margin: "0 auto" }}>
            {dressColors.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    backgroundColor: c.hex,
                    border: "1px solid var(--bliss-border)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                />
                <span style={{ fontSize: "0.8rem", letterSpacing: "normal", color: "var(--bliss-charcoal)", textTransform: "uppercase" }}>{c.name}</span>
              </div>
            ))}
          </div>
          {effectiveContent.dressCode?.description && (
            <p style={{ color: "#59514B", maxWidth: "500px", margin: "1.5rem auto 0", lineHeight: "1.7", fontSize: "0.85rem" }}>
              {effectiveContent.dressCode.description}
            </p>
          )}
        </section>
      )}

      {/* Asymmetrical Gallery Spread */}
      {isEnabled("gallery") && galleryImages.length > 0 && (
        <section id="editorial-spread" className="bliss-section" style={{ borderTop: "1px solid var(--bliss-border)" }}>
          <div className="bliss-section-heading">
            <p className="bliss-kicker">Visual Editorial</p>
            <h2 className="bliss-title"><InvitationLabel value={"កម្រងអនុស្សាវរីយ៍"} /></h2>
          </div>

          <div className="bliss-gallery-spread">
            {galleryImages.slice(0, 4).map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => setActivePhoto(index)}
                className={`bliss-gallery-col-${index + 1} bliss-gallery-frame`}
                style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", width: "100%", display: "block", minHeight: "44px" }}
                aria-label={isEnglishOnly ? `Open photo ${index + 1}` : `ពង្រីករូបភាពទី ${index + 1}`}
              >
                <img src={src} alt={`Spread ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
          <InvitationLightbox images={galleryImages} index={activePhoto} onIndexChange={setActivePhoto} onClose={() => setActivePhoto(null)} />
        </section>
      )}

      {/* Venue Information */}
      {isEnabled("map") && (venue.name || venue.address || mapsHref || !effectiveContent.hasHostContent) && (
        <section id="editorial-venue" className="bliss-section" style={{ textAlign: "center", borderTop: "1px solid var(--bliss-border)" }}>
          <IllustratedMap content={effectiveContent} />
          <p className="bliss-kicker">The Destination</p>
          <h2 className="bliss-title" style={{ marginBottom: "1rem" }}>{venue.name}</h2>
          <p style={{ color: "#59514B", maxWidth: "500px", margin: "0 auto 2rem", lineHeight: "1.7" }}>
            {venue.address}
          </p>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                minHeight: "44px",
                padding: "0.5rem 0.75rem",
                fontSize: "0.85rem",
                letterSpacing: "normal",
                color: "var(--bliss-charcoal)",
                borderBottom: "1px solid var(--bliss-charcoal)",
                textDecoration: "none",
              }}
            >
              <InvitationLabel value={"មើលលើ Google Maps"} />
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
        </section>
      )}

      {/* Gift / KHQR Section */}
      {isEnabled("gift") && hasBankGift && (
        <section id="editorial-gift" className="bliss-section" style={{ textAlign: "center", borderTop: "1px solid var(--bliss-border)" }}>
          <div className="bliss-section-heading">
            <p className="bliss-kicker">Wedding Gift</p>
            <h2 className="bliss-title"><InvitationLabel value={"ចំណងដៃ & ពាក្យជូនពរ"} /></h2>
          </div>
          <div style={{ maxWidth: "460px", margin: "0 auto", background: "#ffffff", border: "1px solid var(--bliss-border)", borderRadius: "16px", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--bliss-charcoal)", marginBottom: "0.5rem" }}>
              {effectiveContent.bankAccount?.bank || giftEntries[0]?.bank || "Bank & KHQR"}
            </h3>
            {safeQrUrl ? (
              <img src={safeQrUrl} alt="KHQR" className="w-40 h-40 mx-auto object-contain rounded-lg mb-4" />
            ) : (
              <QrCode className="w-36 h-36 mx-auto text-stone-800 mb-4" aria-hidden="true" />
            )}
            {effectiveContent.bankAccount?.accountNumber && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--bliss-charcoal)" }}>
                  {effectiveContent.bankAccount.accountNumber}
                </p>
                {effectiveContent.bankAccount?.accountName && (
                  <p style={{ fontSize: "0.85rem", color: "#59514B" }}>{effectiveContent.bankAccount.accountName}</p>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyAccount(effectiveContent.bankAccount.accountNumber, "primary")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    minHeight: "44px",
                    padding: "0.5rem 1rem",
                    border: "1px solid var(--bliss-border)",
                    borderRadius: "999px",
                    background: "#faf7f2",
                    color: "var(--bliss-charcoal)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  {copiedAccount === "primary" ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  <InvitationLabel value={copiedAccount === "primary" ? "បានចម្លងលេខគណនី" : "ចម្លងលេខគណនី"} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {isEnabled("faq") && faqList.length > 0 && (
        <section id="editorial-faq" className="bliss-section" style={{ borderTop: "1px solid var(--bliss-border)" }}>
          <div className="bliss-section-heading">
            <p className="bliss-kicker">Q &amp; A</p>
            <h2 className="bliss-title"><InvitationLabel value={"សំណួរដែលសួរញឹកញាប់"} /></h2>
          </div>
          <div style={{ maxWidth: "650px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqList.map((item) => (
              <details
                key={item.id || item.q}
                style={{
                  borderBottom: "1px solid var(--bliss-border)",
                  paddingBottom: "1rem",
                }}
              >
                <summary style={{ fontWeight: "600", color: "var(--bliss-charcoal)", cursor: "pointer", fontSize: "0.95rem", minHeight: "44px", display: "flex", alignItems: "center" }}>
                  {item.q}
                </summary>
                <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#59514B", lineHeight: "1.7" }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ padding: "4rem 2rem", textAlign: "center", borderTop: "1px solid var(--bliss-border)" }}>
        <AuthoredClosing content={effectiveContent} />
        <p style={{ fontFamily: "Cinzel, serif", fontSize: "1.4rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
          {groomEn} &amp; {brideEn}
        </p>
        <p style={{ fontSize: "0.85rem", color: "#59514B", letterSpacing: "normal", marginBottom: "2rem" }}>
          {[venue.address || (!effectiveContent.hasHostContent ? "Phnom Penh, Cambodia" : ""), dateTextEn || dateText].filter(Boolean).join(" • ")}
        </p>
        {!preview && useTemplateLink && (
          <Link
            to={useTemplateLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              background: "var(--bliss-charcoal)",
              color: "#ffffff",
              padding: "0.8rem 2rem",
              fontSize: "0.85rem",
              letterSpacing: "normal",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            <InvitationLabel value={"ប្រើគំរូ Bliss Editorial នេះ"} />
          </Link>
        )}
        <InvitationBranding content={effectiveContent} />
      </footer>

      {/* Slide-out RSVP Drawer */}
      <Modal isOpen={drawerOpen} keepMounted onClose={() => setDrawerOpen(false)} ariaLabel="RSVP" showHeader={false} className="bliss-drawer open" backdropClassName="bliss-rsvp-backdrop">
        <button type="button" className="bliss-drawer-close" aria-label={String(effectiveContent.languageMode).toLowerCase() === 'en' ? 'Close RSVP' : 'បិទ RSVP'} onClick={() => setDrawerOpen(false)}>
          <X className="w-6 h-6" />
        </button>
        <h2 className="bliss-drawer-title">RSVP</h2>
        <p style={{ color: "var(--bliss-taupe)", fontSize: "0.9rem", marginBottom: "2rem" }}><InvitationLabel value={"សូមបញ្ជាក់ការចូលរួមរបស់លោកអ្នក"} /></p>

        {children || (rsvpState.submitted ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <CheckCircle2 className="w-14 h-14 text-stone-800 mx-auto mb-4" />
            <DemoRsvpNotice completed />
          </div>
        ) : (
          <form onSubmit={handleRsvpSubmit}>
            <DemoRsvpNotice />
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor={`${rsvpId}-name`} style={{ display: "block", fontSize: "0.8rem", letterSpacing: "normal", textTransform: "uppercase", marginBottom: "0.5rem" }}><InvitationLabel value={"ឈ្មោះពេញ (Full Name)"} /></label>
              <input
                type="text"
                required
                style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--bliss-border)", background: "var(--bliss-bg)" }}
                id={`${rsvpId}-name`} value={rsvpState.name}
                onChange={(e) => setRsvpState({ ...rsvpState, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", letterSpacing: "normal", textTransform: "uppercase", marginBottom: "0.5rem" }}><InvitationLabel value={"ការចូលរួម (Attendance)"} /></label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="bliss-attending"
                    value="yes"
                    checked={rsvpState.attending === "yes"}
                    onChange={(e) => setRsvpState({ ...rsvpState, attending: e.target.value })}
                  /><InvitationLabel value={"ចូលរួម (Yes)"} /></label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="bliss-attending"
                    value="no"
                    checked={rsvpState.attending === "no"}
                    onChange={(e) => setRsvpState({ ...rsvpState, attending: e.target.value })}
                  /><InvitationLabel value={"មិនអាចចូលរួម (No)"} /></label>
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label htmlFor={`${rsvpId}-note`} style={{ display: "block", fontSize: "0.8rem", letterSpacing: "normal", textTransform: "uppercase", marginBottom: "0.5rem" }}><InvitationLabel value={"ពាក្យជូនពរ (Blessing Note)"} /></label>
              <textarea
                rows="4"
                style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--bliss-border)", background: "var(--bliss-bg)" }}
                placeholder="សរសេរពាក្យជូនពរ..."
                id={`${rsvpId}-note`} value={rsvpState.note}
                onChange={(e) => setRsvpState({ ...rsvpState, note: e.target.value })}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                background: "var(--bliss-charcoal)",
                color: "#ffffff",
                padding: "0.9rem",
                border: "none",
                fontSize: "0.85rem",
                letterSpacing: "normal",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            ><InvitationLabel value={"ផ្ញើការឆ្លើយតប • SUBMIT"} /></button>
          </form>
        ))}
      </Modal>

      {/* Opt-in ceremony opening; bypassed under reduced motion / preview. */}
      <BlissEditorialOpening content={effectiveContent} preview={preview} />
    </div>
  );
}
