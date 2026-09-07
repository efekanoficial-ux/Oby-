import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface LanguageModalProps {
  show: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: "tr", name: "Türkçe",  flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export function LanguageModal({ show, onClose }: LanguageModalProps) {
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<string>(language);

  useEffect(() => {
    if (show) {
      setSelectedLang(language);
    }
  }, [show, language]);

  const handleConfirm = () => {
    setLanguage(selectedLang);
    localStorage.setItem("obyo_lang", selectedLang);
    onClose();
    // Reload page to apply language changes globally
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#111111] border border-white/10 p-5 text-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF6B00]">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dil Seçimi / Language</h3>
                  <p className="text-xs text-white/40">Uygulama dilini seçiniz</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Language Options */}
            <div className="mt-4 flex flex-col gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang.toLowerCase() === lang.name.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.name)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all text-left ${
                      isSelected
                        ? "bg-[#FF6B00]/15 border border-[#FF6B00] text-white font-bold shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-sm font-semibold">{lang.name}</span>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B00] text-black">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm / OK button */}
            <button
              onClick={handleConfirm}
              className="mt-6 w-full rounded-xl py-3.5 text-sm font-black text-black bg-[#FF6B00] hover:bg-[#ff7a1a] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,107,0,0.3)]"
            >
              OK (Tamam)
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
