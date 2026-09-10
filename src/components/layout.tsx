import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Clock, BarChart2, Wallet, Gem, ChevronDown, Bell, Settings, Phone, Check } from "lucide-react";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode, type AccMode } from "@/context/AccountModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationsModal } from "@/components/notifications-modal";
import { LanguageModal } from "@/components/language-modal";
import { AnimatedBalance } from "@/components/animated-balance";
import { useLanguage } from "@/context/LanguageContext";

function initials(name?: string, surname?: string) {
  if (!name && !surname) return "OB";
  return `${name?.charAt(0) ?? ""}${surname?.charAt(0) ?? ""}`.toUpperCase();
}

/* ── Realistic 3D Blue Crystal Diamond ─────────────────────────────────────── */
function BlueDiamond3D({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`shrink-0 ${className}`}
      style={{
        transform: "rotate(-14deg)",
        filter: "drop-shadow(0 4px 10px rgba(0, 150, 255, 0.65)) drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
      }}
    >
      <defs>
        {/* Diamond Outer Glass Glow */}
        <radialGradient id="rdGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#0284C7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
        </radialGradient>

        {/* Deep Internal Pavilion Refraction (Back) */}
        <linearGradient id="rdPavBackL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#075985" />
          <stop offset="50%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#082F49" />
        </linearGradient>
        <linearGradient id="rdPavBackR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#075985" />
          <stop offset="100%" stopColor="#021E36" />
        </linearGradient>

        {/* Pavilion Main Front Center */}
        <linearGradient id="rdPavCenter" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="25%" stopColor="#38BDF8" />
          <stop offset="65%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* Pavilion Front Left Facet */}
        <linearGradient id="rdPavFrontL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        {/* Pavilion Front Right Facet */}
        <linearGradient id="rdPavFrontR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="45%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>

        {/* Pavilion Far Left & Right Outers */}
        <linearGradient id="rdPavOuterL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="rdPavOuterR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#082F49" />
        </linearGradient>

        {/* Table Top Facet - Crystalline Transparency */}
        <linearGradient id="rdTable" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#E0F2FE" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#7DD3FC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.85" />
        </linearGradient>

        {/* Crown Upper Bezel Left */}
        <linearGradient id="rdCrownBezelL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.85" />
        </linearGradient>

        {/* Crown Upper Bezel Center */}
        <linearGradient id="rdCrownCenter" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#7DD3FC" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.85" />
        </linearGradient>

        {/* Crown Upper Bezel Right */}
        <linearGradient id="rdCrownBezelR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.85" />
        </linearGradient>

        {/* Crown Side Corners */}
        <linearGradient id="rdCrownSideL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="rdCrownSideR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        {/* Internal Caustic Reflection (Prism Sheen) */}
        <linearGradient id="rdPrism" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#BAE6FD" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Ambient Diamond Glow Backing */}
      <circle cx="24" cy="24" r="22" fill="url(#rdGlow)" />

      {/* ── 1. PAVILION LOWER FACETS (Bottom cone) ───────────────────── */}
      {/* Outer Left Pavilion */}
      <polygon points="4,21 12,23 24,44" fill="url(#rdPavOuterL)" />
      {/* Front Left Pavilion */}
      <polygon points="12,23 20,24 24,44" fill="url(#rdPavFrontL)" />
      {/* Front Center-Left Pavilion */}
      <polygon points="20,24 24,24 24,44" fill="url(#rdPavCenter)" opacity="0.95" />
      {/* Front Center-Right Pavilion */}
      <polygon points="24,24 28,24 24,44" fill="url(#rdPavCenter)" opacity="0.9" />
      {/* Front Right Pavilion */}
      <polygon points="28,24 36,23 24,44" fill="url(#rdPavFrontR)" />
      {/* Outer Right Pavilion */}
      <polygon points="36,23 44,21 24,44" fill="url(#rdPavOuterR)" />

      {/* ── 2. INTERNAL REFRACTIONS & CAUSTIC FACETS (Glass Depth) ───── */}
      <polygon points="12,23 24,34 20,24" fill="#E0F2FE" opacity="0.35" />
      <polygon points="28,24 24,34 36,23" fill="#BAE6FD" opacity="0.25" />
      <polygon points="17,14 24,24 20,24" fill="#FFFFFF" opacity="0.4" />
      <polygon points="31,14 24,24 28,24" fill="#BAE6FD" opacity="0.3" />

      {/* ── 3. CROWN LOWER FACETS (Above Girdle) ────────────────────── */}
      <polygon points="4,21 11,14 12,23" fill="url(#rdCrownSideL)" />
      <polygon points="12,23 11,14 17,14 20,24" fill="url(#rdCrownBezelL)" />
      <polygon points="20,24 17,14 31,14 28,24" fill="url(#rdCrownCenter)" />
      <polygon points="28,24 31,14 37,14 36,23" fill="url(#rdCrownBezelR)" />
      <polygon points="36,23 37,14 44,21" fill="url(#rdCrownSideR)" />

      {/* ── 4. CROWN UPPER FACETS & TABLE (Top Facet) ───────────────── */}
      {/* Top back facets */}
      <polygon points="11,14 16,8 24,8 17,14" fill="#FFFFFF" opacity="0.75" />
      <polygon points="24,8 32,8 37,14 31,14" fill="#BAE6FD" opacity="0.65" />
      <polygon points="11,14 16,8 4,21" fill="#7DD3FC" opacity="0.55" />
      <polygon points="32,8 37,14 44,21" fill="#38BDF8" opacity="0.5" />

      {/* Table (Main Center Diamond Face) */}
      <polygon
        points="16,8 32,8 31,14 17,14"
        fill="url(#rdTable)"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="0.5"
      />

      {/* ── 5. CRYSTAL FACET EDGES (Razor-sharp Glass Outlines) ──────── */}
      <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.45" strokeLinejoin="round" fill="none">
        {/* Girdle belt */}
        <polyline points="4,21 12,23 20,24 28,24 36,23 44,21" />
        {/* Crown facet lines */}
        <line x1="11" y1="14" x2="17" y2="14" />
        <line x1="17" y1="14" x2="31" y2="14" />
        <line x1="31" y1="14" x2="37" y2="14" />
        <line x1="17" y1="14" x2="20" y2="24" />
        <line x1="31" y1="14" x2="28" y2="24" />
        <line x1="11" y1="14" x2="12" y2="23" />
        <line x1="37" y1="14" x2="36" y2="23" />
        {/* Pavilion facet lines to culet */}
        <line x1="4" y1="21" x2="24" y2="44" stroke="rgba(255,255,255,0.3)" />
        <line x1="12" y1="23" x2="24" y2="44" stroke="rgba(255,255,255,0.4)" />
        <line x1="20" y1="24" x2="24" y2="44" stroke="rgba(255,255,255,0.55)" />
        <line x1="28" y1="24" x2="24" y2="44" stroke="rgba(255,255,255,0.45)" />
        <line x1="36" y1="23" x2="24" y2="44" stroke="rgba(255,255,255,0.3)" />
        <line x1="44" y1="21" x2="24" y2="44" stroke="rgba(255,255,255,0.25)" />
      </g>

      {/* ── 6. SPECULAR REFLECTIONS & HIGH-BRILLIANCE SPARKLES ───────── */}
      {/* Primary Table Glare / Glass Sheen */}
      <polygon
        points="16,8 25,8 21,14 17,14"
        fill="#FFFFFF"
        opacity="0.8"
      />

      {/* Main Flash Sparkle on Crown Corner */}
      <g transform="translate(17, 14)">
        <circle cx="0" cy="0" r="1.6" fill="#FFFFFF" />
        <path d="M-6,0 Q0,0 0,-6 Q0,0 6,0 Q0,0 0,6 Q0,0 -6,0 Z" fill="#FFFFFF" opacity="0.95" />
        <circle cx="0" cy="0" r="3.5" fill="#E0F2FE" opacity="0.45" />
      </g>

      {/* Secondary Glint on Culet/Girdle */}
      <g transform="translate(32, 9)">
        <circle cx="0" cy="0" r="0.9" fill="#FFFFFF" />
        <path d="M-3.5,0 Q0,0 0,-3.5 Q0,0 3.5,0 Q0,0 0,3.5 Q0,0 -3.5,0 Z" fill="#FFFFFF" opacity="0.85" />
      </g>
    </svg>
  );
}

