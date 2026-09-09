import { useDemoAccount, type CompletedTrade } from "@/context/DemoAccountContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, Clock, BarChart2, Zap, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { AssetIcon } from "@/lib/asset-icons";

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
    <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
      <AssetIcon label={assetLabel} size={24} />
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
  const accent = viewIsReal ? "#0ecb81" : "#FF6B00";

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

  return (
    <div className="flex h-full flex-col bg-black text-white">

      {/* ── Active Trades Section ──────────────────────────────────────── */}
      {visibleActive.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: accent }}>
              <span className="h-2 w-2 rounded-full animate-ping" style={{ background: accent }} />
              {viewIsReal ? t.activeRealTrades : t.activeDemoTrades} ({visibleActive.length})
            </p>
          </div>
          <div className="flex flex-col gap-2">
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
              const dirAccent = isUp ? "#0ecb81" : "#f6465d";

              return (
                <div key={tr.id} className="rounded-full px-5 py-3.5 bg-[#0e0e12] border border-white/10 flex items-center justify-between shadow-lg relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: isUp ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)" }}>
                      {isUp ? <ArrowUp size={16} style={{ color: dirAccent }} strokeWidth={3} /> : <ArrowDown size={16} style={{ color: dirAccent }} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-none">{tr.asset}</p>
                      <p className="text-[10px] font-bold text-white/40 mt-1">
                        {isUp ? `▲ ${t.upBtn}` : `▼ ${t.downBtn}`} · {sym}{tr.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-white font-mono font-black text-xs">
                        <Clock size={11} className="text-[#FF6B00]" />
                        <span>{fmtCountdown(rem)}</span>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono block mt-0.5">
                        {fmtTime(expiry)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                    <div className="h-full transition-all duration-1000" style={{ width: `${prog * 100}%`, background: dirAccent }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Pills ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {(["ALL", "WIN", "LOSE"] as Filter[]).map(f => {
            const isActive = filter === f;
            const label = f === "ALL" ? t.all : f === "WIN" ? t.winners : t.losers;
            const count = f === "WIN" ? totalWin : f === "LOSE" ? totalLose : total;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 ${
                  isActive
                    ? f === "ALL"
                      ? "bg-white text-black shadow-md"
                      : f === "WIN"
                      ? "bg-[#0ecb81] text-black shadow-md"
                      : "bg-[#f6465d] text-white shadow-md"
                    : "bg-white/5 text-white/50 hover:text-white border border-white/10"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-black/20 text-current" : "bg-white/10 text-white/40"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
          {filtered.length} {t.tradesRecords}
        </span>
      </div>

      {/* ── Trade List (Oval Cards) ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-24 space-y-2.5">

        {tradesLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin mb-3 h-8 w-8 rounded-full border-2 border-white/10 border-t-[#FF6B00]" />
            <p className="text-xs font-bold text-white/30">...</p>
          </div>
        )}

        {!tradesLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center my-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3 bg-white/5 border border-white/10">
              <BarChart2 size={22} style={{ color: accent }} />
            </div>
            <p className="text-sm font-black text-white/80">{t.noHistoryTitle}</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">
              {viewIsReal ? t.noHistoryRealDesc : t.noHistoryDemoDesc}
            </p>
            <Link href="/">
              <button
                className="mt-4 flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-black text-black shadow-lg transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
              >
                <TrendingUp size={15} />
                <span>{t.tradeNow}</span>
              </button>
            </Link>
          </div>
        )}

        {!tradesLoading && filtered.map((trade: CompletedTrade) => {
          const isUp   = trade.direction === "UP";
          const isWin  = trade.result === "WIN";
          const tradeAccent = isWin ? "#0ecb81" : "#f6465d";
          const isExpanded  = expandedId === trade.id;

          return (
            <div key={trade.id} className="flex flex-col">
              {/* TRADE CARD (BORDERLESS & CLEAN) */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className={`px-4 py-3 bg-[#0d0d11] transition-all cursor-pointer flex items-center justify-between hover:bg-[#131318] active:scale-[0.99] ${
                  isExpanded ? "rounded-t-2xl bg-[#111116]" : "rounded-2xl"
                }`}
                style={{ boxShadow: "0 4px 18px rgba(0,0,0,0.25)" }}
              >
                {/* Left: Asset Icon + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {renderAssetIcon(trade.asset)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white truncate leading-none">{trade.asset}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black leading-none shrink-0 ${
                        isUp ? "bg-[#0ecb81]/15 text-[#0ecb81]" : "bg-[#f6465d]/15 text-[#f6465d]"
                      }`}>
                        {isUp ? `▲ ${t.upBtn}` : `▼ ${t.downBtn}`}
                      </span>
                    </div>

                    <p className="text-[10px] text-white/35 mt-1 font-mono font-medium truncate">
                      {reltime(trade.closedAt, langCode)} · {fmt(trade.closedAt, langCode)}
                    </p>
                  </div>
                </div>

                {/* Right: Outcome badge + Profit */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        isWin ? "bg-[#0ecb81]/20 text-[#0ecb81]" : "bg-[#f6465d]/20 text-[#f6465d]"
                      }`}>
                        {isWin ? t.won : t.lost}
                      </span>
                    </div>
                    <p className="text-sm font-black leading-tight mt-0.5 font-mono" style={{ color: tradeAccent }}>
                      {isWin ? `+${sym}${trade.profit.toFixed(2)}` : `-${sym}${trade.amount.toFixed(2)}`}
                    </p>
                  </div>

                  <ChevronDown size={14} className={`text-white/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* EXPANDED DETAILS ACCORDION (NATURALLY UNDERNEATH) */}
              {isExpanded && (
                <div className="bg-[#111116] rounded-b-2xl pt-2 pb-3.5 px-4 grid grid-cols-3 gap-2 text-[10px] text-white/60">
                  <div className="rounded-xl bg-white/[0.03] p-2.5">
                    <span className="text-white/30 block text-[9px] mb-1 uppercase font-bold">{t.entryPrice}</span>
                    <span className="font-mono font-bold text-white text-xs">{trade.entryPrice ? trade.entryPrice.toFixed(5) : "—"}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2.5">
                    <span className="text-white/30 block text-[9px] mb-1 uppercase font-bold">{t.exitPrice}</span>
                    <span className="font-mono font-bold text-white text-xs">{trade.exitPrice ? trade.exitPrice.toFixed(5) : "—"}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2.5">
                    <span className="text-white/30 block text-[9px] mb-1 uppercase font-bold">{t.closeTime}</span>
                    <span className="font-mono text-white/80 text-[11px] block mt-0.5">{fmt(trade.closedAt, langCode)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
