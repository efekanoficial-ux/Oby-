import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  User, Settings, Bell, Shield, ChevronRight,
  HelpCircle, LogOut, X, Hash, Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletModal } from "@/components/wallet-modal";


export default function Profile() {
  const [, navigate]   = useLocation();
  const { currentUser, logout } = useAuth();
  const [showAbout, setShowAbout]   = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const handleLogout = () => { logout(); navigate("/auth"); };

  const menuItems = [
    { icon: Wallet,      label: "Para Yatır / Çek",     value: "",        action: () => setShowWallet(true),   href: undefined         },
    { icon: Settings,    label: "Dil",                   value: "Türkçe",  action: () => {},                    href: undefined         },
    { icon: Bell,        label: "Bildirimler",            value: "Açık",    action: () => {},                    href: undefined         },
    { icon: Shield,      label: "Gizlilik Politikası",    value: "",         action: () => navigate("/privacy"),  href: "/privacy"        },
    { icon: HelpCircle,  label: "Hakkında",               value: "",         action: () => setShowAbout(true),    href: undefined         },
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
              <div className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 0 28px rgba(255,107,0,0.30)" }}>
                {currentUser
                  ? <span className="text-3xl font-black text-black">{initials}</span>
                  : <User size={40} className="text-black" />
                }
              </div>
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

            {/* Real balance */}
            {currentUser && (
              <div className="mt-4 flex gap-3">
                <div className="flex flex-col items-center rounded-xl px-5 py-3 border border-[#0ecb81]/20"
                  style={{ background: "rgba(14,203,129,0.06)" }}>
                  <span className="text-[10px] font-bold text-white/30 mb-0.5">Gerçek Bakiye</span>
                  <span className="text-lg font-black text-[#0ecb81]">${currentUser.realBalance.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center rounded-xl px-5 py-3 border border-[#FFB800]/20"
                  style={{ background: "rgba(255,184,0,0.06)" }}>
                  <span className="text-[10px] font-bold text-white/30 mb-0.5">Toplam Yatırım</span>
                  <span className="text-lg font-black text-[#FFB800]">${currentUser.totalDeposited.toFixed(2)}</span>
                </div>
              </div>
            )}

          </div>

          {/* ── Settings group ───────────────────────────────────────── */}
          <div className="px-4">
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid #1e1e1e" }}>
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: "#1e1e1e" }}>
                        <Icon size={15} style={{ color: "#666" }} />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && <span className="text-xs" style={{ color: "#555" }}>{item.value}</span>}
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
                  {currentUser ? "Çıkış Yap" : "Giriş Yap / Kayıt Ol"}
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

      <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />
    </>
  );
}
