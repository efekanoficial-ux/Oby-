import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/hooks/use-page-meta";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CandleChart, type ActiveEntry } from "@/components/candle-chart";
import { DrawingToolsModal } from "@/components/drawing-tools-modal";
import type { DrawingItem } from "@/types/drawing";
import { useDemoAccount, livePriceRegistry } from "@/context/DemoAccountContext";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { AnimatedBalance } from "@/components/animated-balance";
import { Tutorial } from "@/components/tutorial";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, RefreshCw, Pencil, Radio, Calendar,
  ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, X,
  Clock, BarChart3, Activity, ChevronLeft, ChevronRight,
  SlidersHorizontal, CandlestickChart, LineChart, RotateCw,
  Lock, ArrowRight, ShieldCheck,
} from "lucide-react";
import type { Candle } from "@/components/candle-chart";
import { AssetIcon } from "@/lib/asset-icons";

/* ─── Assets ─────────────────────────────────────────────────────────────── */
const ASSETS = [
  { label: "Crypto IDX",         icon: "/assets/crypto-idx.png", flag: "₿",      payout: 90, base: 6850.25, color: "#F7931A", desc: "Kripto Bileşik Endeksi",      digits: 2 },
  { label: "AUD/CAD",            icon: "/assets/aud-cad.png",    flag: "🇦🇺🇨🇦", payout: 85, base: 0.9080,  color: "#D4202C", desc: "Avustralya / Kanada",        digits: 5 },
  { label: "AUD/CHF",            icon: "/assets/aud-chf.png",    flag: "🇦🇺🇨🇭", payout: 85, base: 0.5520,  color: "#E84142", desc: "Avustralya / İsviçre",       digits: 5 },
  { label: "AUD/DKK",            icon: "/assets/aud-dkk.png",    flag: "🇦🇺🇩🇰", payout: 84, base: 4.4200,  color: "#C8102E", desc: "Avustralya / Danimarka",     digits: 4 },
  { label: "AUD/HUF",            icon: "/assets/aud-huf.png",    flag: "🇦🇺🇭🇺", payout: 84, base: 233.50,  color: "#477050", desc: "Avustralya / Macaristan",    digits: 3 },
  { label: "AUD/JPY",            icon: "/assets/aud-jpy.png",    flag: "🇦🇺🇯🇵", payout: 86, base: 97.20,   color: "#BC002D", desc: "Avustralya / Japonya",       digits: 3 },
  { label: "AUD/NOK",            icon: "/assets/aud-nok.png",    flag: "🇦🇺🇳🇴", payout: 84, base: 6.9300,  color: "#00205B", desc: "Avustralya / Norveç",        digits: 4 },
  { label: "AUD/NZD",            icon: "/assets/aud-nzd.png",    flag: "🇦🇺🇳🇿", payout: 85, base: 1.0820,  color: "#00247D", desc: "Avustralya / Yeni Zelanda",  digits: 5 },
  { label: "AUD/SEK",            icon: "/assets/aud-sek.png",    flag: "🇦🇺🇸🇪", payout: 84, base: 6.9100,  color: "#006AA7", desc: "Avustralya / İsveç",         digits: 4 },
  { label: "AUD/SGD",            icon: "/assets/aud-sgd.png",    flag: "🇦🇺🇸🇬", payout: 85, base: 0.8650,  color: "#EF3340", desc: "Avustralya / Singapur",      digits: 5 },
  { label: "AUD/USD",            icon: "/assets/aud-usd.png",    flag: "🇦🇺🇺🇸", payout: 86, base: 0.6600,  color: "#0084C7", desc: "Avustralya / ABD",           digits: 5 },
  { label: "AUD/ZAR",            icon: "/assets/aud-zar.png",    flag: "🇦🇺🇿🇦", payout: 84, base: 12.050,  color: "#007749", desc: "Avustralya / Güney Afrika",  digits: 4 },
  { label: "CAD/CHF",            icon: "/assets/cad-chf.png",    flag: "🇨🇦🇨🇭", payout: 85, base: 0.6080,  color: "#FF0000", desc: "Kanada / İsviçre",           digits: 5 },
];

function renderAssetFlag(a: { label: string; flag?: string; color?: string; icon?: string }, size = 18) {
  return <AssetIcon label={a.label} size={size} />;
}

/* ─── Asset Tab Bar (Max 2 Assets Side-by-Side) ─────────────────────────── */
interface AssetTabBarProps {
  openAssets: (typeof ASSETS)[0][];
  activeAsset: typeof ASSETS[0];
  onSelectAsset: (a: typeof ASSETS[0]) => void;
  onOpenAssetSheet: () => void;
  onCloseTab?: (a: typeof ASSETS[0], e: React.MouseEvent) => void;
  compact?: boolean;
}

function AssetTabBar({
  openAssets,
  activeAsset,
  onSelectAsset,
  onOpenAssetSheet,
  onCloseTab,
  compact = false,
}: AssetTabBarProps) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {openAssets.map((a) => {
        const isActive = a.label === activeAsset.label;
        return (
          <button
            key={a.label}
            onClick={() => onSelectAsset(a)}
            className={`group relative flex items-center gap-1.5 rounded-lg transition-all select-none shrink-0 cursor-pointer ${
              compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs"
            } ${
              isActive
                ? "bg-black text-white shadow-none"
                : "bg-black text-white/60 hover:text-white"
            }`}
            title={`${a.label} — %${a.payout} (Tıklayarak geçiş yap)`}
          >
            {/* Horizontal Flag(s) */}
            <div className="flex items-center shrink-0">
              {renderAssetFlag(a, compact ? 16 : 18)}
            </div>

            {/* Asset label */}
            <span className={`font-bold tracking-tight truncate ${compact ? "max-w-[65px]" : "max-w-[85px]"} ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}`}>
              {a.label}
            </span>

            {/* Payout badge */}
            <span className={`text-[10px] font-black shrink-0 ${isActive ? "text-[#0ecb81]" : "text-[#0ecb81]/80"}`}>
              {a.payout}%
            </span>

            {/* Dropdown chevron on active tab for quick list */}
            {isActive && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAssetSheet();
                }}
                className="p-0.5 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Varlık Değiştir"
              >
                <ChevronDown size={10} />
              </span>
            )}

            {/* Close button if 2 tabs are open */}
            {openAssets.length > 1 && onCloseTab && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(a, e);
                }}
                className="p-0.5 rounded-full text-white/30 hover:text-[#f6465d] hover:bg-white/15 transition-colors shrink-0 ml-0.5"
                title="Bu Varlığı Kapat"
              >
                <X size={10} strokeWidth={2.5} />
              </span>
            )}
          </button>
        );
      })}

      {/* Add 2nd tab button (Allowed when < 2 tabs) */}
      {openAssets.length < 2 && (
        <button
          onClick={onOpenAssetSheet}
          className={`flex items-center justify-center rounded-lg bg-black text-white hover:text-white/70 transition-all shrink-0 cursor-pointer ${
            compact ? "h-6 w-6" : "h-7 w-7"
          }`}
          title="İkinci Varlık Ekle (Maksimum 2 Varlık Yan Yana)"
        >
          <Plus size={compact ? 13 : 15} className="text-white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

const TIMEFRAMES = [
  { label: "5sn",  secs: 5    },
  { label: "30sn", secs: 30   },
  { label: "1dk",  secs: 60   },
  { label: "5dk",  secs: 300  },
  { label: "15dk", secs: 900  },
  { label: "30dk", secs: 1800 },
  { label: "1sa",  secs: 3600 },
];

function tfSubLabel(secs: number) {
  if (secs >= 3600) return `${secs / 3600} saat`;
  if (secs >= 60)   return `${secs / 60} dk`;
  return `${secs} sn`;
}

/* Finest → coarsest. Zoom in drills down toward 5sn, zoom out climbs to 30dk. */
const CHART_INTERVALS = [
  { label: "5sn",  value: "5s",  desc: "5 Saniye" },
  { label: "10sn", value: "10s", desc: "10 Saniye" },
  { label: "15sn", value: "15s", desc: "15 Saniye" },
  { label: "30sn", value: "30s", desc: "30 Saniye" },
  { label: "1dk",  value: "1m",  desc: "1 Dakika" },
  { label: "5dk",  value: "5m",  desc: "5 Dakika" },
  { label: "15dk", value: "15m", desc: "15 Dakika" },
  { label: "30dk", value: "30m", desc: "30 Dakika" },
];

function calcRSI(candles: Candle[], period = 14): (number | null)[] {
  if (candles.length < period + 1) return candles.map(() => null);
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) ag += d; else al += Math.abs(d);
  }
  ag /= period; al /= period;
  const rsi: (number | null)[] = candles.slice(0, period).map(() => null);
  rsi.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    ag = (ag * (period - 1) + Math.max(0, d)) / period;
    al = (al * (period - 1) + Math.max(0, -d)) / period;
    rsi.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  return rsi;
}

