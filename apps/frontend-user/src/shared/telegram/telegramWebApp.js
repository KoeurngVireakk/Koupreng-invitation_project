/**
 * Telegram Mini App (WebApp) Integration Helper & Hook
 * Provides safe bindings to window.Telegram.WebApp for full mobile immersion.
 */

import { useEffect, useState } from "react";

export const TELEGRAM_WEB_APP_READY_EVENT = "telegram-web-app-ready";

let initializedTelegramInstance = null;

export function getTelegramWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp || null;
}

export function isInAppBrowser() {
  if (typeof window === "undefined") return false;
  const tg = getTelegramWebApp();
  if ((tg && tg.initData && tg.initData.length > 0) || window.TelegramWebviewProxy) return true;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  return /FBAN|FBAV|FB_IAB|Messenger|WhatsApp|Telegram|Line\//i.test(ua);
}

export function isInsideTelegram() {
  if (typeof window === "undefined") return false;
  const tg = getTelegramWebApp();
  if (Boolean(tg && tg.initData && tg.initData.length > 0) || Boolean(window.TelegramWebviewProxy)) return true;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  return /Telegram/i.test(ua);
}

/**
 * Initializes Telegram WebApp environment, expanding viewport and syncing theme tokens.
 */
export function initTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  if (initializedTelegramInstance === tg) return;

  try {
    tg.ready();
    tg.expand();

    // Enable closing confirmation to prevent accidental swipe-down exits on forms
    if (typeof tg.enableClosingConfirmation === "function") {
      tg.enableClosingConfirmation();
    }

    const isDarkSurface = typeof document !== "undefined" && Boolean(
      document.querySelector(".el-container, .tdy-page-root, .tpl-boilerplate, [data-theme='dark']")
    );
    const chromeColor = isDarkSurface ? "#0b0b0d" : "#FAF6F0";

    // Set matching theme header
    if (typeof tg.setHeaderColor === "function") {
      tg.setHeaderColor(chromeColor);
    }
    if (typeof tg.setBackgroundColor === "function") {
      tg.setBackgroundColor(chromeColor);
    }

    // Bind stable viewport height CSS variable for Telegram / IAB resizing
    const updateViewport = () => {
      const height = tg.viewportStableHeight || tg.viewportHeight;
      if (height) {
        document.documentElement.style.setProperty(
          "--tg-viewport-height",
          `${height}px`
        );
      }
    };

    updateViewport();
    if (typeof tg.onEvent === "function") {
      tg.onEvent("viewportChanged", updateViewport);
    }
    initializedTelegramInstance = tg;
  } catch (err) {
    console.warn("⚠️ [Telegram WebApp Init]:", err?.message || err);
  }
}

/**
 * Triggers native haptic vibration pulse on mobile devices via Telegram
 * @param {'impact' | 'notification' | 'selection'} type
 * @param {'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning'} style
 */
export function triggerHaptic(type = "impact", style = "medium") {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) {
    // Fallback to standard Navigator Vibration API if supported
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(style === "heavy" ? 35 : 18);
    }
    return;
  }

  try {
    if (type === "impact") {
      tg.HapticFeedback.impactOccurred(style);
    } else if (type === "notification") {
      tg.HapticFeedback.notificationOccurred(style);
    } else if (type === "selection") {
      tg.HapticFeedback.selectionChanged();
    }
  } catch {
    // Haptic feedback is optional on older Telegram clients.
  }
}

/**
 * React Hook for Telegram WebApp state
 */
export function useTelegramWebApp() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncTelegramState = () => {
      const tg = getTelegramWebApp();
      if (!tg) return;
      initTelegramWebApp();
      setIsTelegram(Boolean(tg.initData && tg.initData.length > 0));
      setUser(tg.initDataUnsafe?.user || null);
    };

    syncTelegramState();
    window.addEventListener(TELEGRAM_WEB_APP_READY_EVENT, syncTelegramState);
    return () => window.removeEventListener(TELEGRAM_WEB_APP_READY_EVENT, syncTelegramState);
  }, []);

  return {
    isTelegram,
    user,
    tg: getTelegramWebApp(),
    triggerHaptic,
  };
}
