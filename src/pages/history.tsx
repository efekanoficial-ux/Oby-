import { useDemoAccount, type CompletedTrade, livePriceRegistry } from "@/context/DemoAccountContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, Clock, BarChart2, Zap, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { AssetIcon } from "@/lib/asset-icons";
import { motion, AnimatePresence } from "framer-motion";

function getLiveProfit(trade: any, isReal: boolean) {
  const startPrice = isReal ? trade.entryPrice : trade.startPrice;
  const currentPrice = livePriceRegistry[trade.asset] ?? startPrice;
  const isUp = trade.direction === "UP";
  const isWin = isUp ? currentPrice >= startPrice : currentPrice <= startPrice;
  // If trade just started or price is same, profit is 0
  if (Math.abs(currentPrice - startPrice) < 0.000001) return 0;
  return isWin ? (trade.amount * 0.85) : -trade.amount;
}

type Filter = "ALL" | "WIN" | "LOSE";

function fmt(ts: number, langCode: string) {
  const locale = langCode === "tr" ? "tr-TR" : "en-US";
  return new Date(ts).toLocaleDateString(locale, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function reltime(ts: number, langCode: string) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  const isTr = langCode === "tr";
  if (diff < 60)   return `${diff}${isTr ? "s önce" : "s ago"}`;
  if (diff < 3600) return `${Math.floor(diff / 60)}${isTr ? "dk önce" : "m ago"}`;
  return `${Math.floor(diff / 3600)}${isTr ? "sa önce" : "h ago"}`;
}

function fmtCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

interface RealActiveTrade {
  id: string; asset: string; direction: "UP" | "DOWN";
  amount: number; entryPrice: number; entryTime: number; expiryTime: number;
}

/* ── Asset Flag Icon Helper ────────────────────────────────────────────── */
function renderAssetIcon(assetLabel: string) {
  return (
    <div className="shrink-0 flex items-center justify-center">
      <AssetIcon label={assetLabel} size={28} />
    </div>
  );
}

export default function History() {
  const { completedTrades, activeTrades, tradesLoading } = useDemoAccount();
  const { isReal } = useAccountMode();
  const { currentUser } = useAuth();
  const { t, langCode } = useLanguage();
  const currency = (currentUser as any)?.currency ?? "USD";
  const sym = currency === "TL" ? "₺" : "$";

  const [filter, setFilter] = useState<Filter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [realActiveTrades, setRealActiveTrades] = useState<RealActiveTrade[]>([]);
  const [now, setNow] = useState(Date.now());

  const viewIsReal = isReal;
  const accent = viewIsReal ? "#10b981" : "#f59e0b";

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) { setRealActiveTrades([]); return; }
    const q = query(collection(db, "realActiveTrades"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, snap => {
      setRealActiveTrades(snap.docs.map(d => d.data() as RealActiveTrade));
    }, (err) => {
      if (err.code !== "permission-denied") console.error(err);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const modeTrades = viewIsReal
    ? completedTrades.filter(tr => tr.mode === "real")
    : completedTrades.filter(tr => !tr.mode || tr.mode === "demo");

  const filtered = modeTrades.filter(tr =>
    filter === "ALL" ? true : tr.result === filter
  );

  const totalWin  = modeTrades.filter(tr => tr.result === "WIN").length;
  const totalLose = modeTrades.filter(tr => tr.result === "LOSE").length;
  const total     = totalWin + totalLose;

  const visibleDemoActive = activeTrades.filter(tr => tr.startTime + tr.duration * 1000 > now - 800);
  const visibleRealActive = realActiveTrades.filter(tr => tr.expiryTime > now - 800);
  const visibleActive     = viewIsReal ? visibleRealActive : visibleDemoActive;

  const totalNet = modeTrades.reduce((acc, tr) => {
    return tr.result === "WIN" ? acc + tr.profit : acc - tr.amount;
  }, 0);
  const winRate = total > 0 ? Math.round((totalWin / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-black text-white" style={{ backgroundColor: "#000000" }}>

      {/* ── Active Trades Section ──────────────────────────────────────── */}
      {visibleActive.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
            {viewIsReal ? t.activeRealTrades : t.activeDemoTrades} ({visibleActive.length})
          </p>
          <div className="flex flex-row gap-2 overflow-x-auto snap-x snap-mandatory w-full no-scrollbar">
            {visibleActive.map(tr => {
              const isUp   = tr.direction === "UP";
              const expiry = viewIsReal
                ? (tr as RealActiveTrade).expiryTime
                : (tr as typeof activeTrades[number]).startTime + (tr as typeof activeTrades[number]).duration * 1000;
              const rem  = Math.max(0, expiry - now);
              const totalTime = viewIsReal
                ? ((tr as RealActiveTrade).expiryTime - (tr as RealActiveTrade).entryTime)
                : ((tr as typeof activeTrades[number]).duration * 1000);
              const prog   = Math.max(0, Math.min(1, rem / totalTime));

              return (
                <div
                  key={tr.id}
                  className="rounded-2xl p-3 flex items-center justify-between relative overflow-hidden shrink-0 min-w-full snap-start border border-white/[0.07] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  style={{
                    background: "linear-gradient(135deg, #101114 0%, #0c0d10 50%, rgba(255, 107, 0, 0.05) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      {renderAssetIcon(tr.asset)}
                      <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full flex items-center justify-center border border-black bg-[#2d3038] text-gray-200 text-[8px] font-black shadow-sm">
                        {isUp ? "▲" : "▼"}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white leading-none">{tr.asset}</p>
                      </div>
                      <p className="text-[10px] text-white/50 mt-1 font-medium">
                        {sym}{tr.amount} · <span className="font-mono text-amber-300 font-bold">{fmtCountdown(rem)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {(() => {
                        const profit = getLiveProfit(tr, viewIsReal);
                        return profit <= 0 ? (
                          <p className="text-xs font-mono font-bold text-white/40">{sym}0.00</p>
                        ) : (
                          <p className="text-xs font-mono font-bold text-emerald-400">
                            +{sym}{(tr.amount + profit).toFixed(2)}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                    <div
                      className="h-full bg-amber-400 transition-all duration-1000"
                      style={{ width: `${prog * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Tabs ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center px-4 pt-3 pb-2">
        <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-full max-w-xs">
          {(["ALL", "WIN", "LOSE"] as Filter[]).map(f => {
            const isActive = filter === f;
            const label = f === "ALL" ? t.all : f === "WIN" ? t.winners : t.losers;
            const count = f === "WIN" ? totalWin : f === "LOSE" ? totalLose : total;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/40"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Trade List ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-24 space-y-2">

        {tradesLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin mb-3 h-7 w-7 rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-xs text-white/40">İşlem geçmişi yükleniyor...</p>
          </div>
        )}

        {!tradesLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3 bg-white/[0.04] border border-white/[0.08]">
              <BarChart2 size={22} className="text-white/30" />
            </div>
            <p className="text-sm font-bold text-white/80">{t.noHistoryTitle}</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs leading-relaxed">
              {viewIsReal ? t.noHistoryRealDesc : t.noHistoryDemoDesc}
            </p>
            <Link href="/">
              <button className="mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-black bg-[#FF6B00] hover:bg-[#FF8533] transition-colors cursor-pointer">
                <TrendingUp size={13} className="text-black" />
                <span>{t.tradeNow}</span>
              </button>
            </Link>
          </div>
        )}

        {!tradesLoading && filtered.map((trade: CompletedTrade) => {
          const isUp   = trade.direction === "UP";
          const isWin  = trade.result === "WIN";
          const isExpanded  = expandedId === trade.id;

          return (
            <div
              key={trade.id}
              className="rounded-2xl border border-white/[0.07] hover:border-white/15 overflow-hidden transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              style={{
                background: "linear-gradient(135deg, #0f1013 0%, #0a0b0d 50%, rgba(255, 107, 0, 0.04) 100%)",
              }}
            >
              {/* TRADE CARD MAIN ROW */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className="px-4 py-3 cursor-pointer flex items-center justify-between select-none"
              >
                {/* Left: Asset Icon + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {renderAssetIcon(trade.asset)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate leading-none">{trade.asset}</span>
                      <span className="text-[10px] font-bold leading-none text-white/40">
                        {isUp ? "▲" : "▼"}
                      </span>
                    </div>

                    <p className="text-[10px] text-white/40 mt-1 font-mono truncate">
                      {reltime(trade.closedAt, langCode)} · {fmt(trade.closedAt, langCode)}
                    </p>
                  </div>
                </div>

                {/* Right: Outcome badge + Profit */}
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${
                      isWin ? "bg-white/10 text-white" : "bg-white/5 text-white/50"
                    }`}>
                      {isWin ? t.won : t.lost}
                    </span>
                    <p className={`text-xs font-bold leading-tight mt-0.5 font-mono ${
                      isWin ? "text-emerald-400" : "text-white/50"
                    }`}>
                      {isWin ? `+${sym}${trade.profit.toFixed(2)}` : `-${sym}${trade.amount.toFixed(2)}`}
                    </p>
                  </div>

                  <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* SMOOTH ACCORDION DETAILS */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-white/[0.06] bg-black/40"
                  >
                    <div className="py-2.5 px-4 grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-white/40 block text-[9px] mb-0.5">{t.entryPrice}</span>
                        <span className="font-mono text-white/80">{trade.entryPrice ? trade.entryPrice.toFixed(5) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[9px] mb-0.5">{t.exitPrice}</span>
                        <span className="font-mono text-white/80">{trade.exitPrice ? trade.exitPrice.toFixed(5) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[9px] mb-0.5">{t.closeTime}</span>
                        <span className="font-mono text-white/80">{fmt(trade.closedAt, langCode)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
