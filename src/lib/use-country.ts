import { useState, useEffect } from "react";

export function useIsTurkey(): boolean {
  const [isTurkey, setIsTurkey] = useState<boolean>(() => {
    // 1. Check cached country code
    const cached = localStorage.getItem("obyo_user_country");
    if (cached) {
      return cached.toUpperCase() === "TR";
    }

    // 2. Fallback check based on browser environment (timezone / language)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language || "";
      if (tz === "Europe/Istanbul" || lang.toLowerCase().includes("tr")) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    // Check IP geolocation if not already cached
    const cached = localStorage.getItem("obyo_user_country");
    if (cached) return;

    let isMounted = true;
    const checkGeo = async () => {
      try {
        // Fast, reliable, no API key needed
        const res = await fetch("https://api.country.is/", { cache: "force-cache" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.country) {
            const countryCode = String(data.country).toUpperCase();
            localStorage.setItem("obyo_user_country", countryCode);
            if (isMounted) {
              setIsTurkey(countryCode === "TR");
            }
            return;
          }
        }
      } catch {
        // Backup service if primary fails
        try {
          const res2 = await fetch("https://ipapi.co/json/");
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.country_code) {
              const countryCode = String(data2.country_code).toUpperCase();
              localStorage.setItem("obyo_user_country", countryCode);
              if (isMounted) {
                setIsTurkey(countryCode === "TR");
              }
            }
          }
        } catch {
          // keep fallback
        }
      }
    };

    checkGeo();

    return () => {
      isMounted = false;
    };
  }, []);

  return isTurkey;
}
