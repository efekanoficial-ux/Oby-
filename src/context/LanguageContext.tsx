import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTranslations, getLanguageCode, detectCountryLanguage, LanguageCode, translationsMap } from "@/i18n";

interface LanguageContextType {
  language: string;
  langCode: LanguageCode;
  setLanguage: (lang: string, manual?: boolean) => void;
  t: typeof translationsMap["tr"];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    const isManual = typeof localStorage !== "undefined" && localStorage.getItem("obyo_manual_lang") === "1";
    if (isManual) {
      const saved = localStorage.getItem("obyo_lang");
      if (saved) return saved;
    }
    return detectCountryLanguage();
  });

  const langCode = getLanguageCode(language);
  const t = getTranslations(langCode);

  const setLanguage = (newLang: string, manual = false) => {
    setLanguageState(newLang);
    localStorage.setItem("obyo_lang", newLang);
    if (manual) {
      localStorage.setItem("obyo_manual_lang", "1");
    }
    // Dispatch custom event to notify any non-React listeners
    window.dispatchEvent(new Event("languagechange"));
  };

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("obyo_lang");
      if (saved && saved !== language) {
        setLanguageState(saved);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("languagechange", handleStorage);

    // If user hasn't explicitly set a manual language, detect physical region via IP
    const isManual = localStorage.getItem("obyo_manual_lang") === "1";
    if (!isManual) {
      const detectRegion = async () => {
        try {
          let cc = "";
          try {
            const res = await fetch("https://api.country.is/");
            if (res.ok) {
              const data = await res.json();
              cc = (data.country || "").toUpperCase();
            }
          } catch {}

          if (!cc) {
            const res2 = await fetch("https://ipapi.co/json/");
            if (res2.ok) {
              const data2 = await res2.json();
              cc = (data2.country_code || "").toUpperCase();
            }
          }

          let matched = "";
          if (cc === "TR" || cc === "AZ") matched = "Türkçe";
          else if (["DE", "AT", "CH", "LI", "LU"].includes(cc)) matched = "Deutsch";
          else if (["ES", "MX", "AR", "CO", "CL", "PE", "EC", "VE", "GT", "CU", "DO"].includes(cc)) matched = "Español";
          else if (["RU", "BY", "KZ", "KG", "UZ"].includes(cc)) matched = "Русский";
          else if (["SA", "AE", "EG", "IQ", "QA", "KW", "BH", "OM", "JO", "LB", "MA", "DZ", "TN"].includes(cc)) matched = "العربية";
          else if (["US", "GB", "CA", "AU", "NZ", "IE"].includes(cc)) matched = "English";

          if (matched && localStorage.getItem("obyo_manual_lang") !== "1") {
            setLanguage(matched);
          }
        } catch {}
      };
      detectRegion();
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("languagechange", handleStorage);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, langCode, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if accessed outside provider
    const lang = localStorage.getItem("obyo_lang") || "English";
    const code = getLanguageCode(lang);
    return {
      language: lang,
      langCode: code,
      setLanguage: (l: string) => localStorage.setItem("obyo_lang", l),
      t: getTranslations(code),
    };
  }
  return ctx;
}
