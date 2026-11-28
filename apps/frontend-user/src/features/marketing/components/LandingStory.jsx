import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutTemplate, PencilLine, Send } from "lucide-react";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";

export default function LandingStory({ copy }) {
  const timeline = useRef(null);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current) setActive(Number(current.target.dataset.step));
      },
      { rootMargin: "-25% 0px -35%", threshold: 0.2 }
    );
    timeline.current?.querySelectorAll("[data-step]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [reduced]);

  const steps = [
    [
      LayoutTemplate,
      copy("ជ្រើសគំរូ", "Choose a design"),
      copy("មើលគំរូពេញលេញ ហើយជ្រើសរើសរចនាបទសម្រាប់ពិធីរបស់អ្នក។", "Explore complete interactive demos and choose the design that fits your ceremony."),
      "/templates",
    ],
    [
      PencilLine,
      copy("កែសម្រួលព័ត៌មាន", "Make it yours"),
      copy("ចូលគណនី រួចបញ្ចូលឈ្មោះ រូបភាព កម្មវិធី និងទីតាំងពិធី។", "Add your couple names, photographs, bilingual schedule, and venue in Invitation Studio."),
      "/templates/browse",
    ],
    [
      Send,
      copy("ចែករំលែក និងទទួលចម្លើយ", "Share & follow replies"),
      copy("ពិនិត្យសន្លឹកការ រួចផ្សព្វផ្សាយ និងផ្ញើតំណភ្ជាប់ទៅភ្ញៀវ។ តាមដានចម្លើយក្នុងគណនីរបស់អ្នក។", "Publish personal guest links via Telegram or web and track every RSVP in real time."),
      "/templates/browse",
    ],
  ];

  return (
    <section className="kp-steps kp-section" aria-labelledby="kp-steps-title">
      <div className="kp-section-heading">
        <div>
          <h2 id="kp-steps-title">{copy("ពីការរចនា ទៅកាន់ការអញ្ជើញដ៏កក់ក្តៅ។", "Three calm stages.\nOne unforgettable day.")}</h2>
        </div>
        <p>{copy("ចាប់ផ្តើមពីរចនាបទដែលអ្នកពេញចិត្ត រួចរៀបចំព័ត៌មានឱ្យភ្ញៀវ។", "Start with a curated template, personalize every detail, and welcome your guests with clarity.")}</p>
      </div>

      <ol ref={timeline} className="kp-journey">
        {steps.map(([Icon, title, text, path], index) => (
          <li key={title} data-step={index} data-active={!reduced && active === index}>
            <div className="kp-journey-top">
              <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h3>
              <Link to={path}>
                <span>{title}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
