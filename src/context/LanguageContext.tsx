import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTranslations, getLanguageCode, LanguageCode, translationsMap } from "@/i18n";

interface LanguageContextType {
  language: string;
  langCode: LanguageCode;
  setLanguage: (lang: string) => void;
  t: typeof translationsMap["tr"];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem("obyo_lang") || "Türkçe";
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
