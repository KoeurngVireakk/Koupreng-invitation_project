import { useState } from "react";
import BrandLogo from '@/shared/branding/BrandLogo';
import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { KHMER_CELESTIAL_ASSETS } from "../khmerCelestialAssets";
import CelestialLiveGarden from "./CelestialLiveGarden";
import OpenInvitationCTA from "./OpenInvitationCTA";
import { celestialElementFont } from "../celestialTypography";
import CelestialHeritage from './CelestialHeritage';
import { authoredHeadingStyle } from '../../../shared/templateTypography';

const EASE = [0.22, 1, 0.36, 1];

function mediaSource(value) {
  if (typeof value === "string") return value;
  return value?.url || value?.src || "";
}

export default function CelestialOpening({ content, onOpen, onSkip, autoFocus = true }) {
  const reducedMotion = usePrefersReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const languageMode = String(content.languageMode).toLowerCase();
  const english = languageMode === "en";
  const skipLabel = english ? "Skip opening" : languageMode === "both" ? "រំលង / Skip opening" : "រំលង";
  const openLabel = content.opening?.openButtonText || (english ? "Open invitation" : "បើកសំបុត្រអញ្ជើញ");
  const guestName = content.guestName?.trim() || (english ? "Dear guest" : "ភ្ញៀវកិត្តិយស");
  const guestLabel = english ? "To our guest" : content.isPersonalizedGuest ? "សូមគោរពអញ្ជើញ" : "ជូនចំពោះ";
  const guestNameLength = Array.from(guestName.replace(/\s+/g, "")).length;
  const guestNameClass = [
    "kc-opening__guest-name",
    guestNameLength > 28 ? "kc-opening__guest-name--long" : "",
    guestNameLength > 46 ? "kc-opening__guest-name--very-long" : "",
  ].filter(Boolean).join(" ");
  const names = [content.groom, content.bride].filter(Boolean);
  const logoAlt = names.length
    ? `ស្លាកឈ្មោះ ${names.join(" និង ")}`
    : "ស្លាកឈ្មោះគូស្វាមីភរិយា";
  const videoEnabled = content.design?.openingVideoEnabled !== false;
  const openingVideo = videoEnabled
    ? mediaSource(content.openingVideo) || KHMER_CELESTIAL_ASSETS.openingVideo
    : "";

  return (
    <motion.div
      className="kc-opening"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kc-opening-title"
      initial={false}
      exit={{ display: "none" }}
    >
      <motion.div
        className="kc-opening__film"
        initial={reducedMotion ? false : { opacity: 0, scale: 1.025 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.6, ease: EASE }}
        aria-hidden="true"
      >
        {!reducedMotion && !videoFailed && openingVideo ? (
          <video
            src={openingVideo}
            poster={KHMER_CELESTIAL_ASSETS.botanicalFrame}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            width="720"
            height="1280"
            onError={() => setVideoFailed(true)}
          />
        ) : null}
      </motion.div>

      <motion.img
        className="kc-opening__botanical"
        src={KHMER_CELESTIAL_ASSETS.botanicalFrame}
        alt=""
        aria-hidden="true"
        width="999"
        height="1575"
        initial={reducedMotion ? false : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0.65, scale: 1.035 }}
        transition={{ duration: reducedMotion ? 0 : 1.7, delay: reducedMotion ? 0 : 0.2, ease: EASE }}
      />
      <div className="kc-opening__shade" aria-hidden="true" />
      <button type="button" className="kc-opening__skip" onClick={onSkip || onOpen}>{skipLabel}</button>
      <CelestialHeritage />
      <CelestialLiveGarden className="kc-opening__garden" variant="opening" />

      <div className="kc-opening__content">
        <p id="kc-opening-title" className="kc-opening__eyebrow" style={celestialElementFont(content, "subtitle")}>
          {content.opening?.heading || content.title || "សិរីសួស្តីអាពាហ៍ពិពាហ៍"}
        </p>

        {content.subtitle && <p className="kc-opening__subtitle">{content.subtitle}</p>}

        {content.showBrandMark !== false && (
          <div className="kc-opening__brand-wrap">
            {content.brandMark ? (
              <img
                className="kc-opening__brand"
                src={content.brandMark}
                alt={logoAlt}
                width="768"
                height="512"
              />
            ) : names.length > 0 ? (
              <div className="kc-opening__couple-calligraphy text-center py-2">
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-wide"
                  style={{
                    color: content.primaryColor || 'var(--kc-green)',
                    fontFamily: content.elementFonts?.couple ? celestialElementFont(content, 'couple').fontFamily : authoredHeadingStyle(content, names.join(' ')).fontFamily || '"Cormorant Garamond", Georgia, serif',
                    fontWeight: 400, lineHeight: 1.8, letterSpacing: 'normal', overflowWrap: 'anywhere',
                    textShadow: '0 1px 0 var(--kc-paper), 0 2px 1px rgba(33, 79, 59, .14)',
                  }}
                >
                  {content.groom} {content.amp || "♥"} {content.bride}
                </h1>
              </div>
            ) : (
              <BrandLogo variant="hero" priority />
            )}
            <span className="kc-opening__brand-highlight" aria-hidden="true" />
          </div>
        )}

        <div className="kc-opening__date-block">
          {content.dateText ? <p className="kc-opening__date" style={celestialElementFont(content, "date")}>{content.dateText}</p> : null}
          {content.eventTime ? <p className="kc-opening__time" style={celestialElementFont(content, "time")}>{content.eventTime}</p> : null}
        </div>

        <p
          className="kc-opening__guest-label"
          style={celestialElementFont(content, "guestLabel")}
        >
          {guestLabel}
        </p>

        <div className="kc-opening__guest-banner">
          <img
            className="kc-opening__guest-banner-image"
            src={KHMER_CELESTIAL_ASSETS.guestNameBanner}
            alt=""
            aria-hidden="true"
            width="2172"
            height="724"
            loading="eager"
            decoding="async"
            draggable="false"
          />
          <p className="kc-opening__guest-banner-content">
            <strong
              className={guestNameClass}
              style={celestialElementFont(content, "guestName")}
            >
              {guestName}
            </strong>
          </p>
        </div>

        <OpenInvitationCTA
          label={openLabel}
          onOpen={onOpen}
          autoFocus={autoFocus}
        />
      </div>
    </motion.div>
  );
}
