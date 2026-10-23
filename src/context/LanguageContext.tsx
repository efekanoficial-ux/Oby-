import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTranslations, getLanguageCode, detectCountryLanguage, LanguageCode, translationsMap } from "@/i18n";

interface LanguageContextType {
  language: string;
  langCode: LanguageCode;
  setLanguage: (lang: string) => void;
  t: typeof translationsMap["tr"];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem("obyo_lang") || detectCountryLanguage();
  });

  const langCode = getLanguageCode(language);
  const t = getTranslations(langCode);

  const setLanguage = (newLang: string) => {
    setLanguageState(newLang);
    localStorage.setItem("obyo_lang", newLang);
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

    // If user hasn't explicitly set a language yet, detect physical country via IP
    if (!localStorage.getItem("obyo_lang")) {
      fetch("https://ipapi.co/json/")
        .then(r => r.json())
        .then(data => {
          const cc = (data.country_code || "").toUpperCase();
          let matched = "";
          if (cc === "TR" || cc === "AZ") matched = "Türkçe";
          else if (["DE", "AT", "CH"].includes(cc)) matched = "Deutsch";
          else if (["ES", "MX", "AR", "CO", "CL", "PE", "EC", "VE", "GT", "CU", "DO"].includes(cc)) matched = "Español";
          else if (["RU", "BY", "KZ", "KG", "UZ"].includes(cc)) matched = "Русский";
          else if (["SA", "AE", "EG", "IQ", "QA", "KW", "BH", "OM", "JO", "LB", "MA", "DZ", "TN"].includes(cc)) matched = "العربية";

          if (matched && !localStorage.getItem("obyo_lang")) {
            setLanguage(matched);
          }
        })
        .catch(() => {});
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