function RSIPanel({ candles }: { candles: Candle[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#080808"; ctx.fillRect(0, 0, W, H);
    const rsi = calcRSI(candles, 14).filter(v => v !== null) as number[];
    if (rsi.length < 2) return;
    const vis = rsi.slice(-60);
    const toY = (v: number) => H - 4 - (v / 100) * (H - 8);
    ctx.lineWidth = 0.5; ctx.setLineDash([2, 3]);
    [70, 50, 30].forEach(lv => {
      const y = toY(lv);
      ctx.strokeStyle = lv === 50 ? "#ffffff12" : lv === 70 ? "#f6465d30" : "#0ecb8130";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    const step = W / Math.max(vis.length - 1, 1);
    ctx.beginPath();
    vis.forEach((v, i) => {
      const x = i * step, y = toY(v);
      const col = v > 70 ? "#f6465d" : v < 30 ? "#0ecb81" : "#FF9500";
      ctx.strokeStyle = col;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const last = vis[vis.length - 1];
    ctx.fillStyle = "#ffffff35"; ctx.font = "9px Inter,monospace";
    ctx.textAlign = "left"; ctx.fillText("RSI(14)", 4, 12);
    ctx.fillStyle = last > 70 ? "#f6465d" : last < 30 ? "#0ecb81" : "#FF9500";
    ctx.textAlign = "right"; ctx.fillText(last.toFixed(1), W - 4, 12);
  }, [candles]);
  return (
    <div className="h-[72px] shrink-0 border-t border-white/5 bg-[#080808]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

/* ─── Chart notification overlay ─────────────────────────────────────────── */
interface ChartNotif {
  id: number; type: "open" | "close"; direction: "UP" | "DOWN";
  asset: string; amount: number; payout?: number; won?: boolean;
}

function ChartNotification({ notif }: { notif: ChartNotif | null }) {
  const { currencySymbol } = useAccountMode();
  const cs = currencySymbol;

  return (
    <AnimatePresence mode="wait">
      {notif && (
        <motion.div
          key={notif.id}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className="absolute top-2 left-1/2 z-20 -translate-x-1/2"
        >
          {(() => {
            const isOpen = notif.type === "open";
            const won    = notif.won ?? false;
            const accent = isOpen
              ? (notif.direction === "UP" ? "#0ecb81" : "#f6465d")
              : (won ? "#0ecb81" : "#f6465d");
            const total = notif.amount + (notif.payout ?? 0);
            const amtStr = isOpen
              ? `${cs}${notif.amount}`
              : (won ? `+${cs}${total.toFixed(2)}` : `-${cs}${notif.amount}`);
            const label = isOpen
              ? (notif.direction === "UP" ? "▲" : "▼")
              : (won ? "▲" : "▼");
            return (
              <div className="relative flex items-center gap-2 rounded-2xl px-3 py-2 overflow-hidden"
                style={{
                  background: `${accent}12`,
                  border: `1px solid ${accent}35`,
                  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 ${accent}20`,
                }}>
                <span className="text-[13px] font-black" style={{ color: accent }}>{label}</span>
                <span className="text-sm font-black tracking-tight" style={{ color: accent }}>{amtStr}</span>
                {!isOpen && (
                  <span className="text-[10px] font-semibold text-white/30">{notif.asset}</span>
                )}
                {isOpen && (
                  <span className="text-[10px] font-semibold text-white/30">{notif.asset}</span>
                )}
                <motion.div
                  initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
                  transition={{ duration: 3, ease: "linear", delay: 0.1 }}
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
                  style={{ backgroundColor: accent }}
                />
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Asset Bottom Sheet ─────────────────────────────────────────────────── */
function AssetSheet({
  visible, current, onSelect, onClose,
}: { visible: boolean; current: typeof ASSETS[0]; onSelect: (a: typeof ASSETS[0]) => void; onClose: () => void; }) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50" onClick={onClose}
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "80vh" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <div>
                <h2 className="text-sm font-black text-white">Varlık Seç</h2>
                <p className="text-[11px] text-white/30 mt-0.5">{ASSETS.length} varlık mevcut</p>
              </div>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <X size={13} className="text-white/50" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-8">
              {ASSETS.map((a) => {
                const isActive = a.label === current.label;
                return (
                  <button key={a.label}
                    onClick={() => { onSelect(a); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 mb-1.5 transition-colors"
                    style={{ background: isActive ? `${a.color}14` : "rgba(255,255,255,0.02)", border: isActive ? `1px solid ${a.color}30` : "1px solid transparent" }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 shadow-inner">
                      {renderAssetFlag(a, 26)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{a.label}</span>
                        {isActive && <span className="rounded px-1 py-0.5 text-[8px] font-black" style={{ background: `${a.color}25`, color: a.color }}>AKTİF</span>}
                      </div>
                      <span className="text-[11px] text-white/35">{a.desc}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#0ecb81]">{a.payout}%</div>
                      <div className="text-[9px] text-white/25">Payout</div>
                    </div>
                    <div className="flex items-end gap-0.5 h-6 shrink-0">
                      {[60,75,55,80,65,90,70].map((h, j) => (
                        <div key={j} className="rounded-t-[1px]" style={{ width:3, height:`${h*0.24}px`, background: isActive ? a.color : "#2a2a2a" }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Trade Controls (shared between mobile & desktop) ───────────────────── */
function TradeControls({
  asset, tf, setTf, amount, setAmount, price, expiryTimeStr,
  displayBalance, chartToast, onTrade, balanceWarn, chartLoading,
  currency, minAmount, glass, tradeBlocked,
}: {
  asset: typeof ASSETS[0]; tf: typeof TIMEFRAMES[0];
  setTf: (t: typeof TIMEFRAMES[0]) => void; amount: number;
  setAmount: (n: number) => void; price: number; expiryTimeStr: string;
  displayBalance: number;
  chartToast: ChartNotif | null; onTrade: (dir: "UP" | "DOWN") => void;
  balanceWarn: boolean; chartLoading: boolean;
  currency: "TL" | "USD"; minAmount: number;
  glass?: boolean; tradeBlocked: boolean;
}) {
  const [showDuration, setShowDuration] = useState(false);
  const [amountStr, setAmountStr] = useState(String(amount));
  useEffect(() => { setAmountStr(String(amount)); }, [amount]);

  const cs = currency === "TL" ? "₺" : "$";
  const step = currency === "TL" ? 10 : 5;
  const payout = (amount * (asset.payout / 100)).toFixed(2);
  const cardBg = glass ? "rgba(255,255,255,0.05)" : "#0d0d0d";
  const cardBorder = glass ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)";

  const commitAmount = (raw: string) => {
    const parsed = parseFloat(raw.replace(",", "."));
    const valid = isNaN(parsed) || parsed < minAmount ? minAmount : Math.max(minAmount, Math.min(displayBalance, parsed));
    setAmount(valid);
    setAmountStr(String(valid));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Amount + Duration */}
      <div className="flex gap-2">
        {/* Editable amount */}
        <div className="flex flex-1 flex-col rounded-2xl px-3 py-2.5 border" style={{ background: cardBg, borderColor: cardBorder }} data-tour="step-2">
          <span className="text-[9px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Tutar</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { const v = Math.max(minAmount, amount - step); setAmount(v); setAmountStr(String(v)); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white/40 border border-white/10 hover:border-white/20 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Minus size={10} />
            </button>
            <div className="flex flex-1 items-center justify-center gap-0.5">
              <span className="text-xs font-bold text-[#FF9500]">{cs}</span>
              <input
                type="text" inputMode="decimal"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                onBlur={() => commitAmount(amountStr)}
                onKeyDown={e => { if (e.key === "Enter") { commitAmount(amountStr); (e.target as HTMLInputElement).blur(); } }}
                className="w-14 text-center bg-transparent text-sm font-black text-white outline-none"
              />
            </div>
            <button
              onClick={() => { const v = Math.min(displayBalance, amount + step); setAmount(v); setAmountStr(String(v)); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white/40 border border-white/10 hover:border-white/20 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Duration picker button */}
        <button
          onClick={() => setShowDuration(true)}
          className="flex flex-1 flex-col rounded-2xl px-3 py-2.5 border text-left transition-colors active:scale-[0.97]"
          style={{ background: cardBg, borderColor: cardBorder }}
          data-tour="step-3"
        >
          <span className="text-[9px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Süre</span>
          <div className="flex items-center justify-center gap-1.5">
            <Clock size={11} className="text-[#FF9500]" />
            <span className="text-sm font-black text-white">{tf.label}</span>
            <ChevronDown size={9} className="text-white/40" />
          </div>
        </button>
      </div>

      {/* Duration picker modal */}
      <AnimatePresence>
        {showDuration && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              onClick={() => setShowDuration(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
              style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <h2 className="text-sm font-black text-white">İşlem Süresi</h2>
                  <p className="text-[11px] text-white/30 mt-0.5">Vade süresini seçin</p>
                </div>
                <button onClick={() => setShowDuration(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <X size={13} className="text-white/50" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 pb-8 pt-1">
                {TIMEFRAMES.map((t) => {
                  const isActive = t.label === tf.label;
                  return (
                    <motion.button
                      key={t.label}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => { setTf(t); setShowDuration(false); }}
                      className="flex flex-col items-center justify-center rounded-2xl py-3.5 gap-0.5 transition-all"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#FF6B00,#FF9500)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: isActive ? "0 4px 18px rgba(255,107,0,0.35)" : "none",
                      }}
                    >
                      <span className={`text-base font-black ${isActive ? "text-black" : "text-white"}`}>{t.label}</span>
                      <span className={`text-[9px] font-semibold ${isActive ? "text-black/60" : "text-white/30"}`}>
                        {tfSubLabel(t.secs)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Insufficient balance warning */}
      <AnimatePresence>
        {balanceWarn && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(246,70,93,0.10)", border: "1px solid rgba(246,70,93,0.25)" }}>
            <X size={12} className="text-[#f6465d] shrink-0" />
            <span className="text-xs font-bold text-[#f6465d]">Yetersiz bakiye — tutarı azaltın</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UP / DOWN */}
      <div className="flex gap-2" data-tour="step-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onTrade("UP")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-white font-black disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#05a660,#0ecb81)", boxShadow: "0 6px 20px rgba(14,203,129,0.30)" }}>
          <ArrowUp size={16} strokeWidth={3} />
          <span className="text-base font-black">{cs}{payout}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onTrade("DOWN")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-white font-black disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#c0283e,#f6465d)", boxShadow: "0 6px 20px rgba(246,70,93,0.30)" }}>
          <ArrowDown size={16} strokeWidth={3} />
          <span className="text-base font-black">{cs}{payout}</span>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Live countdown badge ───────────────────────────────────────────────── */
function CountdownBadge({ expiryTime, direction }: { expiryTime: number; direction: "UP" | "DOWN" }) {
  const [rem, setRem] = useState(Math.max(0, (expiryTime - Date.now()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setRem(Math.max(0, (expiryTime - Date.now()) / 1000)), 200);
    return () => clearInterval(iv);
  }, [expiryTime]);
  const color = direction === "UP" ? "#0ecb81" : "#f6465d";
  const mm = Math.floor(rem / 60).toString().padStart(2, "0");
  const ss = Math.floor(rem % 60).toString().padStart(2, "0");
  return (
    <span className="rounded-lg px-2 py-0.5 text-[11px] font-black font-mono" style={{ background: `${color}18`, color }}>
      {mm}:{ss}
    </span>
  );
}

/* ─── Auth Prompt Modal (Sleek, Minimalist, Modern) ─────────────────────── */
function AuthPrompt({ show, onClose, onNavigate }: { show: boolean; onClose: () => void; onNavigate: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center bg-[#0C0E14] border border-white/[0.1] shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
          >
            {/* Top glass reflection highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Sleek icon header */}
            <div className="h-12 w-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white mb-4">
              <Lock size={20} className="text-white/80" />
            </div>

            {/* Title & subtitle */}
            <div className="mb-5">
              <h3 className="text-lg font-black text-white tracking-tight">İşlem Sınırına Ulaşıldı</h3>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed font-normal">
                Deneme modundaki işlem hakkınızı tamamladınız. Kesintisiz işlem yapmak ve portföyünüzü yönetmek için lütfen giriş yapın veya ücretsiz hesap oluşturun.
              </p>
            </div>

            {/* Minimal highlights */}
            <div className="w-full grid grid-cols-2 gap-2 mb-6 text-left">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-white/70">10.000$ Demo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-white/70">Anlık Fiyat Akışı</span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onNavigate}
                className="w-full rounded-xl py-3 text-xs font-bold text-black bg-white hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-white/5"
              >
                <span>Giriş Yap / Kayıt Ol</span>
                <ArrowRight size={14} />
              </motion.button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-medium text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Daha Sonra
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Indicators Modal (Shared Mobile Sheet & Desktop Dialog) ─────────────── */
function IndicatorsModal({
  visible,
  onClose,
  showMA,
  onToggleMA,
  showBollinger,
  onToggleBollinger,
  showRSI,
  onToggleRSI,
}: {
  visible: boolean;
  onClose: () => void;
  showMA: boolean;
  onToggleMA: () => void;
  showBollinger: boolean;
  onToggleBollinger: () => void;
  showRSI: boolean;
  onToggleRSI: () => void;
}) {
  const activeIndicatorCount = [showRSI, showBollinger, showMA].filter(Boolean).length;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-3xl z-50 rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ background: "#0e0e0e", border: "1px solid #222", maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Mobile drag handle */}
            <div className="flex md:hidden justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>GÖSTERGELER</h2>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#242424", borderRadius: 20, padding: "3px 10px" }}>
                    Kullanılabilir 7
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: activeIndicatorCount > 0 ? "#FF9500" : "rgba(255,255,255,0.35)", padding: "3px 0" }}>
                    Aktif {activeIndicatorCount}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} color="rgba(255,255,255,0.6)" />
              </button>
            </div>

            {/* Indicator list */}
            {[
              { key: "ma",  label: "Hareketli Ortalama", sub: "EMA 20", active: showMA, onToggle: onToggleMA, color: "#FFD700", impl: true },
              { key: "bb",  label: "Bollinger Bantları",  sub: "BB 20,2", active: showBollinger, onToggle: onToggleBollinger, color: "#4DA2FF", impl: true },
              { key: "rsi", label: "RSI",                 sub: "14 dönem", active: showRSI, onToggle: onToggleRSI, color: "#FF9500", impl: true },
              { key: "macd",   label: "MACD",          sub: "12,26,9",  active: false, onToggle: undefined, color: "#a78bfa", impl: false },
              { key: "sar",    label: "Parabolic SAR",  sub: "0.02,0.2", active: false, onToggle: undefined, color: "#34d399", impl: false },
              { key: "frac",   label: "Fractals",       sub: "Williams", active: false, onToggle: undefined, color: "#f472b6", impl: false },
              { key: "alig",   label: "Alligator",      sub: "Williams", active: false, onToggle: undefined, color: "#60a5fa", impl: false },
            ].map(ind => (
              <div
                key={ind.key}
                onClick={() => ind.impl && ind.onToggle && ind.onToggle()}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 20px",
                  borderTop: "1px solid #1a1a1a",
                  cursor: ind.impl ? "pointer" : "default",
                  opacity: ind.impl ? 1 : 0.38,
                }}
              >
                {/* Icon circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: ind.active ? `${ind.color}22` : "#1c1c1c",
                  border: `1px solid ${ind.active ? `${ind.color}55` : "#2a2a2a"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Activity size={17} color={ind.active ? ind.color : "rgba(255,255,255,0.4)"} />
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>{ind.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{ind.sub}</p>
                </div>
                {/* Toggle switch */}
                {ind.impl && (
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, position: "relative", flexShrink: 0,
                    background: ind.active ? "#FF6B00" : "#2a2a2a",
                    transition: "background 0.2s",
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: ind.active ? 22 : 3, width: 18, height: 18,
                      borderRadius: "50%", background: "#fff",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }} />
                  </div>
                )}
                {!ind.impl && (
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.05em" }}>YAKINDA</span>
                )}
              </div>
            ))}
            <div style={{ height: "max(16px, env(safe-area-inset-bottom))" }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Chart Interval Modal (Shared Mobile Sheet & Desktop Dialog) ─────────── */
function ChartIntervalModal({
  visible,
  onClose,
  chartIntervalIdx,
  onSelectInterval,
}: {
  visible: boolean;
  onClose: () => void;
  chartIntervalIdx: number;
  onSelectInterval: (idx: number) => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-3xl z-50 rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ background: "#0e0e0e", border: "1px solid #222", maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Mobile drag handle */}
            <div className="flex md:hidden justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Grafik Zamanı</h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, margin: 0 }}>Mum periyodunu seçin</p>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} color="rgba(255,255,255,0.6)" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 px-4 pb-8 pt-2">
              {CHART_INTERVALS.map((ci, idx) => {
                const isActive = chartIntervalIdx === idx;
                return (
                  <motion.button
                    key={ci.value}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      onSelectInterval(idx);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center rounded-2xl py-3.5 gap-0.5"
                    style={{
                      background: isActive ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: isActive ? "0 4px 18px rgba(37,99,235,0.35)" : "none",
                    }}
                  >
                    <span className={`text-base font-black ${isActive ? "text-white" : "text-white"}`}>{ci.label}</span>
                    <span className={`text-[9px] font-semibold ${isActive ? "text-white/80" : "text-white/30"}`}>
                      {ci.desc || ci.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Mobile Trade Panel (Binomo-style bottom overlay) ───────────────────── */
function MobileTradePanel({
  asset, tf, setTf, amount, setAmount, displayBalance,
  onTrade, balanceWarn, chartLoading, currency, minAmount, tradeBlocked,
  showRSI, onToggleRSI, showBollinger, onToggleBollinger,
  showMA, onToggleMA, chartType, onToggleChartType,
  chartIntervalIdx, onChartIntervalChange, isLiveData,
  isLandscape, onToggleOrientation,
  drawings = [], onOpenDrawings,
}: {
  asset: typeof ASSETS[0]; tf: typeof TIMEFRAMES[0];
  setTf: (t: typeof TIMEFRAMES[0]) => void;
  amount: number; setAmount: (n: number) => void;
  displayBalance: number; onTrade: (dir: "UP" | "DOWN") => void;
  balanceWarn: boolean; chartLoading: boolean;
  currency: "TL" | "USD"; minAmount: number; tradeBlocked: boolean;
  showRSI: boolean; onToggleRSI: () => void;
  showBollinger: boolean; onToggleBollinger: () => void;
  showMA: boolean; onToggleMA: () => void;
  chartType: "candle" | "line"; onToggleChartType: () => void;
  chartIntervalIdx: number; onChartIntervalChange: (i: number) => void;
  isLiveData: boolean;
  isLandscape?: boolean;
  onToggleOrientation?: () => void;
  drawings?: DrawingItem[];
  onOpenDrawings?: () => void;
}) {
  const [showDuration, setShowDuration] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showChartInterval, setShowChartInterval] = useState(false);
  const [amountStr, setAmountStr] = useState(String(amount));
  useEffect(() => { setAmountStr(String(amount)); }, [amount]);

  const activeIndicatorCount = [showRSI, showBollinger, showMA].filter(Boolean).length;

  const cs = currency === "TL" ? "₺" : "$";
  const step = currency === "TL" ? 10 : 5;
  const totalReturn = (amount * (1 + asset.payout / 100)).toFixed(2);
  const expiryStr = (() => {
    const d = new Date(Date.now() + tf.secs * 1000);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  })();

  const commitAmount = (raw: string) => {
    const parsed = parseFloat(raw.replace(",", "."));
    const valid = isNaN(parsed) || parsed < minAmount ? minAmount : Math.max(minAmount, Math.min(displayBalance, parsed));
    setAmount(valid);
    setAmountStr(String(valid));
  };

  const tbBtn = (active: boolean, accent?: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: active && accent ? `${accent}1a` : "#1c1c1c",
    border: `1px solid ${active && accent ? `${accent}45` : "#252525"}`,
    cursor: "pointer",
    color: "#ffffff",
  });

  return (
    <>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "4px 8px 2px" }}>

        {/* Chart interval — tap to open selection sheet */}
        <button
          onClick={() => setShowChartInterval(true)}
          style={{ ...tbBtn(false), color: "#ffffff", fontSize: 11, fontWeight: 800, letterSpacing: "0.01em" }}
          title="Grafik Zaman Aralığı"
        >
          {CHART_INTERVALS[chartIntervalIdx]?.label || "5sn"}
        </button>

        {/* Indicators — opens sheet */}
        <button onClick={() => setShowIndicators(true)} style={{ ...tbBtn(activeIndicatorCount > 0, "#4DA2FF"), position: "relative" }} title="İndikatörler">
          <SlidersHorizontal size={15} color="#ffffff" />
          {activeIndicatorCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4, width: 6, height: 6,
              borderRadius: "50%", background: "#4DA2FF", border: "1px solid #1c1c1c",
            }} />
          )}
        </button>

        {/* Chart type — candle ↔ line */}
        <button onClick={onToggleChartType} style={tbBtn(false)} title="Grafik Tipi">
          {chartType === "candle"
            ? <CandlestickChart size={15} color="#ffffff" />
            : <LineChart size={15} color="#ffffff" />}
        </button>

        {/* Ekranı Yan / Dik Çevir */}
        <button
          onClick={onToggleOrientation}
          style={tbBtn(false)}
          title={isLandscape ? "Ekranı Dik Çevir" : "Ekranı Yan Çevir"}
        >
          <RotateCw size={15} color="#ffffff" />
        </button>

        {/* Draw — pencil button */}
        <button
          onClick={onOpenDrawings}
          style={{ ...tbBtn(drawings.length > 0, "#FFB800"), position: "relative" }}
          title="Çizim Araçları (Dikey, Yatay, Çapraz)"
        >
          <Pencil size={14} color="#ffffff" />
          {drawings.length > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4, width: 6, height: 6,
              borderRadius: "50%", background: "#FFB800", border: "1px solid #1c1c1c",
            }} />
          )}
        </button>

        {/* Duration / Calendar */}
        <button onClick={() => setShowDuration(true)} style={tbBtn(false)} data-tour="step-3" title="Vade Süresi">
          <Calendar size={14} color="#ffffff" />
        </button>

        {/* LIVE dot */}
        <div style={{ ...tbBtn(false), cursor: "default" }} title="Canlı Bağlantı">
          <Radio size={14} color="#ffffff" />
        </div>
      </div>

      {/* ── Indicators Sheet ──────────────────────────────────────────────── */}
      <IndicatorsModal
        visible={showIndicators}
        onClose={() => setShowIndicators(false)}
        showMA={showMA}
        onToggleMA={onToggleMA}
        showBollinger={showBollinger}
        onToggleBollinger={onToggleBollinger}
        showRSI={showRSI}
        onToggleRSI={onToggleRSI}
      />

      {/* ── Chart Interval Sheet ─────────────────────────────────────────── */}
      <ChartIntervalModal
        visible={showChartInterval}
        onClose={() => setShowChartInterval(false)}
        chartIntervalIdx={chartIntervalIdx}
        onSelectInterval={onChartIntervalChange}
      />

      {/* ── Tutar + Zaman ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, padding: "2px 12px 6px" }} data-tour="step-2">
        {/* Tutar */}
        <div style={{ flex: 1, background: "#1c1c1c", borderRadius: 12, padding: "7px 10px", border: "1px solid #252525" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tutar</p>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => { const v = Math.max(minAmount, amount - step); setAmount(v); setAmountStr(String(v)); }}
              style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
            >
              <Minus size={12} />
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#FF9500" }}>{cs}</span>
              <input
                type="text" inputMode="decimal"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                onBlur={() => commitAmount(amountStr)}
                onKeyDown={e => { if (e.key === "Enter") { commitAmount(amountStr); (e.target as HTMLInputElement).blur(); } }}
                style={{ width: 46, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: "inherit" }}
              />
            </div>
            <button
              onClick={() => { const v = Math.min(displayBalance, amount + step); setAmount(v); setAmountStr(String(v)); }}
              style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Zaman */}
        <button
          onClick={() => setShowDuration(true)}
          style={{ flex: 1, background: "#1c1c1c", borderRadius: 12, padding: "7px 10px", border: "1px solid #252525", textAlign: "left", cursor: "pointer" }}
        >
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Zaman</p>
          <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{expiryStr}</p>
        </button>
      </div>

      {/* ── Balance warn ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {balanceWarn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ margin: "0 12px 8px", overflow: "hidden", display: "flex", alignItems: "center", gap: 8,
              borderRadius: 12, padding: "8px 12px", background: "rgba(246,70,93,0.10)", border: "1px solid rgba(246,70,93,0.25)" }}
          >
            <X size={12} color="#f6465d" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f6465d" }}>Yetersiz bakiye — tutarı azaltın</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UP / DOWN ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, padding: "0 12px", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }} data-tour="step-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onTrade("UP")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            borderRadius: 14, padding: "11px 0", border: "none", cursor: "pointer",
            background: "#18c463",
            opacity: tradeBlocked || balanceWarn || chartLoading ? 0.45 : 1,
          }}
        >
          <ArrowUp size={16} strokeWidth={3} color="#fff" />
          <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: "inherit" }}>{cs}{totalReturn}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onTrade("DOWN")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            borderRadius: 14, padding: "11px 0", border: "none", cursor: "pointer",
            background: "#e84040",
            opacity: tradeBlocked || balanceWarn || chartLoading ? 0.45 : 1,
          }}
        >
          <ArrowDown size={16} strokeWidth={3} color="#fff" />
          <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: "inherit" }}>{cs}{totalReturn}</span>
        </motion.button>
      </div>

      {/* ── Duration picker modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDuration && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              onClick={() => setShowDuration(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
              style={{ background: "#0e0e0e", border: "1px solid #222" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <h2 className="text-sm font-black text-white">İşlem Süresi</h2>
                  <p className="text-[11px] text-white/30 mt-0.5">Vade süresini seçin</p>
                </div>
                <button onClick={() => setShowDuration(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <X size={13} className="text-white/50" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 pb-8 pt-1">
                {TIMEFRAMES.map((t) => {
                  const isActive = t.label === tf.label;
                  return (
                    <motion.button
                      key={t.label} whileTap={{ scale: 0.94 }}
                      onClick={() => { setTf(t); setShowDuration(false); }}
                      className="flex flex-col items-center justify-center rounded-2xl py-3.5 gap-0.5"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#FF6B00,#FF9500)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: isActive ? "0 4px 18px rgba(255,107,0,0.35)" : "none",
                      }}
                    >
                      <span className={`text-base font-black ${isActive ? "text-black" : "text-white"}`}>{t.label}</span>
                      <span className={`text-[9px] font-semibold ${isActive ? "text-black/60" : "text-white/30"}`}>
                        {tfSubLabel(t.secs)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Home Page ──────────────────────────────────────────────────────────── */
export default function Home() {
  const { t } = useLanguage();
  usePageMeta({
    title: "Obyo Option — İkili Opsiyon Trading",
    description:
      "Obyo Option — Forex ve OTC varlıklarla profesyonel ikili opsiyon trading platformu.",
    canonical: "https://obyo.io/",
    ogTitle: "Obyo Option — İkili Opsiyon Trading",
    ogDescription:
      "Forex ve OTC varlıklarla profesyonel ikili opsiyon trading platformu.",
    twitterTitle: "Obyo Option",
    twitterDescription: "Profesyonel ikili opsiyon trading platformu.",
  });

  const { balance, activeTrades, completedTrades, tradesLoading, placeTrade } = useDemoAccount();
  const { placeRealTrade, settleRealTrade, currentUser } = useAuth();
  const { displayBalance, isReal, currency, currencySymbol } = useAccountMode();
  const isMobile = useIsMobile();
  const minAmount = currency === "TL" ? 34 : 1;
  const sym = currencySymbol;
  const [, navigate] = useLocation();

  const [openAssets,     setOpenAssets]     = useState<(typeof ASSETS)[0][]>(() => {
    try {
      const saved = localStorage.getItem("obyo_open_assets");
      if (saved) {
        const labels: string[] = JSON.parse(saved);
        const found = labels.map(l => ASSETS.find(a => a.label === l)).filter(Boolean) as (typeof ASSETS)[0][];
        if (found.length > 0) return found.slice(0, 2);
      }
    } catch {}
    return [ASSETS[0]];
  });

  const [asset,          setAsset]          = useState<(typeof ASSETS)[0]>(() => {
    try {
      const savedLabel = localStorage.getItem("obyo_active_asset");
      if (savedLabel) {
        const found = ASSETS.find(a => a.label === savedLabel);
        if (found) return found;
      }
    } catch {}
    return ASSETS[0];
  });
  const [showAssets,     setShowAssets]     = useState(false);
  const [tf,             setTf]             = useState(TIMEFRAMES[0]);
  const [amount,         setAmount]         = useState(() => {
    try { const v = localStorage.getItem("obyo_trade_amount"); if (v) return Number(v); } catch {}
    return 10;
  });
  const [price,          setPrice]          = useState(asset.base);
  const [priceDir,       setPriceDir]       = useState<"up" | "down" | null>(null);
  const [chartEntries,   setChartEntries]   = useState<(ActiveEntry & { id: string; amount: number; isReal?: boolean })[]>([]);
  const [realEntries,    setRealEntries]    = useState<(ActiveEntry & { id: string; amount: number; payoutRate: number; assetLabel: string })[]>([]);
  const realEntryFsIdMapRef = useRef<Map<string, string>>(new Map());
  const [chartToast,     setChartToast]     = useState<ChartNotif | null>(null);
  const [isPanned,       setIsPanned]       = useState(false);
  const [goLiveKey,      setGoLiveKey]      = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [chartIntervalIdx, setChartIntervalIdx] = useState(0);
  const [showPanel,      setShowPanel]      = useState(true);
  const [showRSI,        setShowRSI]        = useState(false);
  const [now,            setNow]            = useState(Date.now());
  const [showBollinger,  setShowBollinger]  = useState(false);
  const [showMA,         setShowMA]         = useState(false);
  const [chartType,      setChartType]      = useState<"candle" | "line">("candle");
  const [chartCandles,   setChartCandles]   = useState<Candle[]>([]);
  const [isLiveData,     setIsLiveData]     = useState(false);
  const [chartLoading,   setChartLoading]   = useState(true);
  const [isLandscape,    setIsLandscape]    = useState(false);
  const [showDurationLandscape, setShowDurationLandscape] = useState(false);
  const [drawings,       setDrawings]       = useState<DrawingItem[]>(() => {
    try {
      const saved = localStorage.getItem("obyo_chart_drawings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false);
  const [showIntervalModal,   setShowIntervalModal]   = useState(false);
  const activeIndicatorCount = [showRSI, showBollinger, showMA].filter(Boolean).length;

  const handleDrawingsChange = useCallback((newDrawings: DrawingItem[]) => {
    setDrawings(newDrawings);
    try { localStorage.setItem("obyo_chart_drawings", JSON.stringify(newDrawings)); } catch {}
  }, []);

  const handleAddDrawing = useCallback((item: Omit<DrawingItem, "id">) => {
    const newItem: DrawingItem = {
      ...item,
      id: "draw_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    } as DrawingItem;
    setDrawings(prev => {
      const next = [...prev, newItem];
      try { localStorage.setItem("obyo_chart_drawings", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleDeleteDrawing = useCallback((id: string) => {
    setDrawings(prev => {
      const next = prev.filter(d => d.id !== id);
      try { localStorage.setItem("obyo_chart_drawings", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleClearDrawings = useCallback(() => {
    setDrawings([]);
    try { localStorage.removeItem("obyo_chart_drawings"); } catch {}
  }, []);

  const [viewportDims,   setViewportDims]   = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 390,
    h: typeof window !== "undefined" ? window.innerHeight : 844,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportDims({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const handleToggleOrientation = async () => {
    const next = !isLandscape;
    setIsLandscape(next);
    try {
      if (next) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
        if ((screen.orientation as any)?.lock) {
          await (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        if ((screen.orientation as any)?.lock) {
          await (screen.orientation as any).lock("portrait").catch(() => {});
        } else if (screen.orientation?.unlock) {
          screen.orientation.unlock();
        }
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {}
  };

  const setAmountPersist = useCallback((v: number | ((prev: number) => number)) => {
    setAmount(prev => {
      const nextRaw = typeof v === "function" ? v(prev) : v;
      const next = isNaN(nextRaw) ? minAmount : Math.max(minAmount, nextRaw);
      try { localStorage.setItem("obyo_trade_amount", String(next)); } catch {}
      return next;
    });
  }, [minAmount]);

  useEffect(() => {
    if (amount < minAmount) {
      setAmountPersist(minAmount);
    }
  }, [minAmount, amount, setAmountPersist]);

  /* Update now every second — used to filter expired active trades from the UI
     before the 500ms settlement interval fires (prevents "stuck at 00:00" cards). */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const balanceWarn = amount > displayBalance;

  const handleZoom = useCallback((dir: "in" | "out") => {
    setChartIntervalIdx(i =>
      dir === "in" ? Math.max(0, i - 1) : Math.min(CHART_INTERVALS.length - 1, i + 1)
    );
  }, []);

  const prevPriceRef        = useRef(asset.base);
  const assetLabelRef       = useRef(asset.label);
  useEffect(() => { assetLabelRef.current = asset.label; }, [asset.label]);
  const notifTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifIdRef          = useRef(0);
  const expiryTimerMapRef   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prevCompletedIdsRef  = useRef<string[]>(completedTrades.map(t => t.id));
  const completedLoadedRef   = useRef(!tradesLoading); // guests: already loaded; logged-in: wait for Firestore

  const expiryTimeStr = (() => {
    const d = new Date(Date.now() + tf.secs * 1000);
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  })();

  const showChartNotif = useCallback((data: Omit<ChartNotif, "id">) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    const id = ++notifIdRef.current;
    setChartToast({ ...data, id });
    notifTimerRef.current = setTimeout(() => setChartToast(null), 3200);
  }, []);

  /* Timers for real trades — one per entry, recreated whenever realEntries changes */
  useEffect(() => {
    for (const re of realEntries) {
      const delay = Math.max(0, re.expiryTime - Date.now());
      const timer = setTimeout(() => {
        const finalPrice = prevPriceRef.current;
        const won = re.direction === "UP"
          ? finalPrice >= re.entryPrice
          : finalPrice <= re.entryPrice;
        const payoutAmt = parseFloat((re.amount * (re.payoutRate / 100)).toFixed(2));
        settleRealTrade(re.amount, won, payoutAmt);
        const currentUid = currentUser?.id ?? auth.currentUser?.uid;
        if (currentUid) {
          addDoc(collection(db, "trades"), {
            userId: currentUid, asset: re.assetLabel, direction: re.direction,
            amount: re.amount, result: won ? "WIN" : "LOSE",
            profit: won ? payoutAmt : -re.amount, closedAt: Date.now(), mode: "real",
            entryPrice: re.entryPrice,
            exitPrice: finalPrice,
          }).catch((err) => console.error("Error saving real trade to trades collection:", err));
        }
        const fsId = realEntryFsIdMapRef.current.get(re.id);
        if (fsId) {
          deleteDoc(doc(db, "realActiveTrades", fsId)).catch(() => {});
          realEntryFsIdMapRef.current.delete(re.id);
        }
        showChartNotif({ type: "close", direction: re.direction, asset: re.assetLabel, amount: re.amount, payout: payoutAmt, won });
        setRealEntries(prev => prev.filter(e => e.id !== re.id));
        setChartEntries(prev => prev.filter(e => e.id !== re.id));
      }, delay);
      expiryTimerMapRef.current.set(re.id, timer);
    }
    return () => {
      for (const timer of expiryTimerMapRef.current.values()) clearTimeout(timer);
      expiryTimerMapRef.current.clear();
    };
  }, [realEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Notify on demo trade completion — skip the initial Firestore hydration burst */
  useEffect(() => {
    if (!completedLoadedRef.current) {
      if (!tradesLoading) {
        prevCompletedIdsRef.current = completedTrades.map(t => t.id);
        completedLoadedRef.current = true;
      }
      return;
    }
    const prevIds = new Set(prevCompletedIdsRef.current);
    // Exclude real trades — they get their own notification from the settlement timer
    const newTrades = completedTrades.filter(t => !prevIds.has(t.id) && t.mode !== "real");
    prevCompletedIdsRef.current = completedTrades.map(t => t.id);
    if (newTrades.length === 0) return;
    /* Show notification for every newly-completed trade (handles simultaneous completions). */
    newTrades.forEach(trade => {
      showChartNotif({
        type: "close", direction: trade.direction, asset: trade.asset,
        amount: trade.amount, payout: Math.abs(trade.profit), won: trade.result === "WIN",
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTrades.length, tradesLoading]);

  /* Sync chartEntries with activeTrades:
     - Remove entries whose demo trade is no longer active (settled).
     - Add entries for demo trades loaded from Firestore (e.g. after login). */
  useEffect(() => {
    const now = Date.now();
    setChartEntries(prev => {
      const prevDemoIds = new Set(prev.filter(e => !e.isReal).map(e => e.id));
      const activeIds   = new Set(activeTrades.map(t => t.id));
      // Remove settled demo trades
      const kept = prev.filter(e => e.isReal || activeIds.has(e.id));
      // Add demo trades that came from Firestore but aren't yet in chartEntries
      const toAdd = activeTrades
        .filter(t => !prevDemoIds.has(t.id) && t.startTime + t.duration * 1000 > now)
        .map(t => ({
          id: t.id, entryTime: t.startTime, entryPrice: t.startPrice,
          expiryTime: t.startTime + t.duration * 1000,
          direction: t.direction, amount: t.amount, isReal: false as const,
        }));
      if (toAdd.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...toAdd];
    });
  }, [activeTrades]);

  /* Restore real active trades from Firestore when the user logs in.
     On first load or re-login, any real trade still in "realActiveTrades"
     collection gets added back to realEntries (restart settlement timer)
     and to chartEntries (re-draw overlay lines). */
  useEffect(() => {
    const uid = currentUser?.id ?? auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, "realActiveTrades"), where("userId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      snap.docChanges().forEach(change => {
        if (change.type !== "added") return;
        const data = change.doc.data();
        const tradeId = (data.id ?? data.tradeId) as string;
        const expiryTime = data.expiryTime as number;
        if (!tradeId) return;

        // If trade expired while user was offline / navigating, settle it immediately
        if (expiryTime <= now) {
          const entryPrice = (data.entryPrice as number) || 0;
          const currentPrice = livePriceRegistry[data.asset as string] || entryPrice;
          const isUp = data.direction === "UP";
          const won = isUp ? currentPrice >= entryPrice : currentPrice <= entryPrice;
          const payoutAmt = parseFloat(((data.amount as number) * (((data.payoutRate as number) || 85) / 100)).toFixed(2));
          settleRealTrade(data.amount as number, won, payoutAmt);
          addDoc(collection(db, "trades"), {
            userId: uid, asset: data.asset, direction: data.direction,
            amount: data.amount, result: won ? "WIN" : "LOSE",
            profit: won ? payoutAmt : -(data.amount as number), closedAt: expiryTime, mode: "real",
            entryPrice, exitPrice: currentPrice,
          }).catch((err) => console.error("Error saving expired real trade to trades collection:", err));
          deleteDoc(doc(db, "realActiveTrades", change.doc.id)).catch(() => {});
          return;
        }

        const re = {
          id: tradeId,
          entryTime:  data.entryTime  as number,
          entryPrice: data.entryPrice as number,
          expiryTime,
          direction:  data.direction  as "UP" | "DOWN",
          amount:     data.amount     as number,
          payoutRate: (data.payoutRate as number | undefined) ?? 85,
          assetLabel: data.asset      as string,
        };
        realEntryFsIdMapRef.current.set(tradeId, change.doc.id);
        setRealEntries(prev => prev.find(e => e.id === tradeId) ? prev : [...prev, re]);
        setChartEntries(prev => prev.find(e => e.id === tradeId) ? prev : [...prev, { ...re, isReal: true }]);
      });
    }, () => {/* ignore permission errors (guest / logged-out) */});
    return () => unsub();
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrice = useCallback((p: number) => {
    livePriceRegistry[assetLabelRef.current] = p;
    const prev = prevPriceRef.current;
    if (Math.abs(p - prev) > 0.000001) {
      setPriceDir(p > prev ? "up" : "down");
      setTimeout(() => setPriceDir(null), 350);
      prevPriceRef.current = p;
    }
    setPrice(p);
  }, []);

  const handleAsset = useCallback((a: typeof ASSETS[0]) => {
    setAsset(a);
    setPrice(a.base);
    prevPriceRef.current = a.base;
    try { localStorage.setItem("obyo_active_asset", a.label); } catch {}
    setOpenAssets(prev => {
      if (prev.some(x => x.label === a.label)) return prev;
      if (prev.length < 2) {
        const next = [...prev, a];
        try { localStorage.setItem("obyo_open_assets", JSON.stringify(next.map(x => x.label))); } catch {}
        return next;
      }
      const next = [prev[0], a];
      try { localStorage.setItem("obyo_open_assets", JSON.stringify(next.map(x => x.label))); } catch {}
      return next;
    });
  }, []);

  const handleSelectFromSheet = useCallback((a: typeof ASSETS[0]) => {
    setAsset(a);
    setPrice(a.base);
    prevPriceRef.current = a.base;
    try { localStorage.setItem("obyo_active_asset", a.label); } catch {}
    setOpenAssets(prev => {
      if (prev.some(x => x.label === a.label)) return prev;
      let next: (typeof ASSETS)[0][];
      if (prev.length < 2) {
        next = [...prev, a];
      } else {
        next = prev.map(item => item.label === asset.label ? a : item);
        if (!next.some(x => x.label === a.label)) {
          next = [prev[0], a];
        }
      }
      try { localStorage.setItem("obyo_open_assets", JSON.stringify(next.map(x => x.label))); } catch {}
      return next;
    });
  }, [asset.label]);

  const handleCloseTab = useCallback((tabToClose: typeof ASSETS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenAssets(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(x => x.label !== tabToClose.label);
      try { localStorage.setItem("obyo_open_assets", JSON.stringify(next.map(x => x.label))); } catch {}
      if (asset.label === tabToClose.label && next.length > 0) {
        setAsset(next[0]);
        setPrice(next[0].base);
        prevPriceRef.current = next[0].base;
        try { localStorage.setItem("obyo_active_asset", next[0].label); } catch {}
      }
      return next;
    });
  }, [asset.label]);

  /* For demo & real: up to 5 simultaneous LIVE trades (exclude already-expired ones that
     haven't been settled yet by the interval, so they don't eat into the limit). */
  const liveTradeCount = activeTrades.filter(
    t => t.startTime + t.duration * 1000 > Date.now()
  ).length;
  const liveRealCount = realEntries.filter(
    r => r.expiryTime > Date.now()
  ).length;
  const currentActiveCount = isReal ? liveRealCount : liveTradeCount;
  const tradeBlocked = currentActiveCount >= 5;

  const isTradingRef = useRef(false);

  const handleTrade = async (dir: "UP" | "DOWN") => {
    if (isTradingRef.current) return;

    if (currentActiveCount >= 5) {
      alert("Aynı anda en fazla 5 aktif işlem açabilirsiniz.");
      return;
    }

    const tradeAmount = Math.max(minAmount, isNaN(amount) ? minAmount : amount);
    if (amount < minAmount) {
      setAmountPersist(minAmount);
    }

    const currentBal = isReal ? (currentUser?.realBalance ?? 0) : balance;
    if (currentBal < tradeAmount || balanceWarn) {
      alert(isReal ? "Yetersiz Bakiye. Lütfen cüzdanınıza para yatırın." : "Demo bakiyeniz yetersiz.");
      return;
    }

    const isLoggedIn   = !!currentUser;
    const tutorialUsed = !!localStorage.getItem("obyo_tutorial_trade_done");

    if (!isLoggedIn && tutorialUsed) { setShowAuthPrompt(true); return; }
    if (!isLoggedIn) { localStorage.setItem("obyo_tutorial_trade_done", "1"); }

    const now      = Date.now();
    const id       = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const expiryMs = now + tf.secs * 1000;

    isTradingRef.current = true;
    try {
      if (isReal) {
        const ok = await placeRealTrade(tradeAmount);
        if (!ok) return;
        const re = { id, entryTime: now, entryPrice: price, expiryTime: expiryMs, direction: dir, amount: tradeAmount, payoutRate: asset.payout, assetLabel: asset.label };
        setRealEntries(prev => [...prev, re]);
        setChartEntries(prev => [...prev, { ...re, isReal: true }]);
        /* Save to Firestore immediately so trade persists across sessions */
        const currentUid = currentUser?.id ?? auth.currentUser?.uid;
        if (currentUid) {
          addDoc(collection(db, "realActiveTrades"), {
            userId: currentUid, tradeId: id, id, asset: asset.label, direction: dir,
            amount: tradeAmount, entryPrice: price, entryTime: now, expiryTime: expiryMs,
            payoutRate: asset.payout,
          }).then(ref => { realEntryFsIdMapRef.current.set(id, ref.id); }).catch(() => {});
        }
      } else {
        /* Pass the same id to placeTrade so activeTrades and chartEntries share the same id.
           This lets the activeTrades sync effect (above) remove the overlay at settlement. */
        const tradeId = placeTrade(asset.label, dir, tradeAmount, tf.secs, price, id);
        if (!tradeId) return;
        const entry = { id, entryTime: now, entryPrice: price, expiryTime: expiryMs, direction: dir, amount: tradeAmount, isReal: false };
        setChartEntries(prev => [...prev, entry]);
      }
    } finally {
      isTradingRef.current = false;
    }
  };

  /* ── Shared chart area ──────────────────────────────────────────────────── */
  const chartArea = (
    <div className="relative flex-1 min-h-0">
      <CandleChart
        basePrice={asset.base}
        symbol={asset.label}
        digits={asset.digits}
        chartInterval={CHART_INTERVALS[chartIntervalIdx].value}
        onPriceChange={handlePrice}
        currencySymbol={sym}
        activeEntries={chartEntries.filter(e => !!e.isReal === isReal)}
        onPanChange={setIsPanned}
        onZoomChange={handleZoom}
        showBollinger={showBollinger}
        showMA={showMA}
        chartType={chartType}
        onCandlesChange={setChartCandles}
        onRealDataChange={setIsLiveData}
        onLoadingChange={setChartLoading}
        goLiveKey={goLiveKey}
        drawings={drawings}
        onDrawingsChange={handleDrawingsChange}
        onDeleteDrawing={handleDeleteDrawing}
      />
      <ChartNotification notif={chartToast} />
      <AnimatePresence>
        {isPanned && (
          <motion.button
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black text-black"
            style={{ background: "linear-gradient(135deg,#FF6B00,#FF9500)", boxShadow: "0 4px 14px rgba(255,107,0,0.4)" }}
            onClick={() => { setGoLiveKey(k => k + 1); setIsPanned(false); }}
          >
            ● CANLI
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  const controlsProps = {
    asset, tf, setTf, amount, setAmount: setAmountPersist, price, expiryTimeStr,
    displayBalance, chartToast, onTrade: handleTrade, balanceWarn, chartLoading,
    currency, minAmount, tradeBlocked,
  };

  /* ── Mobile Landscape / Rotated view ────────────────────────────────────── */
  if (isMobile && (isLandscape || viewportDims.w > viewportDims.h)) {
    const isPortraitViewport = viewportDims.w <= viewportDims.h;
    const cs = currency === "TL" ? "₺" : "$";
    const step = currency === "TL" ? 10 : 5;
    const totalReturn = (amount * (1 + asset.payout / 100)).toFixed(2);

    return (
      <>
        <h1 className="sr-only">Obyo Option — Forex ve OTC İkili Opsiyon Trading Platformu</h1>
        <div
          style={isPortraitViewport ? {
            position: "fixed",
            top: 0,
            left: `${viewportDims.w}px`,
            width: `${viewportDims.h}px`,
            height: `${viewportDims.w}px`,
            transform: "rotate(90deg)",
            transformOrigin: "top left",
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          } : {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <div className="flex h-9 shrink-0 items-center justify-between px-2.5 bg-black gap-2">
            {/* Left: Rotate back to portrait + Asset picker */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={handleToggleOrientation}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1c1c1c] border border-white/10 hover:bg-white/15 text-white transition-colors shrink-0"
                title="Ekranı Dik Çevir"
              >
                <RotateCw size={12} className="text-white" />
                <span className="text-[10.5px] font-bold text-white">Dik Çevir</span>
              </button>

              <AssetTabBar
                openAssets={openAssets}
                activeAsset={asset}
                onSelectAsset={handleAsset}
                onOpenAssetSheet={() => setShowAssets(true)}
                onCloseTab={handleCloseTab}
                compact
              />
            </div>

            {/* Right: Quick intervals, indicators, balance, live badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Interval */}
              <div className="flex items-center rounded-lg bg-[#161616] border border-white/10 p-0.5">
                {CHART_INTERVALS.slice(0, 4).map((ci, i) => (
                  <button
                    key={ci.value}
                    onClick={() => setChartIntervalIdx(i)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${chartIntervalIdx === i ? "bg-[#4DA2FF] text-black" : "text-white/40 hover:text-white"}`}
                  >
                    {ci.label}
                  </button>
                ))}
              </div>

              {/* Chart type */}
              <button
                onClick={() => setChartType(t => t === "candle" ? "line" : "candle")}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161616] border border-white/10 text-white/50 hover:text-white"
                title="Grafik Tipi"
              >
                {chartType === "candle" ? <CandlestickChart size={13} color="#ffffff" /> : <LineChart size={13} color="#ffffff" />}
              </button>

              {/* Indicators */}
              <button
                onClick={() => setShowBollinger(v => !v)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${showBollinger ? "bg-[#4DA2FF]/20 text-[#4DA2FF] border-[#4DA2FF]/40" : "text-white/40 border-white/10"}`}
              >
                BB
              </button>
              <button
                onClick={() => setShowRSI(v => !v)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${showRSI ? "bg-[#FF9500]/20 text-[#FF9500] border-[#FF9500]/40" : "text-white/40 border-white/10"}`}
              >
                RSI
              </button>
              <button
                onClick={() => setShowDrawingTools(true)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-colors ${drawings.length > 0 ? "bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/40" : "text-white/40 border-white/10 hover:text-white"}`}
                title="Çizim Araçları (Dikey, Yatay, Çapraz)"
              >
                <Pencil size={11} />
                {drawings.length > 0 && <span>{drawings.length}</span>}
              </button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              {/* Balance */}
              <AnimatedBalance
                value={displayBalance}
                currency={currency}
                className="text-xs font-bold text-white tracking-tight"
              />
            </div>
          </div>

          {/* Main area: Chart on Left, Trade on Right */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-1 min-w-0 flex-col overflow-hidden relative">
              {chartArea}
              {showRSI && (
                <div className="shrink-0 overflow-hidden h-14 border-t border-white/10">
                  <RSIPanel candles={chartCandles} />
                </div>
              )}
            </div>

            {/* Right side compact trade panel */}
            <div className="w-[165px] shrink-0 border-l border-white/10 bg-[#0c0c0c] flex flex-col justify-between p-2 gap-1.5 overflow-y-auto">
              {/* Amount */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[9.5px] font-bold text-white/40 uppercase">
                  <span>Tutar</span>
                  <span>{currency}</span>
                </div>
                <div className="flex items-center rounded-lg bg-[#181818] border border-white/10 p-0.5">
                  <button
                    onClick={() => setAmountPersist(Math.max(minAmount, amount - step))}
                    className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white rounded bg-white/5 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value.replace(",", "."));
                      if (!isNaN(n)) setAmountPersist(n);
                    }}
                    onBlur={() => {
                      if (amount < minAmount || isNaN(amount)) {
                        setAmountPersist(minAmount);
                      }
                    }}
                    className="w-full text-center font-bold text-white text-xs bg-transparent outline-none tabular-nums"
                  />
                  <button
                    onClick={() => setAmountPersist(amount + step)}
                    className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white rounded bg-white/5 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Expiry Duration */}
              <div className="flex flex-col gap-0.5 relative">
                <div className="text-[9.5px] font-bold text-white/40 uppercase">Vade Süresi</div>
                <button
                  onClick={() => setShowDurationLandscape(v => !v)}
                  className="flex items-center justify-between rounded-lg bg-[#181818] border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                >
                  <span className="font-bold text-white text-xs">{tf.label}</span>
                  <ChevronDown size={11} className="text-white/40" />
                </button>

                {showDurationLandscape && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 rounded-xl bg-[#1c1c1c] border border-white/10 p-1.5 shadow-2xl flex flex-col gap-0.5 w-32">
                    {TIMEFRAMES.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => { setTf(t); setShowDurationLandscape(false); }}
                        className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${t.label === tf.label ? "bg-[#FF6B00] text-black" : "text-white/70 hover:bg-white/5"}`}
                      >
                        <span>{t.label}</span>
                        <span className="text-[9px] opacity-60">({t.secs}s)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payout */}
              <div className="flex items-center justify-between text-[10px] px-1 font-bold">
                <span className="text-white/40">Getiri:</span>
                <span className="text-[#0ecb81]">+{cs}{totalReturn}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleTrade("UP")}
                  disabled={balanceWarn || chartLoading || tradeBlocked}
                  className="flex flex-col items-center justify-center rounded-xl py-2 gap-0.5 text-white font-black transition-opacity"
                  style={{
                    background: "linear-gradient(135deg, #0ecb81, #059669)",
                    boxShadow: "0 3px 10px rgba(14,203,129,0.3)",
                    opacity: (balanceWarn || chartLoading || tradeBlocked) ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <TrendingUp size={13} />
                    <span className="text-xs">{t.upBtn}</span>
                  </div>
                  <span className="text-[9px] font-bold opacity-80">+{asset.payout}%</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleTrade("DOWN")}
                  disabled={balanceWarn || chartLoading || tradeBlocked}
                  className="flex flex-col items-center justify-center rounded-xl py-2 gap-0.5 text-white font-black transition-opacity"
                  style={{
                    background: "linear-gradient(135deg, #f6465d, #dc2626)",
                    boxShadow: "0 3px 10px rgba(246,70,93,0.3)",
                    opacity: (balanceWarn || chartLoading || tradeBlocked) ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <TrendingDown size={13} />
                    <span className="text-xs">{t.downBtn}</span>
                  </div>
                  <span className="text-[9px] font-bold opacity-80">+{asset.payout}%</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <AssetSheet visible={showAssets} current={asset} onSelect={handleSelectFromSheet} onClose={() => setShowAssets(false)} />
        <Tutorial />
        <AuthPrompt show={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} onNavigate={() => navigate("/auth")} />
        <DrawingToolsModal
          show={showDrawingTools}
          onClose={() => setShowDrawingTools(false)}
          drawings={drawings}
          onAddDrawing={handleAddDrawing}
          onRemoveDrawing={handleDeleteDrawing}
          onClearAll={handleClearDrawings}
          currentPrice={price}
        />
      </>
    );
  }

  /* ── Mobile ─────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <>
      <h1 className="sr-only">Obyo Option — Forex ve OTC İkili Opsiyon Trading Platformu</h1>
      <div className="flex h-full flex-col overflow-hidden" style={{ background: "#000" }}>
          {/* Asset bar — compact horizontal */}
          <div className="relative flex h-8 shrink-0 items-center justify-between gap-1.5 px-2 bg-black" data-tour="step-1">
            <div className="flex items-center min-w-0 overflow-x-auto no-scrollbar">
              <AssetTabBar
                openAssets={openAssets}
                activeAsset={asset}
                onSelectAsset={handleAsset}
                onOpenAssetSheet={() => setShowAssets(true)}
                onCloseTab={handleCloseTab}
                compact
              />
            </div>
          </div>

          {/* Chart — takes all remaining space */}
          {chartArea}

          {/* Active trades bar */}
          <AnimatePresence>
            {activeTrades.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="shrink-0 flex items-center gap-2 px-3 overflow-hidden"
                style={{ background: "rgba(255,107,0,0.06)" }}
              >
                <div className="py-1.5 flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-black text-[#FF9500]">● {activeTrades.length} AKTİF İŞLEM</span>
                  <div className="flex gap-1">
                    {activeTrades.slice(0, 6).map(t => (
                      <span key={t.id} className={`text-[9px] font-bold rounded px-1 ${t.direction === "UP" ? "text-[#0ecb81] bg-[#0ecb81]/10" : "text-[#f6465d] bg-[#f6465d]/10"}`}>
                        {t.direction === "UP" ? "▲" : "▼"}
                      </span>
                    ))}
                    {activeTrades.length > 6 && <span className="text-[9px] text-white/25">+{activeTrades.length - 6}</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RSI panel */}
          <AnimatePresence>
            {showRSI && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 56, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="shrink-0 overflow-hidden"
              >
                <RSIPanel candles={chartCandles} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade panel */}
          <div className="shrink-0">
            <MobileTradePanel
              asset={asset} tf={tf} setTf={setTf}
              amount={amount} setAmount={setAmountPersist}
              displayBalance={displayBalance}
              onTrade={handleTrade}
              balanceWarn={balanceWarn}
              chartLoading={chartLoading}
              currency={currency}
              minAmount={minAmount}
              tradeBlocked={tradeBlocked}
              showRSI={showRSI} onToggleRSI={() => setShowRSI(v => !v)}
              showBollinger={showBollinger} onToggleBollinger={() => setShowBollinger(v => !v)}
              showMA={showMA} onToggleMA={() => setShowMA(v => !v)}
              chartType={chartType} onToggleChartType={() => setChartType(t => t === "candle" ? "line" : "candle")}
              chartIntervalIdx={chartIntervalIdx} onChartIntervalChange={setChartIntervalIdx}
              isLiveData={isLiveData}
              isLandscape={isLandscape}
              onToggleOrientation={handleToggleOrientation}
              drawings={drawings}
              onOpenDrawings={() => setShowDrawingTools(true)}
            />
          </div>
        </div>

        <AssetSheet visible={showAssets} current={asset} onSelect={handleSelectFromSheet} onClose={() => setShowAssets(false)} />
        <Tutorial />
        <AuthPrompt show={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} onNavigate={() => navigate("/auth")} />
        <DrawingToolsModal
          show={showDrawingTools}
          onClose={() => setShowDrawingTools(false)}
          drawings={drawings}
          onAddDrawing={handleAddDrawing}
          onRemoveDrawing={handleDeleteDrawing}
          onClearAll={handleClearDrawings}
          currentPrice={price}
        />
      </>
    );
  }

  /* ── Desktop ────────────────────────────────────────────────────────────── */
  return (
    <>
    <h1 className="sr-only">Obyo Option — Forex ve OTC İkili Opsiyon Trading Platformu</h1>
    <div className="flex h-full overflow-hidden" style={{ background: "#000" }}>

        {/* ── Chart column ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">

          {/* Desktop Asset bar + Mobile-style compact toolbar (no scrollbar) */}
          <div className="flex h-11 shrink-0 items-center justify-between px-3 bg-black border-b border-white/5">
            {/* Left: Asset Tabs */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <AssetTabBar
                openAssets={openAssets}
                activeAsset={asset}
                onSelectAsset={handleAsset}
                onOpenAssetSheet={() => setShowAssets(true)}
                onCloseTab={handleCloseTab}
              />
            </div>

            {/* Right: Mobile-style compact toolbar (No scrollbar, exact mobile aesthetics) */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Chart Interval Button */}
              <button
                onClick={() => setShowIntervalModal(true)}
                className="flex h-8 px-2.5 items-center justify-center rounded-[10px] bg-[#1c1c1c] border border-white/10 text-xs font-black text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer select-none"
                title="Grafik Zaman Aralığı"
              >
                {CHART_INTERVALS[chartIntervalIdx]?.label || "5sn"}
              </button>

              {/* Indicators (SlidersHorizontal) */}
              <button
                onClick={() => setShowIndicatorsModal(true)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] border transition-all cursor-pointer ${
                  activeIndicatorCount > 0
                    ? "bg-[#4DA2FF]/20 border-[#4DA2FF]/50 text-[#4DA2FF]"
                    : "bg-[#1c1c1c] border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                }`}
                title="Göstergeler (RSI, Bollinger Bantları, Hareketli Ortalama)"
              >
                <SlidersHorizontal size={14} />
                {activeIndicatorCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#4DA2FF]" />
                )}
              </button>

              {/* Chart Type Toggle (Candle / Line) */}
              <button
                onClick={() => setChartType(t => t === "candle" ? "line" : "candle")}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#1c1c1c] border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                title={chartType === "candle" ? "Çizgi Grafiğine Geç" : "Mum Grafiğine Geç"}
              >
                {chartType === "candle" ? (
                  <CandlestickChart size={15} />
                ) : (
                  <LineChart size={15} />
                )}
              </button>

              {/* Drawing Tools (Pencil) */}
              <button
                onClick={() => setShowDrawingTools(true)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] border transition-all cursor-pointer ${
                  drawings.length > 0
                    ? "bg-[#FFB800]/20 border-[#FFB800]/50 text-[#FFB800]"
                    : "bg-[#1c1c1c] border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                }`}
                title="Çizim Araçları (Dikey, Yatay, Trend Çizgileri)"
              >
                <Pencil size={14} />
                {drawings.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
                )}
              </button>
            </div>
          </div>

          {/* Chart area fills remaining vertical space down to screen bottom */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {chartArea}
          </div>

          {/* RSI indicator sub-panel if toggled */}
          {showRSI && (
            <div className="shrink-0 border-t border-white/10">
              <RSIPanel candles={chartCandles} />
            </div>
          )}
        </div>

        {/* ── Panel collapse tab ──────────────────────────────────────────── */}
        <button
          onClick={() => setShowPanel(v => !v)}
          className="flex w-5 shrink-0 items-center justify-center border-l border-white/5 bg-[#050505] text-white/20 hover:text-[#FF6B00] hover:bg-white/3 transition-colors"
          title={showPanel ? "Paneli Gizle" : "Paneli Göster"}
        >
          {showPanel ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* ── Right control panel (collapsible) ───────────────────────────── */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              key="trade-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 284, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="flex shrink-0 flex-col border-l border-white/5 bg-[#050505] overflow-y-auto overflow-x-hidden"
              style={{ minWidth: 0 }}
            >
              <div style={{ minWidth: 284 }}>
                <div className="flex h-11 items-center border-b border-white/5 px-4">
                  <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">İşlem Aç</h3>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  {/* Asset info card */}
                  <div className="rounded-xl p-3 border border-white/6 bg-black">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 shadow-inner">
                        {renderAssetFlag(asset, 24)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{asset.label}</p>
                        <p className="text-[11px] text-white/35">{asset.desc}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-black text-[#0ecb81]">{asset.payout}%</p>
                        <p className="text-[9px] text-white/25">Payout</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAssets(true)}
                      className="w-full rounded-lg py-1.5 text-xs font-bold border border-white/8 text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors">
                      Varlık Değiştir ↓
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="rounded-xl bg-black border border-white/6 p-3" data-tour="step-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Tutar</span>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setAmountPersist(a => Math.max(minAmount, a - (currency === "TL" ? 10 : 5)))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/50 hover:bg-white/10">
                        <Minus size={12} />
                      </button>
                      <span className="text-[10px] text-[#FF6B00] font-bold">{currency === "TL" ? "₺" : "$"}</span>
                      <span className="flex-1 text-center text-xl font-black text-white">{amount}</span>
                      <button onClick={() => setAmountPersist(a => Math.min(displayBalance, a + (currency === "TL" ? 10 : 5)))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/50 hover:bg-white/10">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {(currency === "TL" ? [50, 100, 250, 500] : [10, 25, 50, 100]).map((v) => (
                        <button key={v} onClick={() => setAmountPersist(v)}
                          className={`flex-1 rounded-lg py-1 text-xs font-bold transition-colors ${amount === v ? "bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/25" : "bg-white/3 text-white/30 border border-white/6 hover:bg-white/6"}`}>
                          {currency === "TL" ? "₺" : "$"}{v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiry (Aligned & Matching Amount card design) */}
                  <div className="rounded-xl bg-black border border-white/6 p-3" data-tour="step-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Süre</span>
                      <span className="text-[10px] font-bold text-[#FF6B00]">{tfSubLabel(tf.secs)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          const curIdx = TIMEFRAMES.findIndex(t => t.label === tf.label);
                          if (curIdx > 0) setTf(TIMEFRAMES[curIdx - 1]);
                        }}
                        disabled={TIMEFRAMES.findIndex(t => t.label === tf.label) === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/50 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Daha Kısa Süre"
                      >
                        <Minus size={12} />
                      </button>
                      <div className="flex-1 flex items-center justify-center gap-1.5">
                        <Clock size={14} className="text-[#FF6B00]" />
                        <span className="text-xl font-black text-white">{tf.label}</span>
                      </div>
                      <button
                        onClick={() => {
                          const curIdx = TIMEFRAMES.findIndex(t => t.label === tf.label);
                          if (curIdx < TIMEFRAMES.length - 1) setTf(TIMEFRAMES[curIdx + 1]);
                        }}
                        disabled={TIMEFRAMES.findIndex(t => t.label === tf.label) === TIMEFRAMES.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/50 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Daha Uzun Süre"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {TIMEFRAMES.slice(0, 4).map(t => (
                        <button
                          key={t.label}
                          onClick={() => setTf(t)}
                          className={`rounded-lg py-1 text-xs font-bold transition-colors ${
                            t.label === tf.label
                              ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/35 font-black"
                              : "bg-white/3 text-white/30 border border-white/6 hover:bg-white/6 hover:text-white/60"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {TIMEFRAMES.slice(4).map(t => (
                        <button
                          key={t.label}
                          onClick={() => setTf(t)}
                          className={`rounded-lg py-1 text-xs font-bold transition-colors ${
                            t.label === tf.label
                              ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/35 font-black"
                              : "bg-white/3 text-white/30 border border-white/6 hover:bg-white/6 hover:text-white/60"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payout preview */}
                  <div className="rounded-xl bg-black border border-white/6 p-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wide">Potansiyel Kazanç</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-black text-[#0ecb81]">+{currency === "TL" ? "₺" : "$"}{(amount * (asset.payout / 100)).toFixed(2)}</span>
                      <span className="text-xs text-white/30">{asset.payout}% kazanç</span>
                    </div>
                  </div>

                  {/* Trade buttons */}
                  {balanceWarn && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(246,70,93,0.10)", border: "1px solid rgba(246,70,93,0.25)" }}>
                      <X size={12} className="text-[#f6465d] shrink-0" />
                      <span className="text-xs font-bold text-[#f6465d]">{t.insufficientBalance}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2" data-tour="step-4">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleTrade("UP")} disabled={tradeBlocked || balanceWarn || chartLoading}
                      className="flex items-center justify-center gap-2 rounded-xl py-4 text-white font-black disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#05a660,#0ecb81)", boxShadow: "0 4px 18px rgba(14,203,129,0.28)" }}>
                      <ArrowUp size={16} strokeWidth={3} />
                      <span className="text-base">{t.upBtn} · {currency === "TL" ? "₺" : "$"}{(amount * (asset.payout / 100)).toFixed(2)}</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleTrade("DOWN")} disabled={tradeBlocked || balanceWarn || chartLoading}
                      className="flex items-center justify-center gap-2 rounded-xl py-4 text-white font-black disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#c0283e,#f6465d)", boxShadow: "0 4px 18px rgba(246,70,93,0.28)" }}>
                      <ArrowDown size={16} strokeWidth={3} />
                      <span className="text-base">{t.downBtn} · {currency === "TL" ? "₺" : "$"}{(amount * (asset.payout / 100)).toFixed(2)}</span>
                    </motion.button>
                  </div>

                  {/* Active trades list */}
                  <AnimatePresence>
                    {activeTrades.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-white/40 uppercase">{t.activeTrades}</span>
                          <span className="text-[10px] font-black text-[#FF9500]">{liveTradeCount}/5</span>
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                          {activeTrades
                            .filter(t => t.startTime + t.duration * 1000 > now - 800)
                            .slice(0, 8)
                            .map(t => {
                              const expiry = t.startTime + t.duration * 1000;
                              const rem = Math.max(0, expiry - now);
                              const progress = Math.max(0, Math.min(1, rem / (t.duration * 1000)));
                              const isUp = t.direction === "UP";
                              const accent = isUp ? "#0ecb81" : "#f6465d";
                              const urgent = rem < 10_000;
                              return (
                                <div key={t.id} className="rounded-xl overflow-hidden"
                                  style={{
                                    background: isUp ? "rgba(14,203,129,0.06)" : "rgba(246,70,93,0.06)",
                                    border: `1px solid ${isUp ? "rgba(14,203,129,0.18)" : "rgba(246,70,93,0.18)"}`,
                                  }}>
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black" style={{ color: accent }}>
                                        {isUp ? "▲" : "▼"}
                                      </span>
                                      <div>
                                        <p className="text-[11px] font-black text-white/80">
                                          {price < 10 ? t.startPrice.toFixed(5) : t.startPrice.toFixed(2)}
                                        </p>
                                        <p className="text-[9px] text-white/30 font-mono">{currency === "TL" ? "₺" : "$"}{t.amount}</p>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-black font-mono"
                                      style={{ color: urgent ? "#FFB800" : accent }}>
                                      {Math.ceil(rem / 1000)}s
                                    </span>
                                  </div>
                                  <div className="h-[2px] w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <div className="h-full transition-all duration-1000"
                                      style={{ width: `${progress * 100}%`, background: urgent ? "#FFB800" : accent }} />
                                  </div>
                                </div>
                              );
                            })}
                          {activeTrades.filter(t => t.startTime + t.duration * 1000 > now - 800).length > 8 && (
                            <p className="text-[10px] text-white/25 text-center py-1">
                              +{activeTrades.filter(t => t.startTime + t.duration * 1000 > now - 800).length - 8} daha
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AssetSheet visible={showAssets} current={asset} onSelect={handleSelectFromSheet} onClose={() => setShowAssets(false)} />
      <Tutorial />
      <AuthPrompt show={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} onNavigate={() => navigate("/auth")} />
      <DrawingToolsModal
        show={showDrawingTools}
        onClose={() => setShowDrawingTools(false)}
        drawings={drawings}
        onAddDrawing={handleAddDrawing}
        onRemoveDrawing={handleDeleteDrawing}
        onClearAll={handleClearDrawings}
        currentPrice={price}
      />
      <IndicatorsModal
        visible={showIndicatorsModal}
        onClose={() => setShowIndicatorsModal(false)}
        showMA={showMA}
        onToggleMA={() => setShowMA(v => !v)}
        showBollinger={showBollinger}
        onToggleBollinger={() => setShowBollinger(v => !v)}
        showRSI={showRSI}
        onToggleRSI={() => setShowRSI(v => !v)}
      />
      <ChartIntervalModal
        visible={showIntervalModal}
        onClose={() => setShowIntervalModal(false)}
        chartIntervalIdx={chartIntervalIdx}
        onSelectInterval={setChartIntervalIdx}
      />
    </>
  );
}
