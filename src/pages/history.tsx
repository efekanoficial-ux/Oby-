import { useDemoAccount, type CompletedTrade } from "@/context/DemoAccountContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

type Filter = "ALL" | "WIN" | "LOSE";

function fmt(ts: number) {
  return new Date(ts).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function reltime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  return `${Math.floor(diff / 3600)}sa önce`;
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

/* ── Win-rate ring ─────────────────────────────────────────────────────── */
function WinRing({ win, total, accent }: { win: number; total: number; accent: string }) {
  const pct  = total === 0 ? 0 : Math.round((win / total) * 100);
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center" style={{ minWidth: 72 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none"
          stroke={accent}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x={36} y={37} textAnchor="middle" dominantBaseline="middle"
          fill={accent} fontSize={13} fontWeight={900}>
          {pct}%
        </text>
      </svg>
      <p className="text-[9px] text-white/30 font-bold mt-0.5 uppercase tracking-wider">Başarı</p>
    </div>
  );
}

export default function History() {
  const { completedTrades, activeTrades, tradesLoading } = useDemoAccount();
  const { isReal } = useAccountMode();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [realActiveTrades, setRealActiveTrades] = useState<RealActiveTrade[]>([]);
  const [now, setNow] = useState(Date.now());

  /* Accent color — mirrors balance.tsx logic */
  const accent = isReal ? "#0ecb81" : "#FF6B00";

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isReal || !currentUser) { setRealActiveTrades([]); return; }
    const q = query(collection(db, "realActiveTrades"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, snap => {
      setRealActiveTrades(snap.docs.map(d => d.data() as RealActiveTrade));
    });
    return () => unsub();
  }, [isReal, currentUser?.id]);

  const modeTrades = isReal
    ? completedTrades.filter(t => t.mode === "real")
    : completedTrades.filter(t => !t.mode || t.mode === "demo");

  const filtered = modeTrades.filter(t =>
    filter === "ALL" ? true : t.result === filter
  );

  const totalWin  = modeTrades.filter(t => t.result === "WIN").length;
  const totalLose = modeTrades.filter(t => t.result === "LOSE").length;
  const netProfit = modeTrades.reduce((s, t) => s + t.profit, 0);
  const total     = totalWin + totalLose;

  /* Filter expired trades so they don't linger at "0s" */
  const visibleDemoActive = activeTrades.filter(t => t.startTime + t.duration * 1000 > now - 800);
  const visibleRealActive = realActiveTrades.filter(t => t.expiryTime > now - 800);
  const visibleActive     = isReal ? visibleRealActive : visibleDemoActive;

  return (
    <div className="flex h-full flex-col" style={{ background: "#000" }}>

      {/* ── Stats header ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <WinRing win={totalWin} total={total} accent={accent} />
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { label: "Kazanan",  value: totalWin,  color: "#0ecb81", bg: "rgba(14,203,129,0.08)" },
              { label: "Kaybeden", value: totalLose, color: "#f6465d", bg: "rgba(246,70,93,0.08)"  },
              {
                label: "Net Kâr",
                value: (netProfit >= 0 ? "+" : "") + "$" + Math.abs(netProfit).toFixed(2),
                color: netProfit >= 0 ? "#0ecb81" : "#f6465d",
                bg:    netProfit >= 0 ? "rgba(14,203,129,0.08)" : "rgba(246,70,93,0.08)",
              },
              {
                label: "Toplam",
                value: total,
                color: accent,
                bg:    `${accent}14`,
              },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-3 py-2 flex flex-col justify-center"
                style={{ background: s.bg, border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[13px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-white/30 font-bold mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active trades ─────────────────────────────────────────────── */}
      {visibleActive.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <p className="text-[9px] font-black uppercase tracking-widest mb-2"
            style={{ color: `${accent}80` }}>
            {isReal ? "Açık Gerçek İşlemler" : "Açık Demo İşlemler"}
          </p>
          <div className="flex flex-col gap-1.5">
            {visibleActive.map(t => {
              const isUp   = t.direction === "UP";
              const expiry = isReal
                ? (t as RealActiveTrade).expiryTime
                : (t as typeof activeTrades[number]).startTime + (t as typeof activeTrades[number]).duration * 1000;
              const rem  = Math.max(0, expiry - now);
              const total = isReal
                ? ((t as RealActiveTrade).expiryTime - (t as RealActiveTrade).entryTime)
                : ((t as typeof activeTrades[number]).duration * 1000);
              const prog   = Math.max(0, Math.min(1, rem / total));
              const dirAccent = isUp ? "#0ecb81" : "#f6465d";
              const entryPrice = isReal
                ? (t as RealActiveTrade).entryPrice
                : (t as typeof activeTrades[number]).startPrice;
              return (
                <div key={t.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d0d0d", border: `1px solid ${isUp ? "rgba(14,203,129,0.18)" : "rgba(246,70,93,0.18)"}` }}>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isUp ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)" }}>
                        {isUp
                          ? <TrendingUp  size={14} style={{ color: dirAccent }} />
                          : <TrendingDown size={14} style={{ color: dirAccent }} />}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-white leading-none">{t.asset}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">
                          {isUp ? "▲ YUKARI" : "▼ AŞAĞI"} · ${t.amount}
                        </p>
                      </div>
                    </div>
                    {/* Countdown in MM:SS */}
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1 text-white/70">
                        <Clock size={9} />
                        <span className="text-[11px] font-black font-mono">{fmtCountdown(rem)}</span>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">
                        Vade {fmtTime(expiry)}
                      </span>
                    </div>
                  </div>
                  {/* Entry price + expiry row */}
                  <div className="flex items-center justify-between px-3 pb-2">
                    <span className="text-[9px] text-white/30">
                      Giriş: <span className="text-white/55 font-mono">{entryPrice?.toFixed(5) ?? "—"}</span>
                    </span>
                    <span className="text-[9px]" style={{ color: `${dirAccent}99` }}>
                      {isUp ? "▲ CALL" : "▼ PUT"}
                    </span>
                  </div>
                  <div className="h-[2px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full transition-all duration-1000"
                      style={{ width: `${prog * 100}%`, background: dirAccent }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filter tabs ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-2 px-4 pt-3 pb-2">
        {(["ALL", "WIN", "LOSE"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
            style={{
              background: filter === f
                ? (f === "ALL" ? `${accent}18` : f === "WIN" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)")
                : "rgba(255,255,255,0.04)",
              color: filter === f
                ? (f === "ALL" ? accent : f === "WIN" ? "#0ecb81" : "#f6465d")
                : "rgba(255,255,255,0.28)",
              border: `1px solid ${filter === f
                ? (f === "ALL" ? `${accent}45` : f === "WIN" ? "rgba(14,203,129,0.3)" : "rgba(246,70,93,0.3)")
                : "rgba(255,255,255,0.07)"}`,
            }}>
            {f === "ALL" ? "Tümü" : f === "WIN" ? "Kazananlar" : "Kaybedenler"}
            {f !== "ALL" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {f === "WIN" ? totalWin : totalLose}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Trade list ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col gap-2">

          {tradesLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin mb-3" style={{
                width: 32, height: 32, borderRadius: "50%",
                border: `3px solid ${accent}25`,
                borderTopColor: accent,
              }} />
              <p className="text-xs font-bold text-white/20">Yükleniyor…</p>
            </div>
          )}

          {!tradesLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${accent}0d`, border: `1px solid ${accent}20` }}>
                <TrendingUp size={22} style={{ color: `${accent}60` }} />
              </div>
              <p className="text-sm font-bold text-white/20">İşlem geçmişi boş</p>
              <p className="text-[11px] text-white/12 mt-1">İşlem açtıkça burada görünür</p>
            </div>
          )}

          {!tradesLoading && filtered.map((trade: CompletedTrade) => {
            const isUp  = trade.direction === "UP";
            const isWin = trade.result === "WIN";
            const tradeAccent = isWin ? "#0ecb81" : "#f6465d";
            return (
              <div key={trade.id} className="rounded-2xl overflow-hidden relative"
                style={{ background: "#0d0d0d", border: "1px solid #1c1c1c" }}>

                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
                  style={{ background: tradeAccent }} />

                <div className="flex items-center gap-3 pl-4 pr-3.5 py-3">
                  {/* Direction icon */}
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isUp ? "rgba(14,203,129,0.09)" : "rgba(246,70,93,0.09)" }}>
                    <span className="text-base font-black"
                      style={{ color: isUp ? "#0ecb81" : "#f6465d" }}>
                      {isUp ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Asset + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-white leading-none truncate">{trade.asset}</span>
                      <span className="shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{
                          background: isWin ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
                          color: tradeAccent,
                          border: `1px solid ${isWin ? "rgba(14,203,129,0.22)" : "rgba(246,70,93,0.22)"}`,
                        }}>
                        {isWin ? "KAZANDI" : "KAYBETTİ"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/28 mt-0.5 font-mono">
                      {reltime(trade.closedAt)} · {fmt(trade.closedAt)}
                    </p>
                  </div>

                  {/* Profit/loss */}
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-black leading-none" style={{ color: tradeAccent }}>
                      {isWin ? `+$${trade.profit.toFixed(2)}` : `-$${trade.amount.toFixed(2)}`}
                    </p>
                    <p className="text-[9px] text-white/25 mt-0.5 font-mono">${trade.amount} yatırım</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
