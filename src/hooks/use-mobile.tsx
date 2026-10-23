import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function checkIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || "";
  const isPhoneUA = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // A smartphone screen's shortest dimension (regardless of physical rotation) is <= 520px
  const screenMin = Math.min(window.screen?.width || 9999, window.screen?.height || 9999);
  const isTouchDevice = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

  if (isPhoneUA || (isTouchDevice && screenMin <= 520)) {
    return true;
  }

  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function checkIsPhoneLandscape(): boolean {
  if (typeof window === "undefined") return false;
  const isMobile = checkIsMobile();
  if (!isMobile) return false;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // On any smartphone held in portrait, width is 360-430px (always < 520px).
  // Even when the virtual keyboard opens in portrait, width stays < 520px.
  if (w < 520) return false;

  // Physical screen orientation API if available
  const screenOrient = window.screen?.orientation?.type;
  if (screenOrient) {
    return screenOrient.includes("landscape");
  }

  // On iOS Safari, window.orientation is 90 or -90 when tilted horizontally
  if (typeof window.orientation !== "undefined") {
    return Math.abs(Number(window.orientation)) === 90;
  }

  // Fallback requires wide landscape aspect ratio
  return w >= 560 && w > h * 1.3 && h <= 500;
}

export function isPWAStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // iOS Safari Home Screen standalone
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Standard display-mode check (Android Chrome, PWA installed)
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  }

  // Android TWA
  if (document.referrer && document.referrer.startsWith("android-app://")) {
    return true;
  }

  return false;
}

export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = React.useState<boolean>(() => isPWAStandalone());

  React.useEffect(() => {
    const check = () => {
      setIsPWA(isPWAStandalone());
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isPWA;
}

export function lockPortraitOrientation() {
  try {
    if (typeof window !== "undefined" && window.screen?.orientation) {
      if ("lock" in window.screen.orientation) {
        (window.screen.orientation as any).lock("portrait").catch(() => {});
        (window.screen.orientation as any).lock("portrait-primary").catch(() => {});
      }
    }
  } catch {}
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => checkIsMobile());

  React.useEffect(() => {
    const handleCheck = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener("resize", handleCheck);
    window.addEventListener("orientationchange", handleCheck);
    handleCheck();

    return () => {
      window.removeEventListener("resize", handleCheck);
      window.removeEventListener("orientationchange", handleCheck);
    };
  }, []);

  return !!isMobile;
}

export function useIsPhoneLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(() => checkIsPhoneLandscape());

  React.useEffect(() => {
    const handleCheck = () => {
      setIsLandscape(checkIsPhoneLandscape());
    };

    window.addEventListener("resize", handleCheck);
    window.addEventListener("orientationchange", handleCheck);
    handleCheck();

    return () => {
      window.removeEventListener("resize", handleCheck);
      window.removeEventListener("orientationchange", handleCheck);
    };
  }, []);

  return isLandscape;
}

