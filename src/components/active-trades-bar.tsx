import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { AssetIcon } from "@/lib/asset-icons";
import { livePriceRegistry } from "@/context/DemoAccountContext";

export interface ActiveTradeItem {
  id: string;
  assetLabel: string;
  direction: "UP" | "DOWN";
  amount: number;
  entryPrice?: number;
  entryTime: number;
  expiryTime: number;
  duration?: number;
  payoutRate?: number;
  mode?: "demo" | "real" | "tournament";
}

interface ActiveTradesBarProps {
  trades: ActiveTradeItem[];
  currencySymbol: string;
  currentPrice?: number;
  currentAsset?: string;
  onOpenHistory?: () => void;
  className?: string;
}

export function ActiveTradesBar({
  trades,
  currencySymbol,
  currentPrice,
  currentAsset,
  onOpenHistory,
  className = "",
}: ActiveTradesBarProps) {
  // Live tick state to keep countdowns and progress bars perfectly smooth
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (!trades || trades.length === 0) return null;

  return (
    <div className={`w-full flex flex-col gap-1.5 select-none ${className}`}>
      {/* Top micro bar for multiple trades or single status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-extrabold tracking-tight text-white/90">
            {trades.length === 1 ? "Aktif İşlem" : `Açık İşlemler (${trades.length})`}
          </span>
        </div>
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-0.5 text-[11px] font-bold text-white/60 hover:text-white transition-colors"
          >
            <span>Geçmiş</span>
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Trades Cards Container — Pristine Modern White */}
      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-0.5 snap-x">
        {trades.map((trade) => {
          const totalDuration = Math.max(
            1000,
            (trade.duration ? trade.duration * 1000 : trade.expiryTime - trade.entryTime)
          );
          const remainingMs = Math.max(0, trade.expiryTime - now);
          const remainingSecs = Math.ceil(remainingMs / 1000);
          const progress = Math.min(100, Math.max(0, (remainingMs / totalDuration) * 100));

          const mm = Math.floor(remainingSecs / 60);
          const ss = remainingSecs % 60;
          const timeText = mm > 0 ? `${mm}:${ss.toString().padStart(2, "0")}` : `${ss}s`;

          // Live price determination
          const livePrice =
            trade.assetLabel === currentAsset && currentPrice
              ? currentPrice
              : livePriceRegistry[trade.assetLabel] ?? trade.entryPrice ?? 0;

          const hasEntryPrice = trade.entryPrice !== undefined && trade.entryPrice > 0;
          const isWinning = hasEntryPrice
            ? trade.direction === "UP"
              ? livePrice >= (trade.entryPrice ?? 0)
              : livePrice <= (trade.entryPrice ?? 0)
            : false;

          const payoutRate = trade.payoutRate ?? 85;
          const potentialProfit = trade.amount * (payoutRate / 100);
          const totalReturn = trade.amount + potentialProfit;

          const isUp = trade.direction === "UP";

          return (
            <div
              key={trade.id}
              className={`relative flex-1 min-w-[270px] max-w-full rounded-2xl bg-white text-slate-900 border border-slate-200/90 shadow-xl shadow-black/20 p-3 transition-all duration-150 snap-center overflow-hidden`}
            >
              {/* Header row: Asset, Direction Badge & Countdown */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AssetIcon label={trade.assetLabel} size={22} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12.5px] font-black text-slate-900 truncate leading-tight">
                      {trade.assetLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      %{payoutRate} Getiri
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Direction Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-black ${
                      isUp
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-rose-50 text-rose-700 border border-rose-200/80"
                    }`}
                  >
                    {isUp ? (
                      <>
                        <ArrowUp size={11} strokeWidth={3} />
                        <span>YUKARI</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown size={11} strokeWidth={3} />
                        <span>AŞAĞI</span>
                      </>
                    )}
                  </span>

                  {/* Countdown pill */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-[11px] font-bold">
                    <Clock size={11} className="text-[#FF6B00]" />
                    <span>{timeText}</span>
                  </div>
                </div>
              </div>

              {/* Middle row: Investment & Potential Return */}
              <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-xl px-2.5 py-1.5">
                <div className="flex flex-col">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                    Yatırım
                  </span>
                  <span className="text-[12.5px] font-black text-slate-900 tabular-nums">
                    {currencySymbol}{trade.amount}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200/60" />

                <div className="flex flex-col items-end">
                  <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-400">
                    {hasEntryPrice ? (isWinning ? "Kârda" : "İşlemde") : "Beklenen Getiri"}
                  </span>
                  <span
                    className={`text-[12.5px] font-black tabular-nums ${
                      isWinning ? "text-emerald-600" : "text-slate-800"
                    }`}
                  >
                    +{currencySymbol}{totalReturn.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bottom Progress Bar: smooth remaining time */}
              <div className="mt-2.5 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ease-linear ${
                      isWinning ? "bg-emerald-500" : "bg-[#FF6B00]"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Desktop Chart Floating HUD (Modern White Edition) ─────────────────── */
export function DesktopActiveTradesHUD({
  trades,
  currencySymbol,
  currentPrice,
  currentAsset,
  onOpenHistory,
}: {
  trades: ActiveTradeItem[];
  currencySymbol: string;
  currentPrice?: number;
  currentAsset?: string;
  onOpenHistory?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  if (!trades || trades.length === 0) return null;

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 max-w-[340px]">
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white text-slate-900 border border-slate-200/90 shadow-2xl shadow-black/25 backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>

        <span className="text-xs font-black text-slate-900 whitespace-nowrap">
          {trades.length} Aktif İşlem
        </span>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {trades.slice(0, 3).map((tr) => {
            const isUp = tr.direction === "UP";
            const remSecs = Math.max(0, Math.ceil((tr.expiryTime - now) / 1000));
            return (
              <span
                key={tr.id}
                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                  isUp
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border-rose-200/80"
                }`}
              >
                {isUp ? "▲" : "▼"} {currencySymbol}{tr.amount}
                <span className="text-[9px] font-mono text-slate-500 font-bold ml-0.5">
                  {remSecs}s
                </span>
              </span>
            );
          })}
          {trades.length > 3 && (
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
              +{trades.length - 3}
            </span>
          )}
        </div>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="ml-auto text-[10.5px] font-bold text-[#FF6B00] hover:underline whitespace-nowrap"
          >
            Geçmiş
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar Active Trades (Modern White Edition) ───────────────── */
export function DesktopSidebarActiveTrades({
  trades,
  currencySymbol,
  currentPrice,
  currentAsset,
  onOpenHistory,
}: {
  trades: ActiveTradeItem[];
  currencySymbol: string;
  currentPrice?: number;
  currentAsset?: string;
  onOpenHistory?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  if (!trades || trades.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col gap-2 p-3 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-md">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            Açık İşlemler ({trades.length})
          </span>
        </div>
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="text-[10.5px] font-bold text-[#FF6B00] hover:underline"
          >
            Geçmiş →
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {trades.slice(0, 3).map((item) => {
          const isUp = item.direction === "UP";
          const remSecs = Math.max(0, Math.ceil((item.expiryTime - now) / 1000));
          const totalDuration = Math.max(
            1000,
            item.duration ? item.duration * 1000 : item.expiryTime - item.entryTime
          );
          const progress = Math.min(
            100,
            Math.max(0, ((item.expiryTime - now) / totalDuration) * 100)
          );

          return (
            <div
              key={item.id}
              className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-black ${
                      isUp
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isUp ? "▲ AL" : "▼ SAT"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {item.assetLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    {remSecs}s
                  </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {currencySymbol}{item.amount}
                  </span>
                </div>
              </div>

              {/* Micro progress bar */}
              <div className="h-1 w-full bg-slate-200/70 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-200 ease-linear ${
                    isUp ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}

        {trades.length > 3 && onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="text-[10px] text-center font-bold text-slate-500 hover:text-slate-900 py-0.5"
          >
            +{trades.length - 3} işlem daha göster
          </button>
        )}
      </div>
    </div>
  );
}
