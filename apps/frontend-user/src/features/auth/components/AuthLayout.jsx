import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguageStore } from "../../../stores/useLanguageStore";
import "../AuthPage.css";
import BrandLogo from "@/shared/branding/BrandLogo";
import DisplayPreferences from '@/shared/preferences/DisplayPreferences';

export default function AuthLayout({ children }) {
  const { lang, setLang } = useLanguageStore();
  const copy = (km, en) => (lang === "en" ? en : km);

  return (
    <div className="auth-page auth-page--centered auth-page--split" lang={lang}>
      <aside className="auth-editorial-aside" aria-hidden="true">
        <div className="auth-editorial-inner">
          <div className="auth-editorial-frame">
            <span className="auth-editorial-kicker">
              {copy("រោងចក្រសំបុត្រអញ្ជើញឌីជីថលខ្មែរ", "Khmer Digital Atelier")}
            </span>
            <h2 className="auth-editorial-heading">
              {copy("សិល្បៈនៃការអញ្ជើញ\nសម្រាប់ពិធីមង្គលការដ៏ឧត្តុង្គឧត្តម", "Every celebration begins with an heirloom welcome.")}
            </h2>
            <p className="auth-editorial-desc">
              {copy(
                "គ្រប់គ្រងសំបុត្រអញ្ជើញ បញ្ជីភ្ញៀវ តុអាហារ ចំណងដៃ និងការស្កេន QR ចូលរួមក្នុងវេទិកាតែមួយ។",
                "Design Khmer-English wedding invitations, track RSVPs, arrange tables, and greet guests smoothly from one studio."
              )}
            </p>
            <ul className="auth-editorial-pillars">
              <li>{copy("អក្សរខ្មែរ និងអង់គ្លេសស្អាតគ្រប់អេក្រង់", "Bilingual Khmer & English editorial typography")}</li>
              <li>{copy("តាមដានការឆ្លើយតប RSVP និងតុអង្គុយភ្លាមៗ", "Live RSVP ledger & guest table coordination")}</li>
              <li>{copy("កត់ត្រាចំណងដៃ USD / KHR ដោយឡែកច្បាស់លាស់", "Clean USD & KHR gift accounting")}</li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="auth-main-pane">
        <div className="auth-centered-container">
          <div className="auth-top-bar">
            <Link to="/" className="auth-home-link">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{copy("ត្រឡប់ទៅទំព័រដើម", "Back to home")}</span>
            </Link>
            <div className="auth-preferences">
              <div className="auth-lang-pill" role="group" aria-label={copy("ជ្រើសរើសភាសា", "Language selection")}>
                <button
                  type="button"
                  className={`auth-lang-btn${lang === "km" ? " active" : ""}`}
                  onClick={() => setLang("km")}
                  aria-pressed={lang === "km"}
                  lang="km"
                >
                  ភាសាខ្មែរ
                </button>
                <span className="auth-lang-sep" aria-hidden="true">/</span>
                <button
                  type="button"
                  className={`auth-lang-btn${lang === "en" ? " active" : ""}`}
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  lang="en"
                >
                  English
                </button>
              </div>
              <DisplayPreferences language={false} compact />
            </div>
          </div>

          <div className="auth-card-wrap">
            <Link to="/" className="auth-brand" aria-label={copy("គូព្រេង · ទំព័រដើម", "Koupreng · Home")}><BrandLogo variant="auth" priority decorative /></Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

