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

  return (
    <div className="flex h-full flex-col bg-[#08080a] text-white">

      {/* ── Active Trades Section ──────────────────────────────────────── */}
      {visibleActive.length > 0 && (
        <div className="shrink-0 px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white/60">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: accent }} />
              {viewIsReal ? t.activeRealTrades : t.activeDemoTrades} ({visibleActive.length})
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
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
              const dirAccent = isUp ? "#10b981" : "#ef4444";

              return (
                <div key={tr.id} className="rounded-2xl px-4 py-3.5 bg-[#121217] border border-white/[0.06] flex items-center justify-between relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
                      {isUp ? <ArrowUp size={16} style={{ color: dirAccent }} strokeWidth={2.5} /> : <ArrowDown size={16} style={{ color: dirAccent }} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/90 leading-none">{tr.asset}</p>
                      <p className="text-[10px] text-white/40 mt-1 font-medium">
                        {isUp ? t.upBtn : t.downBtn} · {sym}{tr.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-white/90 font-mono font-bold text-xs">
                        <Clock size={11} className="text-white/40" />
                        <span>{fmtCountdown(rem)}</span>
                      </div>
                      <span className="text-[9px] text-white/35 font-mono block mt-0.5">
                        {fmtTime(expiry)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
                    <div className="h-full transition-all duration-1000" style={{ width: `${prog * 100}%`, background: dirAccent }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter Pills ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {(["ALL", "WIN", "LOSE"] as Filter[]).map(f => {
            const isActive = filter === f;
            const label = f === "ALL" ? t.all : f === "WIN" ? t.winners : t.losers;
            const count = f === "WIN" ? totalWin : f === "LOSE" ? totalLose : total;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#22222b] text-white border border-white/15 shadow-sm"
                    : "bg-[#111115] text-white/50 hover:text-white/80 border border-white/[0.04]"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-medium ${
                  isActive ? "bg-white/10 text-white" : "bg-white/[0.03] text-white/40"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
          {filtered.length} {t.tradesRecords}
        </span>
      </div>

      {/* ── Trade List (Soft Cards) ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-24 space-y-2">

        {tradesLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin mb-3 h-8 w-8 rounded-full border-2 border-white/10 border-t-white/40" />
            <p className="text-xs font-medium text-white/40">Yükleniyor...</p>
          </div>
        )}

        {!tradesLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center my-4 rounded-3xl border border-white/[0.05] bg-[#111116] p-6">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3 bg-white/[0.03] border border-white/[0.06]">
              <BarChart2 size={22} className="text-white/40" />
            </div>
            <p className="text-sm font-semibold text-white/80">{t.noHistoryTitle}</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs leading-relaxed">
              {viewIsReal ? t.noHistoryRealDesc : t.noHistoryDemoDesc}
            </p>
            <Link href="/">
              <button
                className="mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white bg-[#22222b] border border-white/10 shadow-sm transition-all hover:bg-[#2a2a35] active:scale-95"
              >
                <TrendingUp size={14} className="text-emerald-400" />
                <span>{t.tradeNow}</span>
              </button>
            </Link>
          </div>
        )}

        {!tradesLoading && filtered.map((trade: CompletedTrade) => {
          const isUp   = trade.direction === "UP";
          const isWin  = trade.result === "WIN";
          const tradeAccent = isWin ? "#34d399" : "#f87171";
          const isExpanded  = expandedId === trade.id;

          return (
            <div key={trade.id} className="flex flex-col">
              {/* TRADE CARD (SOUTHEAST / CALM NEUTRAL) */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className={`px-4 py-3.5 bg-[#111115] border border-white/[0.05] transition-all cursor-pointer flex items-center justify-between hover:bg-[#16161b] active:scale-[0.995] ${
                  isExpanded ? "rounded-t-2xl border-b-0 bg-[#141419]" : "rounded-2xl"
                }`}
              >
                {/* Left: Asset Icon + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {renderAssetIcon(trade.asset)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/90 truncate leading-none">{trade.asset}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold leading-none shrink-0 ${
                        isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {isUp ? t.upBtn : t.downBtn}
                      </span>
                    </div>

                    <p className="text-[10px] text-white/40 mt-1 font-mono font-normal truncate">
                      {reltime(trade.closedAt, langCode)} · {fmt(trade.closedAt, langCode)}
                    </p>
                  </div>
                </div>

                {/* Right: Outcome badge + Profit */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                        isWin ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {isWin ? t.won : t.lost}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-tight mt-1 font-mono" style={{ color: tradeAccent }}>
                      {isWin ? `+${sym}${trade.profit.toFixed(2)}` : `-${sym}${trade.amount.toFixed(2)}`}
                    </p>
                  </div>

                  <ChevronDown size={14} className={`text-white/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* EXPANDED DETAILS ACCORDION */}
              {isExpanded && (
                <div className="bg-[#141419] border border-t-0 border-white/[0.05] rounded-b-2xl pt-2 pb-3.5 px-4 grid grid-cols-3 gap-2.5 text-[10px] text-white/60">
                  <div className="rounded-xl bg-[#1c1c24] border border-white/[0.04] p-2.5">
                    <span className="text-white/40 block text-[9px] mb-1 font-medium">{t.entryPrice}</span>
                    <span className="font-mono font-semibold text-white/90 text-xs">{trade.entryPrice ? trade.entryPrice.toFixed(5) : "—"}</span>
                  </div>
                  <div className="rounded-xl bg-[#1c1c24] border border-white/[0.04] p-2.5">
                    <span className="text-white/40 block text-[9px] mb-1 font-medium">{t.exitPrice}</span>
                    <span className="font-mono font-semibold text-white/90 text-xs">{trade.exitPrice ? trade.exitPrice.toFixed(5) : "—"}</span>
                  </div>
                  <div className="rounded-xl bg-[#1c1c24] border border-white/[0.04] p-2.5">
                    <span className="text-white/40 block text-[9px] mb-1 font-medium">{t.closeTime}</span>
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
