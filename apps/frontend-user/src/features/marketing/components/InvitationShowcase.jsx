import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, MapPin, Heart, Check, Sparkles, Smartphone, Languages } from "lucide-react";
import { SILK_HERITAGE_TEMPLATE as silk } from "../../templates/data/templatesData";

export default function InvitationShowcase({ copy }) {
  const [stage, setStage] = useState("details");
  const choices = [
    [
      "closed",
      copy("ការអញ្ជើញ", "The arrival"),
      copy("សន្លឹកការមួយ បើករឿងរ៉ាវថ្មី។", "A ceremonial cover before the reveal."),
      copy("សូត្រមង្គលបើកដូចសៀវភៅតូចមួយ ជាមួយពណ៌ក្រហមទុំ និងក្រដាសភ្លុក។", "A burgundy folio and warm ivory paper set the tone before your guest unseals the celebration."),
    ],
    [
      "open",
      copy("រឿងរ៉ាវរបស់អ្នក", "Your story"),
      copy("ឈ្មោះ រូបថត និងថ្ងៃពិសេស។", "Your names, portraits, and ceremony date."),
      copy("បញ្ចូលឈ្មោះគូស្វាមីភរិយា រូបភាព និងកម្មវិធីពិធី ដើម្បីឱ្យសន្លឹកការក្លាយជារបស់អ្នក។", "Personalize couple portraits, Khmer & English family titles, and your full schedule in the studio."),
    ],
    [
      "details",
      copy("ព័ត៌មានសម្រាប់ភ្ញៀវ", "Guest experience"),
      copy("កម្មវិធី ទីតាំង និងការឆ្លើយតប RSVP។", "Everything your guests need, in one scroll."),
      copy("ភ្ញៀវមើលកម្មវិធី ទីតាំង និងឆ្លើយតប RSVP នៅលើសន្លឹកការដែលបានផ្សព្វផ្សាយ។", "Guests read the morning & evening ceremony schedule, open directions, and confirm attendance effortlessly."),
    ],
  ];
  const current = choices.find(([key]) => key === stage);

  return (
    <section id="invitation-story" className="kp-showcase kp-section" aria-labelledby="kp-showcase-title">
      <div className="kp-showcase-visual" role="group" aria-label={copy("គំរូបង្ហាញសូត្រមង្គល", "Silk Heritage interactive anatomy")}>
        <div className="kp-anatomy-stage">
          <div className="kp-showcase-frame" data-stage={stage}>
            {stage === "closed" ? (
              <div className="kp-showcase-cover-wrap">
                <img
                  className="kp-showcase-cover"
                  src={silk.image}
                  width="720"
                  height="1080"
                  loading="lazy"
                  alt={copy("ក្របសន្លឹកការសូត្រមង្គល", "The Silk Heritage invitation cover")}
                />
                <span className="kp-showcase-seal" aria-hidden="true">
                  <Sparkles size={14} />
                  <span>{copy("បើកសន្លឹកការ", "Open invitation")}</span>
                </span>
              </div>
            ) : (
              <div className="kp-mini-invitation">
                <p className="kp-mini-kicker">{copy("សូត្រមង្គល · SILK HERITAGE", "Silk Heritage")}</p>
                {stage === "open" ? (
                  <>
                    <img
                      src={silk.mainImage}
                      width="960"
                      height="1440"
                      loading="lazy"
                      alt={copy("រូបថតគូស្នេហ៍គំរូ", "Sample couple portrait")}
                    />
                    <p className="kp-mini-names">{copy(silk.groom, silk.groomEn)} &amp; {copy(silk.bride, silk.brideEn)}</p>
                    <p className="kp-mini-date">{copy(silk.dateText, silk.dateTextEn)}</p>
                  </>
                ) : (
                  <>
                    <p className="kp-mini-names">{copy("ដោយក្តីរីករាយ", "With joy, we invite you")}</p>
                    <div className="kp-mini-detail">
                      <CalendarDays aria-hidden="true" size={18} />
                      <div>
                        <strong>{copy("កម្មវិធីពិធី", "The celebration")}</strong>
                        <p>{copy(silk.dateText, silk.dateTextEn)}</p>
                        <p>{copy("១៧:០០ — ពិធីជប់លៀង", "17:00 — Evening reception")}</p>
                      </div>
                    </div>
                    <div className="kp-mini-detail">
                      <MapPin aria-hidden="true" size={18} />
                      <div>
                        <strong>{copy("ទីតាំងគំរូ", "Ceremony venue")}</strong>
                        <p>{copy(silk.venueName, silk.venueNameEn || silk.venueName)}</p>
                      </div>
                    </div>
                    <div className="kp-mini-detail">
                      <Heart aria-hidden="true" size={18} />
                      <div>
                        <strong>RSVP</strong>
                        <p>{copy("ឆ្លើយតបតាមតំណភ្ជាប់សន្លឹកការពិត", "Direct guest confirmation")}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Architectural callouts (Dimensional Drawing inspired spec markers) */}
          <dl className="kp-anatomy-specs" aria-label={copy("លក្ខណៈបច្ចេកទេស", "Invitation specification")}>
            <div className="kp-anatomy-spec">
              <dt><Languages size={14} aria-hidden="true" /><span>{copy("អក្សរខ្មែរ", "Typography")}</span></dt>
              <dd>{copy("Moul & Kantumruy · 1.8x", "Khmer & Serif · Zero clipping")}</dd>
            </div>
            <div className="kp-anatomy-spec">
              <dt><Smartphone size={14} aria-hidden="true" /><span>{copy("អេក្រង់", "Viewport")}</span></dt>
              <dd>{copy("390px – 1440px ឆ្លើយតប", "390px – 1440px adaptive")}</dd>
            </div>
            <div className="kp-anatomy-spec">
              <dt><Check size={14} aria-hidden="true" /><span>{copy("តំណភ្ជាប់", "Guest link")}</span></dt>
              <dd>{copy("RSVP + ផែនទីទីតាំង", "RSVP + Map directions")}</dd>
            </div>
          </dl>
        </div>
        <p className="kp-visual-note">{copy("រូបភាពគំរូ · មើលមុខងារពិតក្នុងគំរូពេញលេញ", "Sample illustration · Explore the working design in the full demo")}</p>
      </div>

      <div className="kp-showcase-copy">
        <p className="kp-showcase-label">{copy("ពីការអញ្ជើញ ដល់ការជួបជុំ", "From a link to a gathering")}</p>
        <h2 id="kp-showcase-title">{copy("ព័ត៌មានពិធីច្បាស់លាស់\nសម្រាប់ភ្ញៀវរបស់អ្នក។", "The details they need.\nThe welcome you imagined.")}</h2>
        <div className="kp-stage-controls" role="group" aria-label={copy("ជ្រើសរើសផ្នែកគំរូ", "Choose a preview stage")}>
          {choices.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={stage === key}
              aria-controls="kp-stage-copy"
              onClick={() => setStage(key)}
            >
              {label}
              {stage === key && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div id="kp-stage-copy" className="kp-stage-copy" aria-live="polite">
          <h3>{current[2]}</h3>
          <p>{current[3]}</p>
        </div>
        <Link to="/templates/silk-heritage" className="kp-text-link">
          {copy("មើលគំរូពេញលេញ", "View full interactive demo")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
