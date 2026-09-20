import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  User, Settings, Bell, Shield, ChevronRight,
  HelpCircle, LogOut, X, Hash, Wallet, Camera, Trophy, ShieldCheck, CheckCircle2,
  Gift, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeaderboardModal } from "@/components/leaderboard-modal";
import { ProfilePhotoModal } from "@/components/profile-photo-modal";
import { LanguageModal } from "@/components/language-modal";
import { KycModal } from "@/components/kyc-modal";

import { useLanguage } from "@/context/LanguageContext";
import { VIPLevelCard } from "@/components/vip-level-card";
import { Bonus, UserBonusClaim, listenBonuses, listenUserClaims, getUnclaimedBonusCount } from "@/lib/bonuses";

export default function Profile() {
  const [, navigate]   = useLocation();
  const { currentUser, logout, deleteUserPermanently } = useAuth();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [showAbout, setShowAbout]             = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPhotoModal, setShowPhotoModal]   = useState(false);
  const [showLangModal, setShowLangModal]     = useState(false);
  const [showKycModal, setShowKycModal]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [notifState, setNotifState]           = useState(true);
  const [bonuses, setBonuses]                 = useState<Bonus[]>([]);
  const [claims, setClaims]                   = useState<UserBonusClaim[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("kyc=open")) {
      setShowKycModal(true);
    }
  }, []);

  useEffect(() => {
    const unsubBonuses = listenBonuses((list) => {
      setBonuses(list);
    });
    return () => unsubBonuses();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setClaims([]);
      return;
    }
    const unsubClaims = listenUserClaims(currentUser.id, currentUser.email, (userClaims) => {
      setClaims(userClaims);
    });
    return () => unsubClaims();
  }, [currentUser]);

  // Calculate available active bonuses matching bonuses page logic
  const unclaimedBonusCount = getUnclaimedBonusCount(bonuses, claims, currentUser);

  const handleLogout = () => { logout(); navigate("/auth"); };

  const handleDeleteAccount = async () => {
    if (!currentUser || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUserPermanently(currentUser.id, currentUser.email);
      if (auth.currentUser) {
        await auth.currentUser.delete().catch((err) => {
          console.warn("Firebase auth user delete error:", err);
        });
      }
      localStorage.removeItem("obyo_cached_name");
      localStorage.removeItem("obyo_custom_user_id");
      localStorage.removeItem("obyo_token");
      await logout();
      toast({
        title: t.accountDeleted,
        description: t.deleteAccount,
      });
      setShowDeleteModal(false);
      navigate("/auth");
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      toast({
        title: "Hata",
        description: err?.message || "Hesap silinemedi.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isVerified = currentUser?.kycStatus === "verified";

  const menuItems: any[] = [
    { icon: Trophy,      label: t.leaderboard || "Lider Tablosu", value: t.daily || "Günlük", action: () => navigate("/leaderboard"),     href: undefined, customColor: undefined },
    { icon: Gift,        label: "Bonuslar",                       value: "",                   badge: unclaimedBonusCount > 0 ? unclaimedBonusCount : undefined, action: () => navigate("/bonuses"),         href: undefined, customColor: undefined },
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

              {!currentUser && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black text-black"
                  style={{ background: "#FFB800" }}>
                  DEMO
                </div>
              )}
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

          {/* ── VIP Level Widget (Kayıt veya giriş yapılmadan statü kısmı gözükmez) ── */}
          {currentUser && (
            <VIPLevelCard 
              totalDeposited={currentUser.totalDeposited ?? 0} 
              currency={currentUser.currency} 
            />
          )}

          {/* ── KYC Status Card ── */}
          {currentUser && currentUser.kycStatus !== "verified" && (
            <div className="px-4 mb-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowKycModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all cursor-pointer"
                style={{
                  background: "linear-gradient(180deg, #161616 0%, #0e0e0e 100%)",
                  border: isVerified ? "1px solid rgba(14,203,129,0.25)" : "1px solid #262626",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)"
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
                    style={{
                      backgroundColor: isVerified ? "rgba(14,203,129,0.1)" : "rgba(255,255,255,0.05)",
                      borderColor: isVerified ? "rgba(14,203,129,0.25)" : "rgba(255,255,255,0.1)",
                      color: isVerified ? "#0ecb81" : "rgba(255,255,255,0.7)"
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white/90">{t.kycTitle}</h3>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: isVerified ? "rgba(14,203,129,0.12)" : currentUser.kycStatus === "pending" ? "rgba(255,184,0,0.12)" : "rgba(255,255,255,0.03)",
                          borderColor: isVerified ? "rgba(14,203,129,0.25)" : currentUser.kycStatus === "pending" ? "rgba(255,184,0,0.25)" : "rgba(255,255,255,0.08)",
                          color: isVerified ? "#0ecb81" : currentUser.kycStatus === "pending" ? "#FFB800" : "rgba(255,255,255,0.4)"
                        }}
                      >
                        {isVerified ? t.kycVerified : currentUser.kycStatus === "pending" ? t.kycPending : t.kycNotVerified}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {isVerified
                        ? t.kycApprovedSub
                        : currentUser.kycStatus === "pending"
                        ? t.kycReviewSub
                        : t.kycUnverifiedSub}
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
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f6465d] px-1.5 text-[10px] font-black text-white shadow-sm shadow-[#f6465d]/40">
                          {item.badge}
                        </span>
                      )}
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

            {/* Delete Account */}
            {currentUser && (
              <div className="mt-2.5 overflow-hidden rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid #1e1e1e" }}>
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left group transition hover:bg-red-500/5 cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
                    <Trash2 size={15} className="text-red-500/80 group-hover:text-red-500 transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-red-500/80 group-hover:text-red-500 transition-colors">
                    {t.deleteAccount}
                  </span>
                </motion.button>
              </div>
            )}
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
                <h3 className="text-lg font-black text-white">{t.aboutTitle}</h3>
                <button onClick={() => setShowAbout(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "#1a1a1a", color: "#555" }}>
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: "#666" }}>
                <p>{t.aboutDesc1}</p>
                <p>{t.aboutDesc2}</p>
                <div className="rounded-xl p-3" style={{ backgroundColor: "#171717", border: "1px solid #222" }}>
                  <p className="mb-1 text-xs font-bold text-white">{t.aboutLegalTitle}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{t.aboutLegalDesc}</p>
                </div>
              </div>
              <button onClick={() => setShowAbout(false)} className="mt-5 w-full rounded-xl py-3 text-sm font-black text-black cursor-pointer" style={{ background: "#FF6B00" }}>
                {t.aboutOk}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 relative border border-red-500/20"
              style={{ background: "#111111" }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>

              <h3 className="text-center text-lg font-bold text-white mb-2">
                {t.deleteAccount}
              </h3>
              <p className="text-center text-xs text-white/60 leading-relaxed mb-6">
                {t.deleteAccountDesc}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/30"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span>{isDeleting ? "..." : t.deleteAccountConfirm}</span>
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeaderboardModal show={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ProfilePhotoModal show={showPhotoModal} onClose={() => setShowPhotoModal(false)} />
      {currentUser && <KycModal show={showKycModal} onClose={() => setShowKycModal(false)} />}
      <LanguageModal
        show={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </>
  );
}
