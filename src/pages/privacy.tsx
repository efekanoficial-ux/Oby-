import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Shield,
  Lock,
  Globe,
  FileText,
  Mail,
  Copy,
  Check,
  ChevronDown,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useLanguage } from "@/context/LanguageContext";
import { getPrivacyTranslation, PRIVACY_TRANSLATIONS } from "@/lib/privacy-content";

const SUPPORTED_LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "es", label: "ES", name: "Español" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "ar", label: "AR", name: "العربية" },
];

export default function Privacy() {
  const [, navigate] = useLocation();
  const { langCode, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<string>(langCode || "en");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Automatically sync with the app's currently active language
  useEffect(() => {
    if (langCode && PRIVACY_TRANSLATIONS[langCode]) {
      setSelectedLang(langCode);
    }
  }, [langCode]);

  const p = getPrivacyTranslation(selectedLang);
  const currentLangObj = SUPPORTED_LANGS.find(l => l.code === selectedLang) || SUPPORTED_LANGS[0];

  const handleLangChange = (code: string) => {
    setSelectedLang(code);
    const langObj = SUPPORTED_LANGS.find(l => l.code === code);
    if (langObj) {
      setLanguage(langObj.name);
    }
    setLangDropdownOpen(false);
  };

  const handleCopyEmail = (email: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  usePageMeta({
    title: p.metaTitle,
    description: p.metaDescription,
    canonical: "https://obyo.io/privacy",
    ogTitle: p.metaTitle,
    ogDescription: p.metaDescription,
    twitterTitle: p.metaTitle,
    twitterDescription: p.metaDescription,
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": p.pageTitle + " — Obyo Option",
      "url": "https://obyo.io/privacy",
      "description": p.metaDescription,
      "inLanguage": selectedLang,
      "isPartOf": {
        "@type": "WebSite",
        "name": "Obyo Option",
        "url": "https://obyo.io",
      },
      "about": {
        "@type": "Thing",
        "name": "Privacy Policy and Data Protection",
      },
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [selectedLang, p.pageTitle, p.metaDescription]);

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-black text-white overflow-hidden select-text"
      style={{ backgroundColor: "#000000" }}
    >
      {/* ── Monochrome Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-white/10 bg-black/95 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Back button & page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate("/profile");
                }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={p.backBtn}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {p.pageTitle}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-white/40 truncate font-mono">
                {p.effectiveDate}
              </p>
            </div>
          </div>

          {/* Collapsible / Dropdown Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Globe size={13} className="text-white/50" />
              <span>{currentLangObj.name}</span>
              <ChevronDown
                size={12}
                className={`text-white/40 transition-transform duration-200 ${
                  langDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-black border border-white/20 p-1 shadow-2xl z-50 overflow-hidden"
                  >
                    {SUPPORTED_LANGS.map((lang) => {
                      const isSelected = selectedLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => handleLangChange(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-white text-black font-bold"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span>{lang.name}</span>
                          {isSelected && <Check size={13} className="text-black" />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Scrollable Body with max-w-4xl PC container ──────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#000000" }}>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">

          {/* Privacy & Security Commitment (Clean Monochrome) */}
          <div className="rounded-2xl p-5 sm:p-6 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-mono text-white/40">
                {p.lastUpdated}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1">
              {p.trustBannerTitle}
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mb-3">
              {p.trustBannerSub}
            </p>
            <p className="text-xs leading-relaxed text-white/70">
              {p.trustBannerBody}
            </p>
          </div>

          {/* Quick Summary: Privacy at a Glance (Monochrome) */}
          <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-white/60" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                {p.quickSummaryTitle}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {p.quickSummaryPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/80 leading-relaxed"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0 mt-1.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Standards & Regulatory Oversight (Monochrome, No Badges) */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Shield size={15} className="text-white/50" />
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                {p.certsTitle}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {p.certs.map((cert, i) => {
                const IconComponent = cert.icon;
                return (
                  <div
                    key={i}
                    className="rounded-2xl p-4 border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                          <IconComponent size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cert.title}</p>
                          <p className="text-[10px] text-white/40 truncate">{cert.sub}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {cert.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Policy Sections (Clean Monochrome, No Badges) */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Lock size={15} className="text-white/50" />
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                {p.sectionsTitle}
              </h3>
            </div>

            <div className="space-y-4">
              {p.sections.map((sec) => {
                const SecIcon = sec.icon;
                return (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] space-y-3"
                  >
                    <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                      <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                        <SecIcon size={14} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {sec.title}
                      </h4>
                    </div>

                    <p className="text-xs leading-relaxed text-white/75">
                      {sec.body}
                    </p>

                    {sec.bullets && sec.bullets.length > 0 && (
                      <ul className="space-y-2 pt-1">
                        {sec.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs text-white/70 leading-relaxed bg-white/[0.015] p-2.5 rounded-xl border border-white/5"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white/40 shrink-0 mt-1.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sec.callout && (
                      <div className="mt-3 p-4 rounded-xl border border-white/15 bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-white mb-1">
                            {sec.callout.title}
                          </p>
                          <p className="text-xs leading-relaxed text-white/70">
                            {sec.callout.text}
                          </p>
                        </div>
                        {sec.callout.actionHref && (
                          <a
                            href={sec.callout.actionHref}
                            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-white/90 transition-colors cursor-pointer"
                          >
                            <Mail size={13} />
                            <span>{sec.callout.actionLabel}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          {/* Account & Data Deletion Action Box (Clean Monochrome) */}
          <div className="rounded-2xl p-5 sm:p-6 border border-white/15 bg-white/[0.03]">
            <div className="flex items-center gap-2.5 mb-2">
              <UserX size={17} className="text-white/70 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                {p.deletionNoticeTitle}
              </h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              {p.deletionNoticeBody}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:privacy@obyo.io?subject=Account%20and%20Personal%20Data%20Deletion%20Request"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition-all cursor-pointer"
              >
                <Mail size={14} />
                <span>{p.deletionEmailBtn}</span>
              </a>
              <Link href="/profile">
                <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer">
                  <span>Profile Settings</span>
                </button>
              </Link>
            </div>
          </div>

          {/* DPO Contact Card (Clean Monochrome) */}
          <div className="rounded-2xl p-4 sm:p-5 border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Data Protection Officer (DPO)</p>
                <p className="text-[11px] text-white/40 font-mono">privacy@obyo.io · dpo@obyo.io</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyEmail("privacy@obyo.io")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all cursor-pointer"
              >
                {copiedEmail ? <Check size={13} className="text-white" /> : <Copy size={13} />}
                <span>{copiedEmail ? "Copied" : "Copy Email"}</span>
              </button>
              <a
                href="mailto:privacy@obyo.io"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition-all cursor-pointer"
              >
                <Mail size={13} />
                <span>Contact DPO</span>
              </a>
            </div>
          </div>

          {/* Legal Footer */}
          <footer className="pt-4 border-t border-white/5 text-center space-y-2">
            <p className="text-[11px] text-white/40">
              {p.footerRights}
            </p>
            <p className="text-[10px] text-white/25 max-w-xl mx-auto leading-relaxed">
              {p.footerDisclaimer}
            </p>
          </footer>

        </div>
      </div>
    </div>
  );
}
