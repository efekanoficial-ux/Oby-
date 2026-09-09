import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  User, Settings, Bell, Shield, ChevronRight,
  HelpCircle, LogOut, X, Hash, Wallet, Camera, Trophy, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeaderboardModal } from "@/components/leaderboard-modal";
import { ProfilePhotoModal } from "@/components/profile-photo-modal";
import { LanguageModal } from "@/components/language-modal";
import { KycModal } from "@/components/kyc-modal";

import { useLanguage } from "@/context/LanguageContext";

export default function Profile() {
  const [, navigate]   = useLocation();
  const { currentUser, logout } = useAuth();
  const { language, t } = useLanguage();
  const [showAbout, setShowAbout]             = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPhotoModal, setShowPhotoModal]   = useState(false);
  const [showLangModal, setShowLangModal]     = useState(false);
  const [showKycModal, setShowKycModal]       = useState(false);
  const [notifState, setNotifState]           = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("kyc=open")) {
      setShowKycModal(true);
    }
  }, []);

  const handleLogout = () => { logout(); navigate("/auth"); };

  const isVerified = currentUser?.kycStatus === "verified";

  const menuItems: any[] = [
    { icon: Trophy,      label: t.leaderboard || "Lider Tablosu", value: "Günlük",             action: () => navigate("/leaderboard"),     href: undefined, customColor: undefined },
    { icon: Wallet,      label: t.depositWithdraw,                value: "",                   action: () => navigate("/wallet"),          href: undefined, customColor: undefined },
    { icon: Settings,    label: t.language,                       value: language,             action: () => setShowLangModal(true),       href: undefined, customColor: undefined },
    { icon: Bell,        label: t.notifications,                  value: notifState ? t.on : t.off, action: () => setNotifState(prev => !prev),  href: undefined, customColor: undefined },
    { icon: Shield,      label: t.privacyPolicy,                  value: "",                   action: () => navigate("/privacy"),         href: "/privacy", customColor: undefined },
    { icon: HelpCircle,  label: t.about,                          value: "",                   action: () => setShowAbout(true),           href: undefined, customColor: undefined },
  ];

  const displayName = currentUser
    ? `${currentUser.name} ${currentUser.surname}`
    : "Demo Kullanıcı";

  const displayEmail = currentUser?.email ?? "demo@obyo.io";

  const initials = currentUser
    ? `${currentUser.name.charAt(0)}${currentUser.surname.charAt(0)}`.toUpperCase()
    : "DK";

  return (
    <>
    <div className="h-full w-full overflow-y-auto"
        style={{ isolation: "isolate", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div className="flex flex-col pb-10">

          {/* ── Profile header ───────────────────────────────────────── */}
          <div className="flex flex-col items-center py-8 px-4">
            <div className="relative mb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => currentUser && setShowPhotoModal(true)}
                className="relative flex h-24 w-24 items-center justify-center rounded-full overflow-hidden cursor-pointer group border-2 border-white/10"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 0 28px rgba(255,107,0,0.30)" }}
                title="Profil Fotoğrafını Değiştir"
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="h-full w-full object-cover" />
                ) : currentUser ? (
                  <span className="text-3xl font-black text-black">{initials}</span>
                ) : (
                  <User size={40} className="text-black" />
                )}
                {currentUser && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={22} className="text-white" />
                  </div>
                )}
              </motion.button>

              {/* Edit Camera Badge */}
              {currentUser && (
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B00] text-black shadow-lg border border-black hover:scale-110 transition-transform"
                  title="Fotoğraf Yükle"
                >
                  <Camera size={13} />
                </button>
              )}

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black text-black"
                style={{ background: currentUser ? "#0ecb81" : "#FFB800" }}>
                {currentUser ? "GERÇEK" : "DEMO"}
              </div>
            </div>
            <h2 className="mt-1 text-xl font-black text-white">{displayName}</h2>
            <p className="mt-0.5 text-xs text-white/30">{displayEmail}</p>

            {/* User ID */}
            {currentUser && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Hash size={9} className="text-white/25" />
                <span className="text-[10px] font-mono text-white/30">{currentUser.id}</span>
              </div>
            )}

          </div>

          {/* ── KYC Status Card (Farklı ve Renksiz / Monochrome Design) ── */}
          {currentUser && !isVerified && (
            <div className="px-4 mb-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowKycModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, #161616 0%, #0e0e0e 100%)",
                  border: "1px solid #262626",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white/90">{t.kycTitle}</h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.4)"
                        }}
                      >
                        {t.kycNotVerified}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      Para çekme işlemleri için kimlik doğrulaması yapın
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30 shrink-0" />
              </motion.button>
            </div>
          )}

          {/* ── Settings group ───────────────────────────────────────── */}
          <div className="px-4">
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid #1e1e1e" }}>
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "#1e1e1e" }}>
                        <Icon size={15} style={{ color: item.customColor || "#666" }} />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-xs font-bold" style={{ color: item.customColor || "#555" }}>
                          {item.value}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: "#333" }} />
                    </div>
                  </>
                );
                const rowStyle = i < menuItems.length - 1 ? { borderBottom: "1px solid #1e1e1e" } : undefined;
                const rowClass = "flex w-full items-center justify-between px-4 py-3.5 text-left";
                if (item.href) {
                  return (
                    <a key={i} href={item.href} className={rowClass} style={rowStyle}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <motion.button key={i} whileTap={{ scale: 0.99 }} onClick={item.action}
                    className={rowClass} style={rowStyle}>
                    {inner}
                  </motion.button>
                );
              })}
            </div>

            {/* Logout */}
            <div className="mt-3 overflow-hidden rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid #1e1e1e" }}>
              <motion.button whileTap={{ scale: 0.99 }} onClick={currentUser ? handleLogout : () => navigate("/auth")}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(246,70,93,0.12)" }}>
                  <LogOut size={15} style={{ color: "#f6465d" }} />
                </div>
                <span className="text-sm font-bold" style={{ color: "#f6465d" }}>
                  {currentUser ? t.logout : t.loginRegister}
                </span>
              </motion.button>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px]" style={{ color: "#2a2a2a" }}>
            Obyo Option v2.4.1 • Build 2024.01
          </p>
        </div>
      </div>

      {/* About modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.80)" }}
            onClick={() => setShowAbout(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-6" style={{ background: "#0f0f0f", borderTop: "1px solid #1e1e1e" }}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Obyo Option Hakkında</h3>
                <button onClick={() => setShowAbout(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "#1a1a1a", color: "#555" }}>
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "#666" }}>
                <p>Obyo Option, kullanıcıların kripto para, döviz ve emtia piyasalarında ikili opsiyon işlemleri yapmasına olanak tanıyan bir ticaret platformudur.</p>
                <p>Platform yalnızca <span className="font-bold" style={{ color: "#FFB800" }}>eğitim ve simülasyon amaçlıdır</span>. Gerçek para işlemi yapılmaz.</p>
                <div className="rounded-xl p-3" style={{ backgroundColor: "#171717", border: "1px solid #222" }}>
                  <p className="mb-1 text-xs font-bold text-white">Yasal Uyarı</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#555" }}>İkili opsiyonlar yüksek risk içerir. Bu platform yatırım tavsiyesi vermez. Simülasyon sonuçları gerçek piyasa performansını garanti etmez.</p>
                </div>
              </div>
              <button onClick={() => setShowAbout(false)} className="mt-5 w-full rounded-xl py-3 text-sm font-black text-black" style={{ background: "#FF6B00" }}>
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeaderboardModal show={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ProfilePhotoModal show={showPhotoModal} onClose={() => setShowPhotoModal(false)} />
      <KycModal show={showKycModal} onClose={() => setShowKycModal(false)} />
      <LanguageModal
        show={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </>
  );
}
