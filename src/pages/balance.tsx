import { useState } from "react";
import { useLocation } from "wouter";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { AnimatedBalance } from "@/components/animated-balance";
import {
  Globe, Building2, Bitcoin, Banknote, CreditCard,
  ArrowDownLeft, ArrowUpRight,
  Clock, ArrowDownLeft as DepIcon, ArrowUpRight as WithIcon,
  Hourglass, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── payment methods ─────────────────────────────────────────────────────── */
const DEPOSIT_METHODS = [
  { icon: Globe,     label: "USDT TRC-20",   sub: "Anında onay",      color: "#26A17B", badge: "HIZLI" },
  { icon: Building2, label: "IBAN / Havale",  sub: "1-24 saat",        color: "#4C8DFF", badge: null   },
  { icon: Bitcoin,   label: "Kripto",         sub: "BTC · ETH · BNB",  color: "#F7931A", badge: null   },
] as const;

const WITHDRAW_METHODS = [
  { icon: Banknote,    label: "Banka Transferi", sub: "1-3 iş günü", color: "#0ecb81", badge: null    },
  { icon: Globe,       label: "USDT TRC-20",     sub: "Anında",      color: "#26A17B", badge: "HIZLI" },
  { icon: CreditCard,  label: "Kripto Cüzdan",   sub: "BTC · ETH",   color: "#F7931A", badge: null    },
] as const;

/* ── Method row ─────────────────────────────────────────────────────────── */
function MethodRow({
  icon: Icon, label, sub, color, badge, isLast, onClick,
}: {
  icon: React.ElementType; label: string; sub: string; color: string;
  badge: string | null; isLast: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      style={!isLast ? { borderBottom: "1px solid #131313" } : {}}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `${color}15`, border: `1px solid ${color}28` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black text-white">{label}</span>
          {badge && (
            <span className="rounded-full px-1.5 py-px text-[8px] font-black"
              style={{ background: `${color}25`, color }}>{badge}</span>
          )}
        </div>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>{sub}</span>
      </div>
      <div className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.05)" }}>
        <ArrowUpRight size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
    </motion.button>
  );
}