/* ── Account Mode Switcher ───────────────────────────────────────────────── */
function AccountSwitcher({
  show, onClose, mode, onSelect, demoBalance, realBalance, hasRealAccount, align = "left", onRealClick, currency = "TL"
}: {
  show: boolean; onClose: () => void;
  mode: AccMode; onSelect: (m: AccMode) => void;
  demoBalance: number; realBalance: number; hasRealAccount: boolean;
  align?: "left" | "right";
  onRealClick?: () => void;
  currency?: string;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div ref={ref}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 z-50 w-56 rounded-2xl overflow-hidden`}
          style={{ background: "#0d0d0d", border: "1px solid #222", boxShadow: "0 16px 40px rgba(0,0,0,0.7)" }}>

          <div className="px-3 pt-3 pb-1">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-wider">{t.selectAccount}</p>
          </div>

          {/* Demo */}
          <button onClick={() => { onSelect("demo"); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors hover:bg-white/4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: mode === "demo" ? "rgba(255,107,0,0.15)" : "#111", border: mode === "demo" ? "1px solid rgba(255,107,0,0.3)" : "1px solid #1e1e1e" }}>
              <BarChart2 size={13} style={{ color: mode === "demo" ? "#FF6B00" : "#555" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black" style={{ color: mode === "demo" ? "#FF6B00" : "#888" }}>{t.demoAccount}</p>
              <AnimatedBalance value={demoBalance} currency={currency} className="text-[10px] font-bold text-[#FFB800]" />
            </div>
            {mode === "demo" && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
            )}
          </button>

          {/* Real */}
          <button onClick={() => { 
              if (!hasRealAccount && onRealClick) onRealClick();
              else onSelect("real");
              onClose(); 
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors hover:bg-white/4"
            >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: mode === "real" ? "rgba(14,203,129,0.12)" : "#111", border: mode === "real" ? "1px solid rgba(14,203,129,0.3)" : "1px solid #1e1e1e" }}>
              <Gem size={13} style={{ color: mode === "real" ? "#0ecb81" : "#555" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black" style={{ color: hasRealAccount ? (mode === "real" ? "#0ecb81" : "#888") : "#333" }}>
                {t.realAccount}
              </p>
              {hasRealAccount ? (
                <AnimatedBalance value={realBalance} currency={currency} className="text-[10px] font-bold text-[#0ecb81]" />
              ) : (
                <p className="text-[10px] font-bold text-[#333]">{t.loginRegister}</p>
              )}
            </div>
            {mode === "real" && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#0ecb81]" />
            )}
          </button>

          <div className="px-3 py-2.5 border-t border-[#1a1a1a]">
            <p className="text-[9px] text-white/20 leading-relaxed">
              {t.demoNote}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────────────────── */
function DesktopSidebar({
  collapsed, onToggle,
}: {
  collapsed?: boolean; onToggle?: () => void;
}) {
  const { t } = useLanguage();
  const [location] = useLocation();

  const navItems = [
    { path: "/",        icon: BarChart2, label: t.navTrade    },
    { path: "/history", icon: Clock,    label: t.navHistory  },
    { path: "/wallet",  icon: Wallet,   label: t.navBalance  },
    { path: "/profile", icon: Gem,      label: t.navVip      },
  ];

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-white/5 bg-black h-full transition-all duration-200"
      style={{ width: collapsed ? 56 : 224 }}
    >
      {/* Logo / toggle */}
      <button
        onClick={onToggle}
        className="flex h-16 shrink-0 items-center border-b border-white/5 w-full hover:bg-white/3 transition-colors overflow-hidden cursor-pointer"
        style={{ paddingLeft: collapsed ? 0 : 20, justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 10 }}
        title="Obyo Option"
      >
        <img
          src="/logo.png"
          alt="Obyo Option"
          className="h-8 w-8 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(255,107,0,0.25)]"
        />
        {!collapsed && (
          <div className="flex items-center gap-1.5 min-w-0 text-left">
            <span className="text-base font-black text-white tracking-tight leading-none">Obyo</span>
            <span className="text-base font-black text-[#FF6B00] tracking-tight leading-none">Option</span>
          </div>
        )}
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 mt-4 flex-1">
        {navItems.map((item) => {
          const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center rounded-xl transition-all cursor-pointer ${
                  collapsed ? "justify-center py-3 px-0" : "gap-3 px-3 py-2.5"
                } ${active ? "bg-[#FF6B00]/12 border border-[#FF6B00]/20" : "hover:bg-white/4 border border-transparent"}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={15} className={active ? "text-[#FF6B00]" : "text-white/30"} strokeWidth={active ? 2.2 : 1.7} />
                {!collapsed && (
                  <>
                    <span className={`text-sm font-bold ${active ? "text-[#FF6B00]" : "text-white/40"}`}>{item.label}</span>
                    {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom badges (hidden when collapsed) */}
      {!collapsed && (
        <div className="px-3 pb-5 flex flex-col gap-2">
          <Link href="/privacy">
            <span className="block text-center text-[10px] text-white/20 hover:text-white/40 transition-colors py-1 font-semibold">
              {t.privacyPolicy}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}

function CallRequestMenu({ buttonClass, iconSize = 15, align = "right" }: { buttonClass: string, iconSize?: number, align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const { currentUser } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleRequest = () => {
    if (!currentUser || currentUser.totalDeposited <= 0) return;
    setRequested(true);
    setTimeout(() => {
      setOpen(false);
      setRequested(false);
    }, 3000);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className={buttonClass}
        title="Müşteri Hizmetleri"
        onClick={() => setOpen(s => !s)}
      >
        <Phone size={iconSize} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`fixed top-[64px] left-1/2 -translate-x-1/2 sm:absolute sm:top-full sm:left-auto sm:-right-2 sm:translate-x-0 mt-2 w-[calc(100vw-32px)] max-w-[320px] sm:w-64 rounded-2xl border border-white/10 bg-[#111] p-3 shadow-2xl z-50 sm:origin-top-right origin-top`}
          >
            {(!currentUser || currentUser.totalDeposited <= 0) ? (
              <div className="py-2 px-1 text-center">
                <p className="text-[11px] text-white/50 leading-relaxed mb-2">
                  Aranma talebi oluşturabilmek için hesabınıza en az bir kez para yatırmış olmanız gerekmektedir.
                </p>
                <Link href="/wallet">
                  <button onClick={() => setOpen(false)} className="w-full py-2 rounded-lg bg-white/10 text-white font-bold text-[10px] hover:bg-white/20 transition-colors">
                    Yatırım Yap
                  </button>
                </Link>
              </div>
            ) : requested ? (
              <div className="flex flex-col items-center justify-center py-3 gap-2">
                <div className="h-8 w-8 rounded-full bg-[#0ecb81]/20 flex items-center justify-center text-[#0ecb81]">
                  <Check size={16} />
                </div>
                <p className="text-xs font-bold text-white text-center">Talebiniz Alındı</p>
                <p className="text-[10px] text-white/50 text-center">Temsilcimiz en kısa sürede sizi arayacaktır.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-white/50 text-center mb-1">Müşteri hizmetleri tarafından aranmak ister misiniz?</p>
                <button
                  onClick={handleRequest}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-colors"
                >
                  Aranma Talebi Oluştur
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Desktop Header ──────────────────────────────────────────────────────── */
function DesktopHeader({
  onWallet,
  onSettings,
}: {
  onWallet: () => void;
  onNotif?: () => void;
  onSettings: () => void;
}) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { mode, setMode, displayBalance, isReal, currency } = useAccountMode();
  const { balance: demoBalance } = useDemoAccount();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const realBalance = currentUser?.realBalance ?? 0;
  const modeColor = isReal ? "#0ecb81" : "#FF6B00";
  const modeLabel = isReal ? t.realAccount : t.demoAccount;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-black px-6">
      <div />
      <div className="flex items-center gap-2.5">
        {/* Müşteri Hizmetleri / Telefon Butonu */}
        <CallRequestMenu buttonClass="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14151a] border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all cursor-pointer shrink-0" iconSize={15} align="right" />

        {/* Bakiye Kısmı (Hesap Seçici ve Bakiye - diğer butonlarla aynı h-9 boyutta) */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => currentUser ? setShowSwitcher(s => !s) : onWallet()}
            className="flex h-9 items-center gap-2 px-3 rounded-xl bg-[#14151a] border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer select-none shrink-0"
            title="Hesap Seçimi ve Bakiye"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: modeColor }} />
              <span className="text-xs font-semibold text-white/50 whitespace-nowrap">
                {modeLabel}:
              </span>
            </div>
            <AnimatedBalance
              value={displayBalance}
              currency={currency}
              className="text-xs font-black text-white tracking-tight"
            />
            <ChevronDown size={13} className="text-white/40 shrink-0 ml-0.5" />
          </motion.button>

          <AccountSwitcher
            align="right"
            show={showSwitcher}
            onClose={() => setShowSwitcher(false)}
            mode={mode}
            onSelect={(m) => setMode(m)}
            demoBalance={demoBalance}
            realBalance={realBalance}
            hasRealAccount={!!currentUser}
            onRealClick={() => navigate("/auth")}
            currency={currency}
          />
        </div>

        {/* Dil Ayarları */}
        <button
          onClick={onSettings}
          className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer shrink-0"
        >
          <Settings size={13} />
          {t.languageSettings}
        </button>

        {/* Cüzdan Butonu */}
        <button
          onClick={onWallet}
          className="flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black text-black transition-transform active:scale-95 cursor-pointer shrink-0"
          style={{ background: "#FF6B00", boxShadow: "0 0 14px rgba(255,107,0,0.3)" }}
        >
          <Wallet size={12} />
          {t.wallet}
        </button>

        {/* Unauthenticated desktop: Kayıt Ol / Giriş Yap button */}
        {!currentUser && (
          <Link href="/auth">
            <button
              className="flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-black text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:opacity-90 transition-all cursor-pointer shadow-md shadow-[#FF6B00]/25 shrink-0"
            >
              Kayıt Ol / Giriş Yap
            </button>
          </Link>
        )}

        {/* Profil Avatar */}
        <Link href="/profile">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-black overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-white/10 shrink-0"
            style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials(currentUser?.name, currentUser?.surname)
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { mode, setMode, displayBalance, isReal, currency } = useAccountMode();
  const { balance: demoBalance } = useDemoAccount();
  const [showSwitcher,      setShowSwitcher]       = useState(false);
  const [sidebarCollapsed,  setSidebarCollapsed]   = useState(false);
  const [showNotifModal,    setShowNotifModal]     = useState(false);
  const [showLangModal,     setShowLangModal]      = useState(false);
  const [currentLang,       setCurrentLang]        = useState(() => localStorage.getItem("obyo_lang") || "Türkçe");
  const isMobile = useIsMobile();

  const tabs = [
    { path: "/history", icon: Clock,    label: t.navHistory },
    { path: "/",        icon: BarChart2, label: t.navTrade   },
    { path: "/wallet",  icon: Wallet,   label: t.navBalance  },
    { path: "/profile", icon: Gem,      label: t.navVip      },
  ];

  const handleSelectLang = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem("obyo_lang", lang);
  };

  const realBalance = currentUser?.realBalance ?? 0;
  const sym = currency === "TL" ? "₺" : "$";
  const modeColor   = isReal ? "#0ecb81" : "#FF6B00";
  const modeLabel   = isReal ? t.realAccount : t.demoAccount;

  if (isMobile) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col bg-black text-white">
        {/* ── Mobile Header ─────────────────────────────────────────── */}
        <header
          className="flex h-[56px] shrink-0 items-center justify-between px-3.5"
          style={{ background: "#000000" }}
        >
          {/* Left: avatar (PP) */}
          <div className="flex items-center">
            <Link href="/profile">
              <motion.div
                whileTap={{ scale: 0.94 }}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black cursor-pointer shadow-sm overflow-hidden border border-white/10"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="PP" className="h-full w-full object-cover" />
                ) : (
                  initials(currentUser?.name, currentUser?.surname)
                )}
              </motion.div>
            </Link>
          </div>

          {/* Right: Telefon + Bakiye + Cüzdan */}
          <div className="relative flex items-center gap-1.5">
            {/* Müşteri Hizmetleri / Telefon Butonu (Bakiyenin hemen yanında) */}
            <CallRequestMenu buttonClass="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-[#14151a] border border-white/10 text-white/80 shrink-0 cursor-pointer" iconSize={15} align="right" />

            {/* Bakiye Kısmı */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => currentUser ? setShowSwitcher(s => !s) : navigate("/wallet")}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex flex-col items-end justify-center">
                <span className="text-[9px] font-medium leading-tight text-white/50">
                  {isReal ? t.realAccount : t.demoAccount}
                </span>
                <AnimatedBalance
                  value={displayBalance}
                  currency={currency}
                  className="text-[12px] font-bold text-white tracking-tight"
                />
              </div>
              <ChevronDown size={11} className="text-white/40 shrink-0" />
            </motion.button>

            {/* Cüzdan Butonu */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/wallet")}
              className="flex h-[34px] items-center gap-1.5 rounded-xl px-2.5 font-black text-black text-xs shrink-0"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 4px 14px rgba(255,107,0,0.35)" }}
              title="Cüzdan"
            >
              <Wallet size={13} />
              <span>{t.wallet}</span>
            </motion.button>

            <AccountSwitcher
              align="right"
              show={showSwitcher} onClose={() => setShowSwitcher(false)}
              mode={mode} onSelect={(m) => setMode(m)}
              demoBalance={demoBalance} realBalance={realBalance}
              hasRealAccount={!!currentUser}
              onRealClick={() => navigate("/auth")}
              currency={currency}
            />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden bg-black relative">
          <div className="absolute inset-0 flex flex-col">
            {children}
          </div>
        </main>

        {/* ── Bottom Nav ──────────────────────────────────────────────── */}
        <nav
          className="flex h-[60px] shrink-0 items-center justify-around px-2"
          style={{ background: "#000000" }}
        >
          {tabs.map((tab) => {
            const active = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                className="flex flex-1 items-center justify-center"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {active ? (
                    <motion.div
                      key="pill"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.16 }}
                      whileTap={{ scale: 0.94 }}
                      className="flex items-center gap-1.5 rounded-2xl px-3.5 py-[8px]"
                      style={{
                        background: "#1d1d1d",
                        border: "1px solid rgba(255,255,255,0.11)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                      }}
                    >
                      <Icon size={15} strokeWidth={2.4} style={{ color: "#fff" }} />
                      <span className="text-[11px] font-black text-white leading-none whitespace-nowrap">{tab.label}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex flex-col items-center justify-center gap-1 py-1"
                    >
                      <Icon size={18} style={{ color: "rgba(255,255,255,0.35)" }} strokeWidth={1.6} />
                      <span className="text-[9.5px] font-bold leading-none whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {tab.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ── Desktop layout ────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DesktopHeader
          onWallet={() => navigate("/wallet")}
          onNotif={() => setShowNotifModal(v => !v)}
          onSettings={() => setShowLangModal(true)}
        />

        <main className="flex-1 min-h-0 overflow-hidden bg-black">
          {children}
        </main>
      </div>

      <NotificationsModal show={showNotifModal} onClose={() => setShowNotifModal(false)} />
      <LanguageModal
        show={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </div>
  );
}
