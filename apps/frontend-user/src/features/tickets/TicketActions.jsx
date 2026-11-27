import { useEffect, useState } from "react";
import { copyText } from "@/features/guests/model/guestMappers";
import { renderTicket, ticketBlob } from "./ticketRenderer";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { isInAppBrowser } from "@/shared/telegram/telegramWebApp";
import { Download, Share2, Copy, Printer } from "lucide-react";

export default function TicketActions({ ticket, ready, languageMode }) {
  const uiLanguage = useLanguageStore(state => state.lang);
  const en = languageMode ? String(languageMode).toLowerCase() === "en" : uiLanguage === "en";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [fallbackImageUrl, setFallbackImageUrl] = useState("");
  const inAppBrowser = isInAppBrowser();

  useEffect(() => {
    return () => {
      if (fallbackImageUrl) URL.revokeObjectURL(fallbackImageUrl);
    };
  }, [fallbackImageUrl]);

  async function perform(action) {
    setBusy(true); setMessage("");
    try { await action(); }
    catch (error) {
      if (error.name !== "AbortError") {
        setMessage(error.message || (en ? "The action failed. Please retry." : "សកម្មភាពមិនបានសម្រេចទេ។ សូមព្យាយាមម្ដងទៀត។"));
      }
    } finally { setBusy(false); }
  }
  async function file(scale = 2) {
    const canvas = document.createElement("canvas");
    await renderTicket(canvas, ticket, scale);
    return new File([await ticketBlob(canvas)], "invitation-ticket.png", { type: "image/png" });
  }
  async function download(scale) {
    const png = await file(scale);
    const url = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = png.name;
    anchor.click();
    if (inAppBrowser) {
      if (fallbackImageUrl) URL.revokeObjectURL(fallbackImageUrl);
      setFallbackImageUrl(url);
      setMessage(en
        ? "In-app browser detected: if auto-download is blocked, long-press the ticket image below to save."
        : "ប្រើប្រាស់ក្នុងកម្មវិធីផ្ញើសារ៖ បើទាញយកស្វ័យប្រវត្តិមិនបាន សូមចុចឱ្យជាប់លើរូបភាពកាតខាងក្រោមដើម្បីរក្សាទុក។");
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(en ? `PNG ready · ${600 * scale} × ${900 * scale}px` : `រួចរាល់ · ${600 * scale} × ${900 * scale}px`);
  }
  async function share() {
    const png = await file();
    if (navigator.canShare?.({ files: [png] })) await navigator.share({ files: [png], title: "Invitation ticket" });
    else if (navigator.share) await navigator.share({ url: ticket.invitationUrl, title: "Invitation" });
    else {
      if (!await copyText(ticket.invitationUrl)) {
        throw new Error(en ? "Copy is unavailable. Please download the ticket to share it." : "មិនអាចចម្លងបានទេ។ សូមទាញយករូបភាពកាតដើម្បីចែករំលែក។");
      }
      setMessage(en ? "Invitation link copied. You can also download the PNG to send it." : "បានចម្លងតំណសំបុត្រអញ្ជើញ។ លោកអ្នកក៏អាចទាញយកជា PNG បានដែរ។");
    }
  }
  return <div className="ticket-actions">
    <div>
      <button type="button" disabled={!ready || busy} onClick={() => perform(() => download(2))}><Download size={18} aria-hidden="true" />{en ? "Download PNG · 2×" : "ទាញយក PNG · 2×"}</button>
      <button type="button" disabled={!ready || busy} onClick={() => perform(() => download(3))}>PNG · 3×</button>
      <button type="button" disabled={!ready || busy} onClick={() => window.print?.()}><Printer size={18} aria-hidden="true" />{en ? "Print / PDF" : "បោះពុម្ព / PDF"}</button>
      <button type="button" disabled={!ready || busy} onClick={() => perform(share)}><Share2 size={18} aria-hidden="true" />{en ? "Share" : "ចែករំលែក"}</button>
      <button type="button" disabled={busy} onClick={() => perform(async () => { if (!await copyText(ticket.invitationUrl)) throw new Error(en ? "Copy is unavailable. Please download the ticket to share it." : "មិនអាចចម្លងបានទេ។ សូមទាញយកកាតដើម្បីចែករំលែក។"); setMessage(en ? "Invitation link copied" : "បានចម្លងតំណសំបុត្រអញ្ជើញ"); })}><Copy size={18} aria-hidden="true" />{en ? "Copy invitation link" : "ចម្លងតំណសំបុត្រអញ្ជើញ"}</button>
      {ticket.kind !== "GUEST" && (
        <a href={`https://t.me/share/url?url=${encodeURIComponent(ticket.invitationUrl)}`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Telegram</a>
      )}
    </div>
    {fallbackImageUrl && (
      <div className="ticket-fallback-card">
        <img src={fallbackImageUrl} alt={en ? "Saved invitation ticket preview" : "រូបភាពកាតអញ្ជើញសម្រាប់រក្សាទុក"} />
        <button type="button" onClick={() => { URL.revokeObjectURL(fallbackImageUrl); setFallbackImageUrl(""); }}>
          {en ? "Hide image preview" : "បិទរូបភាព"}
        </button>
      </div>
    )}
    <p>{ticket.kind === "GUEST" ? (en ? "Share this personal ticket only with its guest." : "កាត និងតំណនេះសម្រាប់ភ្ញៀវនេះតែប៉ុណ្ណោះ។") : (en ? "This QR opens the general invitation. Use a personal ticket for guest check-in." : "QR នេះបើកសំបុត្រអញ្ជើញទូទៅ។ ប្រើកាតផ្ទាល់ខ្លួនសម្រាប់ការកត់ត្រាវត្តមានភ្ញៀវ។")}</p>
    <p role="status" aria-live="polite">{busy ? (en ? "Preparing…" : "កំពុងរៀបចំ…") : message}</p>
  </div>;
}
