import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useLanguage } from "@/context/LanguageContext";
import { AnimatedBalance } from "@/components/animated-balance";
import { UsdtTrc20Icon } from "@/components/usdt-trc20-icon";
import { UsdtErc20Icon } from "@/components/usdt-erc20-icon";
import { BankTransferIcon } from "@/components/bank-transfer-icon";
import { useIsTurkey } from "@/lib/use-country";
import {
  ArrowDownLeft, ArrowUpRight,
  Clock, ArrowDownLeft as DepIcon, ArrowUpRight as WithIcon,
  Hourglass, TrendingUp, TrendingDown, Minus, AlertCircle, Eye, EyeOff, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Method row ─────────────────────────────────────────────────────────── */
function MethodRow({
  icon: Icon, label, sub, color, badge, onClick,
}: {
  icon: React.ElementType; label: string; sub: string; color: string;
  badge: string | null; isLast?: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex w-full items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-white/[0.08] text-left transition-all hover:border-white/20 hover:bg-white/[0.04] active:bg-white/[0.06] backdrop-blur-xl cursor-pointer"
      style={{
        background: "linear-gradient(145deg, rgba(18,20,26,0.7) 0%, rgba(10,12,15,0.95) 100%)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.02) 100%)`,
        }}
      >
        <Icon size={30} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black text-white tracking-tight">{label}</span>
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[8.5px] font-black tracking-wider uppercase border"
              style={{
                background: `${color}18`,
                borderColor: `${color}35`,
                color,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium block mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</span>
      </div>
      <div
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full border border-white/10 transition-colors"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <ArrowUpRight size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
      </div>
    </motion.button>
  );
}

/* ── main page ─────────────────────────────────────────────────────────── */
export default function Balance() {
  const [, navigate] = useLocation();
  const { currentUser, requests, isRejectionViewed } = useAuth();
  const { balance: demoBalance, completedTrades = [] }  = useDemoAccount();
  const { isReal, isBalanceHidden, toggleBalanceHidden } = useAccountMode();
  const { t, langCode }           = useLanguage();
  const isTurkey                  = useIsTurkey();
  const currency = (currentUser as any)?.currency ?? "USD";
  const isTL = currency === "TL";
  const sym = isTL ? "₺" : "$";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  // ── Günlük Sıfırlanan Kâr / Zarar Hesaplaması ─────────────────────────────
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    // 30 saniyede bir gün değişimini veya yeni işlemleri tetikle
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const { todayPnl, todayPercent, todayTradeCount } = useMemo(() => {
    // Bugünün başlangıcı (00:00:00)
    const todayDate = new Date(nowTick);
    todayDate.setHours(0, 0, 0, 0);
    const startOfToday = todayDate.getTime();

    // Aktif moda (Gerçek / Demo) ve bugüne ait tamamlanan işlemler
    const todayTrades = completedTrades.filter((tr) => {
      const modeMatches = isReal ? tr.mode === "real" : (!tr.mode || tr.mode === "demo");
      const closedAt = tr.closedAt || 0;
      return modeMatches && closedAt >= startOfToday;
    });

    if (todayTrades.length === 0) {
      return { todayPnl: 0, todayPercent: 0, todayTradeCount: 0 };
    }

    const netPnl = todayTrades.reduce((sum, tr) => {
      const net = tr.result === "WIN"
        ? (typeof tr.profit === "number" && tr.profit > 0 ? tr.profit : tr.amount * 0.85)
        : (typeof tr.profit === "number" && tr.profit < 0 ? tr.profit : -Math.abs(tr.amount));
      return sum + net;
    }, 0);

    // Yüzde hesabı: Gün başı referans bakiye (mevcut bakiye - net kâr/zarar)
    const currentBal = isReal ? (currentUser?.realBalance ?? 0) : demoBalance;
    const startingBal = currentBal - netPnl;
    const baseBal = startingBal > 0 ? startingBal : (currentBal > 0 ? currentBal : 100);
    const pct = baseBal > 0 ? (netPnl / baseBal) * 100 : 0;

    return {
      todayPnl: Math.round(netPnl * 100) / 100,
      todayPercent: Math.round(pct * 100) / 100,
      todayTradeCount: todayTrades.length,
    };
  }, [completedTrades, isReal, currentUser?.realBalance, demoBalance, nowTick]);

  const isProfit = todayPnl > 0.005;
  const isLoss = todayPnl < -0.005;
  const isZero = !isProfit && !isLoss;

  // Renkler: karsa yeşil, zararsa kırmızı, kar zarar yoksa gri
  const pnlColorClass = isProfit
    ? "text-emerald-400"
    : isLoss
    ? "text-rose-400"
    : "text-neutral-400";

  const pnlBgClass = isProfit
    ? "bg-emerald-500/10 border-emerald-500/25"
    : isLoss
    ? "bg-rose-500/10 border-rose-500/25"
    : "bg-white/[0.04] border-white/10";

  // Değer formatı: TL hesabında TL (₺), Dolar hesabında Dolar ($)
  // İkon zaten yönü (yukarı/aşağı) belirttiği için + ve - işaretleri kaldırıldı
  const absPnlFormatted = Math.abs(todayPnl).toLocaleString(isTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedPnl = `${sym}${absPnlFormatted}`;
  const formattedPercent = `${Math.abs(todayPercent).toFixed(2)}%`;

  const depositMethods = [
    { id: "trc20", icon: UsdtTrc20Icon,   label: "USDT TRC-20",    sub: t.instantApprove,  color: "#26A17B", badge: null },
    { id: "erc20", icon: UsdtErc20Icon,   label: "USDT ERC-20",    sub: t.ethNetwork,      color: "#627EEA", badge: null },
    { id: "iban",  icon: BankTransferIcon,label: t.wireTransfer,   sub: t.hours1to24,      color: "#FFA800", badge: null },
  ];

  const withdrawMethods = [
    { id: "iban",  icon: BankTransferIcon,label: t.bankWire,       sub: t.businessDays1to3, color: "#FFA800", badge: null },
    { id: "trc20", icon: UsdtTrc20Icon,   label: "USDT TRC-20",     sub: t.instant,          color: "#26A17B", badge: null },
    { id: "erc20", icon: UsdtErc20Icon,   label: "USDT ERC-20",     sub: t.ethChain,         color: "#627EEA", badge: null },
  ];

  const allReqs     = currentUser ? requests.filter(r => (
    r.userId === currentUser.id ||
    (r.userEmail && currentUser.email && r.userEmail.toLowerCase() === currentUser.email.toLowerCase())
  )) : [];
  const pendingReqs = allReqs.filter(r => r.status === "pending");
  const unviewedRejectedReqs = allReqs.filter(r => r.status === "rejected" && !isRejectionViewed(r));
  const approvedDep = allReqs.filter(r => r.type === "deposit"  && r.status === "accepted");
  const approvedWit = allReqs.filter(r => r.type === "withdraw" && r.status === "accepted");
  const pendingDep  = allReqs.filter(r => r.type === "deposit"  && r.status === "pending");

  const totalDeposited = currentUser?.totalDeposited ?? 0;
  const totalWithdrawn = currentUser?.totalWithdrawn ?? 0;
  const realBalance    = currentUser?.realBalance    ?? 0;

  const accent    = isReal ? "#0ecb81" : "#FF6B00";
  const balance   = isReal ? realBalance : demoBalance;
  
  const rawMethods = activeTab === "deposit" ? depositMethods : withdrawMethods;
  const methods    = rawMethods.filter((m) => {
    if (!isTurkey && m.id === "iban") {
      return false;
    }
    return true;
  });

  const openWallet = (tab: "deposit" | "withdraw") => {
    navigate(`/wallet?tab=${tab}`);
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto pb-28 bg-[#050608] text-white selection:bg-emerald-500/30">

        {/* ── Top Bar / Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] shadow-inner"
            >
              <div className="h-2 w-2 rounded-full bg-white/70" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Crypto Portfolio</p>
              <p className="text-base font-black text-white tracking-tight">{t.balanceTitle}</p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 border border-white/10 bg-white/[0.05] backdrop-blur-md shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[9.5px] font-black tracking-widest uppercase text-white/80">
              {isReal ? t.realAcc : t.demoAcc}
            </span>
          </div>
        </div>

        {/* ── Crypto Wallet Hero Balance Card (Stable, Neutral Luxury Dark Glass) ── */}
        <div
          className="mx-4 mb-5 rounded-3xl p-5 sm:p-6 relative overflow-hidden backdrop-blur-2xl transition-all"
          style={{
            background: "linear-gradient(145deg, #161821 0%, #0f1117 55%, #0a0b0e 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Ambient radial glow mesh */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)",
              }}
            />
          </div>

          {/* Top card pill: Network status & balance mask toggle */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-black tracking-widest uppercase text-white/70">
                {isReal ? "LIVE WALLET" : "SIMULATED WALLET"}
              </span>
            </div>

          </div>

          {/* Centered Balance Display (Hero - Always Crisp White) */}
          <div className="relative mb-5 flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1 text-white/45">
              {t.currentBalance}
            </p>

            <div className="flex items-center justify-center my-0.5">
              <AnimatedBalance
                value={balance}
                currency={currency}
                isMasked={isBalanceHidden}
                className="text-4xl sm:text-5xl font-semibold tracking-tight text-white block max-w-full truncate drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Günlük Sıfırlanan Kâr / Zarar & Yüzde (Arka plansız, çerçevesiz, ikonlu - bakiye gizlendiğinde görünmez olur ama yükseklik korunur) */}
            <div className={`flex items-center justify-center mt-1 h-5 transition-opacity ${
              isBalanceHidden ? "invisible pointer-events-none" : "visible"
            }`}>
              <div
                className={`inline-flex items-center gap-1.5 text-[11.5px] font-mono font-semibold tracking-tight transition-colors ${pnlColorClass}`}
                title={langCode === "tr" ? "Günlük sıfırlanan kâr / zarar" : "Daily reset profit / loss"}
              >
                {isProfit ? (
                  <TrendingUp size={13} className="shrink-0 text-emerald-400" />
                ) : isLoss ? (
                  <TrendingDown size={13} className="shrink-0 text-rose-400" />
                ) : (
                  <Minus size={12} className="shrink-0 text-neutral-400" />
                )}
                <span>{formattedPnl}</span>
                <span className="opacity-80">({formattedPercent})</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="text-[10.5px] font-mono font-medium text-white/35">
                ≈ {sym}{balance.toLocaleString(isTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.07] text-white/70 border border-white/10">
                {isReal ? "Çekilebilir" : "Demo Modu"}
              </span>
            </div>

            {!isReal && (
              <p className="text-[11px] mt-2 text-white/35 font-medium">
                {t.depositForReal}
              </p>
            )}
          </div>

          {/* Centered Mini Stats Glass Pill */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center gap-6 py-2.5 px-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md max-w-xs mx-auto">
              <div className="text-center">
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/40 mb-0.5">{t.deposited}</p>
                <p className="text-xs font-black font-mono text-white/80 tabular-nums">{sym}{totalDeposited.toFixed(2)}</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/40 mb-0.5">{t.withdrawn}</p>
                <p className="text-xs font-black font-mono text-white/80 tabular-nums">{sym}{totalWithdrawn.toFixed(2)}</p>
              </div>
              {pendingReqs.length > 0 && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-amber-400/80 mb-0.5">{t.pending}</p>
                    <p className="text-xs font-black font-mono text-amber-400 tabular-nums">{pendingReqs.length}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTA Buttons - Completely Circular Buttons with Labels Underneath */}
          <div className="relative grid grid-cols-3 gap-2 sm:gap-4 max-w-xs mx-auto">
            {/* Yatır (Deposit) */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => openWallet("deposit")}
                className="h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center border border-white/15 hover:border-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-all cursor-pointer group"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)",
                }}
                title={t.depositBtn}
              >
                <ArrowDownLeft size={20} strokeWidth={2.2} className="text-neutral-400 group-hover:text-neutral-200 transition-all group-hover:scale-110" />
              </motion.button>
              <span className="text-[11px] sm:text-xs font-semibold tracking-tight text-white/80 select-none">
                {t.depositBtn}
              </span>
            </div>

            {/* Çek (Withdraw) */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => openWallet("withdraw")}
                className="h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center border border-white/15 hover:border-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-all cursor-pointer group"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)",
                }}
                title={t.withdrawBtn}
              >
                <ArrowUpRight size={20} strokeWidth={2.2} className="text-neutral-400 group-hover:text-neutral-200 transition-all group-hover:scale-110" />
              </motion.button>
              <span className="text-[11px] sm:text-xs font-semibold tracking-tight text-white/80 select-none">
                {t.withdrawBtn}
              </span>
            </div>

            {/* İşlemler (Transactions) */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/wallet?tab=pending")}
                className="h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center border border-white/15 hover:border-white/30 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-all cursor-pointer group"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)",
                }}
                title="İşlemler"
              >
                <Clock size={20} strokeWidth={2.2} className="text-neutral-400 group-hover:text-neutral-200 transition-all group-hover:scale-110" />
              </motion.button>
              <span className="text-[11px] sm:text-xs font-semibold tracking-tight text-white/80 select-none">
                İşlemler
              </span>
            </div>
          </div>
        </div>

        {/* ── Section Label & Segment Switcher ─────────────────────────── */}
        <div className="px-5 mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Transfer Kanalları</p>
            <p className="text-sm font-black text-white tracking-tight">{t.depositMethods}</p>
          </div>

          {/* Crypto Segment - Separate Rounded Buttons */}
          <div className="flex items-center gap-2">
            {(["deposit", "withdraw"] as const).map(tab => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer select-none border ${
                    isSelected
                      ? "bg-white/20 text-white border-white/30 shadow-[0_2px_12px_rgba(255,255,255,0.12)]"
                      : "bg-white/[0.05] text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab === "deposit" ? t.depositBtn : t.withdrawBtn}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Methods List (Crypto Asset / Token Style) ────────────────── */}
        <div className="mx-4 mb-5 space-y-2.5">
          {methods.map((m, i) => (
            <MethodRow
              key={m.label}
              icon={m.icon as React.ElementType}
              label={m.label}
              sub={m.sub}
              color={m.color}
              badge={m.badge as string | null}
              isLast={i === methods.length - 1}
              onClick={() => openWallet(activeTab)}
            />
          ))}
        </div>

        {/* ── Pending Banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {pendingReqs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-5 overflow-hidden rounded-3xl border border-amber-500/25 backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(18,14,8,0.9) 100%)",
                boxShadow: "0 8px 32px rgba(245,158,11,0.08)",
              }}
            >
              <div
                className="flex items-center gap-2.5 px-4 py-3 border-b border-amber-500/15"
              >
                <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-neutral-500" />
                </div>
                <span className="text-xs font-black text-amber-300">
                  {pendingReqs.length} {t.pendingTransactions}
                </span>
              </div>
              {pendingReqs.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-xs font-bold text-white">
                      {r.type === "deposit" ? t.depositTx : t.withdrawTx}
                    </span>
                    <p className="text-[9.5px] font-mono mt-0.5 text-white/30">
                      #{r.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-amber-400 font-mono">{sym}{r.amount}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rejected Transactions Banner with Reasons ───────────────── */}
        <AnimatePresence>
          {unviewedRejectedReqs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-5 overflow-hidden rounded-3xl cursor-pointer border border-rose-500/30 backdrop-blur-xl hover:border-rose-500/50 transition-colors"
              style={{
                background: "linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(20,10,12,0.9) 100%)",
                boxShadow: "0 8px 32px rgba(244,63,94,0.08)",
              }}
              onClick={() => navigate("/wallet?tab=pending")}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-rose-500/15"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0">
                    <X size={16} className="text-rose-500" />
                  </div>
                  <span className="text-xs font-black text-rose-300">
                    {unviewedRejectedReqs.length === 1 ? t.requestRejectedTitle : `${unviewedRejectedReqs.length} ${t.requestRejectedTitle}`}
                  </span>
                </div>
                <span className="text-[10px] text-white/60 font-bold flex items-center gap-1">
                  {t.review} →
                </span>
              </div>
              {unviewedRejectedReqs.slice(0, 3).map(r => (
                <div key={r.id} className="px-4 py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {r.type === "deposit" ? t.depositTx : t.withdrawTx} ({sym}{r.amount})
                    </span>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">{t.statusRejected}</span>
                  </div>
                  {r.rejectionReason && (
                    <p className="text-xs text-white/80 mt-1 pl-2 border-l-2 border-rose-500/50 leading-relaxed font-medium">
                      {r.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats grid (Crypto Portfolio Metrics) ───────────────────── */}
        <div className="flex items-center gap-3 px-5 mt-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0 text-white/35">
            {t.accountSummary}
          </p>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-2 gap-3 px-4">
          {[
            {
              icon: DepIcon,  label: t.totalDepositedLabel,
              value: `${sym}${totalDeposited.toFixed(2)}`,
              sub: `${approvedDep.length} ${t.approvedCount}`,
              color: "#10b981",
              grad: "rgba(16,185,129,0.08)",
            },
            {
              icon: WithIcon, label: t.totalWithdrawnLabel,
              value: `${sym}${totalWithdrawn.toFixed(2)}`,
              sub: `${approvedWit.length} ${t.approvedCount}`,
              color: "#60a5fa",
              grad: "rgba(96,165,250,0.08)",
            },
            {
              icon: Hourglass, label: t.pendingDepositLabel,
              value: pendingDep.length > 0 ? `${pendingDep.length} ${t.txCount}` : "—",
              sub: t.pendingApproval,
              color: "#fbbf24",
              grad: "rgba(251,191,36,0.08)",
            },
            {
              icon: TrendingUp, label: t.netStatusLabel,
              value: `${sym}${(totalDeposited - totalWithdrawn).toFixed(2)}`,
              sub: t.netSubText,
              color: (totalDeposited - totalWithdrawn) >= 0 ? "#10b981" : "#f43f5e",
              grad: (totalDeposited - totalWithdrawn) >= 0 ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.04 }}
                className="rounded-2xl p-4 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${s.grad} 0%, rgba(10,12,16,0.8) 100%)`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center"
                    style={{ background: `${s.color}20` }}
                  >
                    <Icon size={12} style={{ color: s.color }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">{s.label}</span>
                </div>
                <p className="text-base sm:text-xl font-black font-mono tabular-nums leading-none truncate max-w-full" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] mt-1.5 text-white/35 font-medium">{s.sub}</p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </>
  );
}
