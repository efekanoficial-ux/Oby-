import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Clock, BarChart2, Wallet, Gem, ChevronDown, Bell, Settings } from "lucide-react";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode, type AccMode } from "@/context/AccountModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { WalletModal } from "@/components/wallet-modal";
import { t } from "@/i18n";

const tabs = [
  { path: "/history", icon: Clock,    label: t.navHistory },
  { path: "/",        icon: BarChart2, label: t.navTrade   },
  { path: "/balance", icon: Wallet,   label: t.navBalance  },
  { path: "/profile", icon: Gem,      label: t.navVip      },
];

function initials(name?: string, surname?: string) {
  if (!name && !surname) return "OB";
  return `${name?.charAt(0) ?? ""}${surname?.charAt(0) ?? ""}`.toUpperCase();
}

/* ── Account Mode Switcher ───────────────────────────────────────────────── */
function AccountSwitcher({
  show, onClose, mode, onSelect, demoBalance, realBalance, hasRealAccount,
}: {
  show: boolean; onClose: () => void;
  mode: AccMode; onSelect: (m: AccMode) => void;
  demoBalance: number; realBalance: number; hasRealAccount: boolean;
}) {
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
          className="absolute left-0 top-full mt-2 z-50 w-56 rounded-2xl overflow-hidden"
          style={{ background: "#0d0d0d", border: "1px solid #222", boxShadow: "0 16px 40px rgba(0,0,0,0.7)" }}>

          <div className="px-3 pt-3 pb-1">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-wider">Hesap Seçin</p>
          </div>

          {/* Demo */}
          <button onClick={() => { onSelect("demo"); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors hover:bg-white/4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: mode === "demo" ? "rgba(255,107,0,0.15)" : "#111", border: mode === "demo" ? "1px solid rgba(255,107,0,0.3)" : "1px solid #1e1e1e" }}>
              <BarChart2 size={13} style={{ color: mode === "demo" ? "#FF6B00" : "#555" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black" style={{ color: mode === "demo" ? "#FF6B00" : "#888" }}>Demo Hesap</p>
              <p className="text-[10px] font-bold text-[#FFB800]">${demoBalance.toFixed(2)}</p>
            </div>
            {mode === "demo" && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
            )}
          </button>

          {/* Real */}
          <button onClick={() => { onSelect("real"); onClose(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors hover:bg-white/4"
            disabled={!hasRealAccount}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: mode === "real" ? "rgba(14,203,129,0.12)" : "#111", border: mode === "real" ? "1px solid rgba(14,203,129,0.3)" : "1px solid #1e1e1e" }}>
              <Gem size={13} style={{ color: mode === "real" ? "#0ecb81" : "#555" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black" style={{ color: hasRealAccount ? (mode === "real" ? "#0ecb81" : "#888") : "#333" }}>
                Gerçek Hesap
              </p>
              <p className="text-[10px] font-bold" style={{ color: hasRealAccount ? "#0ecb81" : "#333" }}>
                {hasRealAccount ? `$${realBalance.toFixed(2)}` : "Para yatırın"}
              </p>
            </div>
            {mode === "real" && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#0ecb81]" />
            )}
          </button>

          <div className="px-3 py-2.5 border-t border-[#1a1a1a]">
            <p className="text-[9px] text-white/20 leading-relaxed">
              Demo hesapta $10.000 sanal bakiye ile işlem yapın.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────────────────── */
function DesktopSidebar({
  mode, displayBalance, onSelect, onWallet, collapsed, onToggle,
}: {
  mode: AccMode; displayBalance: number; onSelect: (m: AccMode) => void;
  onWallet: () => void; collapsed?: boolean; onToggle?: () => void;
}) {
  const [location] = useLocation();
  const { currentUser } = useAuth();
  const { balance: demoBalance } = useDemoAccount();
  const realBalance = currentUser?.realBalance ?? 0;
  const [showSwitcher, setShowSwitcher] = useState(false);

  const navItems = [
    { path: "/",        icon: BarChart2, label: "İşlem"    },
    { path: "/history", icon: Clock,    label: "Geçmiş"    },
    { path: "/balance", icon: Wallet,   label: "Bakiye"    },
    { path: "/profile", icon: Gem,      label: "VIP / Profil" },
  ];

  const isReal = mode === "real" && !!currentUser;
  const modeColor = isReal ? "#0ecb81" : "#FF6B00";
  const modeLabel = isReal ? "Gerçek Hesap" : "Demo Hesap";

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-white/5 bg-black h-full transition-all duration-200"
      style={{ width: collapsed ? 56 : 224 }}
    >
      {/* Logo / toggle */}
      <button
        onClick={onToggle}
        className="flex h-16 shrink-0 items-center border-b border-white/5 w-full hover:bg-white/3 transition-colors overflow-hidden"
        style={{ paddingLeft: collapsed ? 0 : 20, justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 12 }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 overflow-hidden bg-[#111]">
          <img src="/logo.jpg" alt="Obyo" className="h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-black text-white leading-none">Obyo</p>
            <p className="text-[10px] text-[#FF6B00] font-bold leading-none mt-0.5">Option</p>
          </div>
        )}
      </button>

      {/* Balance / Account switcher (hidden when collapsed) */}
      {!collapsed && (
        <div className="mx-3 mt-4 relative">
          <button
            onClick={() => currentUser ? setShowSwitcher(s => !s) : onWallet()}
            className="w-full rounded-xl p-3 border text-left transition-colors"
            style={{
              background: "linear-gradient(135deg,rgba(255,107,0,0.10),rgba(255,184,0,0.05))",
              borderColor: `${modeColor}33`,
            }}>
            <p className="text-[10px] text-white/35 font-semibold mb-0.5">
              {currentUser ? `${currentUser.name} ${currentUser.surname}` : "Demo Hesap"}
            </p>
            <div className="flex items-center gap-1">
              <motion.p key={Math.round(displayBalance * 100)} className="text-xl font-semibold tabular-nums flex-1 text-white">
                ${displayBalance.toFixed(2)}
              </motion.p>
              {currentUser && <ChevronDown size={13} className="text-white/25" />}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: modeColor }} />
              <span className="text-[10px] font-bold" style={{ color: modeColor }}>{modeLabel}</span>
            </div>
          </button>
          <AccountSwitcher
            show={showSwitcher} onClose={() => setShowSwitcher(false)}
            mode={mode} onSelect={onSelect}
            demoBalance={demoBalance} realBalance={realBalance}
            hasRealAccount={!!currentUser}
          />
        </div>
      )}

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
              Gizlilik Politikası
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}

/* ── Desktop Header ──────────────────────────────────────────────────────── */
function DesktopHeader({ onWallet }: { onWallet: () => void }) {
  const { currentUser } = useAuth();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-black px-6">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#0ecb81] animate-pulse" />
        <span className="text-xs font-bold text-white/40">Piyasalar Açık</span>
        <span className="text-white/15 mx-1">|</span>
        <span className="text-xs text-white/25">Forex &amp; OTC · Canlı veri akışı</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-white/40 border border-white/8 hover:border-white/15 transition-colors">
          <Bell size={12} />
          Bildirimler
        </button>
        <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-white/40 border border-white/8 hover:border-white/15 transition-colors">
          <Settings size={12} />
          Ayarlar
        </button>
        <button
          onClick={onWallet}
          className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-black text-black transition-transform active:scale-95"
          style={{ background: "#FF6B00", boxShadow: "0 0 14px rgba(255,107,0,0.3)" }}
        >
          <Wallet size={12} />
          Cüzdan
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-black"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
          {initials(currentUser?.name, currentUser?.surname)}
        </div>
      </div>
    </header>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser } = useAuth();
  const { mode, setMode, displayBalance, isReal } = useAccountMode();
  const { balance: demoBalance } = useDemoAccount();
  const [showWallet,        setShowWallet]        = useState(false);
  const [showSwitcher,      setShowSwitcher]       = useState(false);
  const [sidebarCollapsed,  setSidebarCollapsed]   = useState(false);
  const isMobile = useIsMobile();

  const realBalance = currentUser?.realBalance ?? 0;
  const modeColor   = isReal ? "#0ecb81" : "#FF6B00";
  const modeLabel   = isReal ? "Gerçek Hesap" : "Demo Hesap";

  if (isMobile) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col bg-black text-white">
        {/* ── Mobile Header ─────────────────────────────────────────── */}
        <header
          className="flex h-[56px] shrink-0 items-center justify-between px-4"
          style={{ background: "#000000" }}
        >
          {/* Left: balance/account info */}
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => currentUser ? setShowSwitcher(s => !s) : setShowWallet(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all active:scale-[0.98] text-left"
              style={{
                background: isReal
                  ? "linear-gradient(135deg, #0ecb81, #059669)"
                  : "linear-gradient(135deg, #FF6B00, #FF9500)",
                boxShadow: isReal
                  ? "0 4px 14px rgba(14,203,129,0.35)"
                  : "0 4px 14px rgba(255,107,0,0.35)",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium leading-none text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                    {currentUser ? `${currentUser.name} ${currentUser.surname}` : "Demo Bakiye"}
                  </span>
                  <ChevronDown size={10} className="text-white/80" />
                </div>
                <motion.span
                  key={Math.round(displayBalance * 100)}
                  initial={{ opacity: 0.7 }} animate={{ opacity: 1 }}
                  className="text-[14.5px] font-semibold tabular-nums leading-tight text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                >
                  ${displayBalance.toFixed(2)}
                </motion.span>
              </div>
            </button>

            <AccountSwitcher
              show={showSwitcher} onClose={() => setShowSwitcher(false)}
              mode={mode} onSelect={(m) => setMode(m)}
              demoBalance={demoBalance} realBalance={realBalance}
              hasRealAccount={!!currentUser}
            />
          </div>

          {/* Right: wallet + avatar */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowWallet(true)}
              className="flex h-[34px] items-center gap-1.5 rounded-xl px-3 font-black text-black text-xs"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 4px 14px rgba(255,107,0,0.35)" }}
            >
              <Wallet size={13} />
              <span>Cüzdan</span>
            </motion.button>
            <div
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
            >
              {initials(currentUser?.name, currentUser?.surname)}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden bg-black relative">
          <div className="absolute inset-0 flex flex-col">
            {children}
          </div>
        </main>

        {/* ── Bottom Nav ──────────────────────────────────────────────── */}
        <nav
          className="flex h-[64px] shrink-0 items-center px-2"
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
                      initial={{ opacity: 0, scale: 0.82 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.82 }}
                      transition={{ duration: 0.17, ease: [0.34, 1.2, 0.64, 1] }}
                      whileTap={{ scale: 0.94 }}
                      className="flex items-center gap-2 rounded-2xl px-4 py-[9px]"
                      style={{
                        background: "#1d1d1d",
                        border: "1px solid rgba(255,255,255,0.11)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                      }}
                    >
                      <Icon size={15} strokeWidth={2.4} style={{ color: "#fff" }} />
                      <span className="text-[11px] font-black text-white leading-none">{tab.label}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex flex-col items-center justify-center gap-[5px]"
                    >
                      <Icon size={19} style={{ color: "rgba(255,255,255,0.22)" }} strokeWidth={1.6} />
                      <span className="text-[9px] font-bold leading-none" style={{ color: "rgba(255,255,255,0.22)" }}>
                        {tab.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />
      </div>
    );
  }

  /* ── Desktop layout ────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <DesktopSidebar
        mode={mode}
        displayBalance={displayBalance}
        onSelect={setMode}
        onWallet={() => setShowWallet(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DesktopHeader onWallet={() => setShowWallet(true)} />

        <main className="flex-1 min-h-0 overflow-hidden bg-black">
          {children}
        </main>
      </div>

      <WalletModal show={showWallet} onClose={() => setShowWallet(false)} />
    </div>
  );
}