/* ── main page ─────────────────────────────────────────────────────────── */
export default function Balance() {
  const [, navigate] = useLocation();
  const { currentUser, requests } = useAuth();
  const { balance: demoBalance }  = useDemoAccount();
  const { isReal }                = useAccountMode();
  const currency = (currentUser as any)?.currency ?? "USD";
  const sym = currency === "TL" ? "₺" : "$";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const allReqs     = currentUser ? requests.filter(r => r.userId === currentUser.id) : [];
  const pendingReqs = allReqs.filter(r => r.status === "pending");
  const approvedDep = allReqs.filter(r => r.type === "deposit"  && r.status === "accepted");
  const approvedWit = allReqs.filter(r => r.type === "withdraw" && r.status === "accepted");
  const pendingDep  = allReqs.filter(r => r.type === "deposit"  && r.status === "pending");

  const totalDeposited = currentUser?.totalDeposited ?? 0;
  const totalWithdrawn = currentUser?.totalWithdrawn ?? 0;
  const realBalance    = currentUser?.realBalance    ?? 0;

  const accent    = isReal ? "#0ecb81" : "#FF6B00";
  const accentMid = isReal ? "#06a860" : "#FFB800";
  const balance   = isReal ? realBalance : demoBalance;
  const methods   = activeTab === "deposit" ? DEPOSIT_METHODS : WITHDRAW_METHODS;

  const openWallet = (tab: "deposit" | "withdraw") => {
    navigate(`/wallet?tab=${tab}`);
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto pb-28" style={{ background: "#000" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.3)" }}>Obyo Option</p>
            <p className="text-lg font-black text-white mt-0.5">Bakiye</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: `${accent}12`, border: `1px solid ${accent}28` }}>
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: accent }}>
              {isReal ? "GERÇEK" : "DEMO"}
            </span>
          </div>
        </div>

        {/* ── Balance Card ─────────────────────────────────────────────── */}
        <motion.div
          key={isReal ? "real" : "demo"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-4 mb-5 rounded-3xl p-6 relative"
          style={{
            background: isReal
              ? "linear-gradient(135deg,#0b2a1e 0%,#0d1a12 55%,#081510 100%)"
              : "linear-gradient(135deg,#2a1500 0%,#1a0e00 55%,#120a00 100%)",
            border: `1px solid ${isReal ? "rgba(14,203,129,0.18)" : "rgba(255,107,0,0.18)"}`,
            boxShadow: `0 20px 60px ${isReal ? "rgba(14,203,129,0.1)" : "rgba(255,107,0,0.1)"}`,
          }}
        >
          {/* ambient glow — clipped inside own wrapper */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full"
              style={{ background: `radial-gradient(circle, ${isReal ? "rgba(14,203,129,0.14)" : "rgba(255,107,0,0.14)"}, transparent 70%)` }} />
          </div>

          {/* chip decoration */}
          <div className="relative flex items-center justify-between mb-7">
            <div className="flex gap-0.5">
              {([
                isReal ? "rgba(14,203,129,0.22)" : "rgba(255,107,0,0.22)",
                isReal ? "rgba(14,203,129,0.14)" : "rgba(255,107,0,0.14)",
                isReal ? "rgba(14,203,129,0.08)" : "rgba(255,107,0,0.08)",
              ]).map((bg, i) => (
                <div key={i} className="h-4 w-4 rounded-sm"
                  style={{ background: bg, border: `1px solid ${isReal ? "rgba(14,203,129,0.12)" : "rgba(255,107,0,0.12)"}` }} />
              ))}
            </div>
            <span className="text-[9px] font-black tracking-[0.28em] uppercase"
              style={{ color: isReal ? "rgba(14,203,129,0.45)" : "rgba(255,107,0,0.45)" }}>
              {isReal ? "REAL ACC" : "DEMO ACC"}
            </span>
          </div>

          {/* balance */}
          <div className="relative mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: isReal ? "rgba(14,203,129,0.45)" : "rgba(255,107,0,0.45)" }}>
              Mevcut Bakiye
            </p>
            <div className="flex items-end gap-0.5">
              <AnimatedBalance
                value={balance}
                currency={currency}
                className="text-5xl font-black leading-none tracking-tight"
                style={{ color: isReal ? "#0ecb81" : "#FF6B00" }}
              />
            </div>
            {!isReal && (
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                Gerçek hesap için para yatır
              </p>
            )}
          </div>

          {/* mini stats row */}
          <div className="relative flex gap-5 mb-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}>Yatırılan</p>
              <p className="text-sm font-black tabular-nums"
                style={{ color: "rgba(255,255,255,0.5)" }}>{sym}{totalDeposited.toFixed(2)}</p>
            </div>
            <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}>Çekilen</p>
              <p className="text-sm font-black tabular-nums"
                style={{ color: "rgba(255,255,255,0.5)" }}>{sym}{totalWithdrawn.toFixed(2)}</p>
            </div>
            {pendingReqs.length > 0 && (
              <>
                <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: "rgba(255,255,255,0.2)" }}>Bekleyen</p>
                  <p className="text-sm font-black tabular-nums" style={{ color: "#FFB800" }}>
                    {pendingReqs.length}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* CTA buttons */}
          <div className="relative grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => openWallet("deposit")}
              className="flex flex-col items-center gap-2 rounded-2xl py-4"
              style={{
                background: isReal ? "rgba(14,203,129,0.12)" : "rgba(255,107,0,0.12)",
                border: `1px solid ${isReal ? "rgba(14,203,129,0.22)" : "rgba(255,107,0,0.22)"}`,
              }}>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
                style={{ background: isReal ? "rgba(14,203,129,0.18)" : "rgba(255,107,0,0.18)" }}>
                <ArrowDownLeft size={17} strokeWidth={2.5} style={{ color: isReal ? "#0ecb81" : "#FF6B00" }} />
              </div>
              <span className="text-xs font-black" style={{ color: isReal ? "#0ecb81" : "#FF6B00" }}>Para Yatır</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => openWallet("withdraw")}
              className="flex flex-col items-center gap-2 rounded-2xl py-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <ArrowUpRight size={17} strokeWidth={2.5} style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>
              <span className="text-xs font-black" style={{ color: "rgba(255,255,255,0.35)" }}>Para Çek</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Section label ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
            style={{ color: "rgba(255,255,255,0.22)" }}>Yatırım Yöntemleri</p>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>

        {/* ── Tab selector ─────────────────────────────────────────────── */}
        <div className="flex gap-2 px-4 mb-3">
          {(["deposit", "withdraw"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-xs font-black transition-all"
              style={activeTab === tab
                ? { background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }
                : { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
              {tab === "deposit" ? "Para Yatır" : "Para Çek"}
            </button>
          ))}
        </div>

        {/* ── Methods list ─────────────────────────────────────────────── */}
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden"
          style={{ background: "#0a0a0a", border: "1px solid #181818" }}>
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

        {/* ── Pending banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {pendingReqs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-5 overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.18)" }}
            >
              <div className="flex items-center gap-2.5 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,184,0,0.1)" }}>
                <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,184,0,0.12)" }}>
                  <Clock size={12} style={{ color: "#FFB800" }} />
                </div>
                <span className="text-xs font-black text-[#FFB800]">
                  {pendingReqs.length} Bekleyen İşlem
                </span>
              </div>
              {pendingReqs.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-xs font-bold text-white">
                      {r.type === "deposit" ? "Para Yatırma" : "Para Çekme"}
                    </span>
                    <p className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                      #{r.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#FFB800]">{sym}{r.amount}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 mt-5 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
            style={{ color: "rgba(255,255,255,0.22)" }}>Hesap Özeti</p>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div className="grid grid-cols-2 gap-3 px-4">
          {[
            {
              icon: DepIcon,  label: "Toplam Yatırılan",
              value: `$${totalDeposited.toFixed(2)}`,
              sub: `${approvedDep.length} onaylı`,
              color: "#0ecb81",
            },
            {
              icon: WithIcon, label: "Toplam Çekilen",
              value: `$${totalWithdrawn.toFixed(2)}`,
              sub: `${approvedWit.length} onaylı`,
              color: "#4C8DFF",
            },
            {
              icon: Hourglass, label: "Bekleyen Yatırım",
              value: pendingDep.length > 0 ? `${pendingDep.length} işlem` : "—",
              sub: "onay bekleniyor",
              color: "#FFB800",
            },
            {
              icon: TrendingUp, label: "Net Durum",
              value: `$${(totalDeposited - totalWithdrawn).toFixed(2)}`,
              sub: "yatırılan − çekilen",
              color: (totalDeposited - totalWithdrawn) >= 0 ? "#0ecb81" : "#f6465d",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.04 }}
                className="rounded-2xl p-4"
                style={{ background: "#0a0a0a", border: "1px solid #181818" }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Icon size={11} style={{ color: s.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.22)" }}>{s.label}</span>
                </div>
                <p className="text-xl font-black tabular-nums leading-none" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.18)" }}>{s.sub}</p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </>
  );
}
