import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Clock,
  TrendingUp,
  BarChart2,
  LineChart,
  CandlestickChart,
  SlidersHorizontal,
  Pencil,
  Radio,
  Search,
  X,
  ChevronDown,
  Zap,
  History,
  Maximize2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AssetIcon } from "@/lib/asset-icons";
import { livePriceRegistry } from "@/context/DemoAccountContext";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface DesktopAssetItem {
  label: string;
  icon?: string;
  flag?: string;
  payout: number;
  base: number;
  color?: string;
  desc?: string;
  digits: number;
}

export interface DesktopTimeframe {
  label: string;
  secs: number;
}

export interface DesktopActiveTrade {
  id: string;
  asset?: string;
  assetLabel?: string;
  direction: "UP" | "DOWN";
  amount: number;
  entryPrice?: number;
  startPrice?: number;
  expiryTime?: number;
  startTime?: number;
  duration?: number;
  payoutRate?: number;
}

export interface DesktopCompletedTrade {
  id: string;
  asset: string;
  direction: "UP" | "DOWN";
  amount: number;
  result: "WIN" | "LOSE";
  profit: number;
  closedAt: number;
  entryPrice?: number;
  exitPrice?: number;
}

/* ─── Format Helpers ─────────────────────────────────────────────────────── */
function fmtCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}d ${s}s`;
}

function fmtClock(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. DESKTOP ASSET MODAL (Searchable, Categorized, Table Screener)
   ═══════════════════════════════════════════════════════════════════════════ */
export function DesktopAssetModal({
  visible,
  current,
  assets,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: DesktopAssetItem;
  assets: DesktopAssetItem[];
  onSelect: (a: DesktopAssetItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "STOCKS" | "FOREX" | "HIGH_PAYOUT">("ALL");

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.label.toLowerCase().includes(q) ||
        (a.desc && a.desc.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeTab === "STOCKS") {
        return (a as any).category === "stocks" || (!a.label.includes("/") && a.label !== "Crypto IDX");
      }
      if (activeTab === "FOREX") {
        return (a as any).category === "forex" || a.label.includes("/");
      }
      if (activeTab === "HIGH_PAYOUT") {
        return a.payout >= 88;
      }
      return true;
    });
  }, [assets, search, activeTab]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-10 w-full max-w-2xl bg-[#0a0b0f] border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e0f14]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <BarChart2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Varlık & Piyasa Seçimi</h2>
                <p className="text-[11px] text-white/40">İşlem yapmak istediğiniz pariteyi seçin</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 border-b border-white/10 bg-[#0a0b0f] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Parite veya varlık ara (örn: AUD, OTC, USD)..."
                autoFocus
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#14151b] border border-white/10 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-[#181921] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 shrink-0 bg-[#14151b] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === "ALL" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Tümü ({assets.length})
              </button>
              <button
                onClick={() => setActiveTab("STOCKS")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === "STOCKS" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Hisseler / Şirketler
              </button>
              <button
                onClick={() => setActiveTab("FOREX")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === "FOREX" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Forex (OTC)
              </button>
              <button
                onClick={() => setActiveTab("HIGH_PAYOUT")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "HIGH_PAYOUT" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Sparkles size={11} className={activeTab === "HIGH_PAYOUT" ? "text-amber-500" : "text-amber-400"} />
                <span>%88+ Kazanç</span>
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-2.5 bg-[#0d0e13] text-[10px] font-bold uppercase tracking-wider text-white/40 border-b border-white/10">
            <div className="col-span-6">Varlık & Piyasa</div>
            <div className="col-span-3 text-right">Anlık Fiyat</div>
            <div className="col-span-3 text-right">Kâr Oranı</div>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 divide-y divide-white/[0.04]">
            {filteredAssets.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-white/40 font-medium">Aradığınız kriterlere uygun varlık bulunamadı.</p>
              </div>
            ) : (
              filteredAssets.map((item) => {
                const isActive = item.label === current.label;
                const liveP = livePriceRegistry[item.label] ?? item.base;

                return (
                  <div
                    key={item.label}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className={`grid grid-cols-12 items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                      isActive
                        ? "bg-white/10 border border-white/15 shadow-sm"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {/* Asset info */}
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 flex items-center justify-center shrink-0">
                        <AssetIcon label={item.label} size={24} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                            {item.label}
                          </span>
                          {item.label.includes("OTC") && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              OTC
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 truncate">{item.desc || "Forex / Kripto"}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-3 text-right">
                      <span className="font-mono text-xs font-bold text-white tracking-tight">
                        {liveP.toFixed(item.digits)}
                      </span>
                    </div>

                    {/* Payout */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <div className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-black">
                        +{item.payout}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#0d0e13] border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
            <span>Toplam {filteredAssets.length} varlık listeleniyor</span>
            <span className="font-medium">Hızlı geçiş için satıra tıklayın</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. PRO DESKTOP TRADING STATION (Side Order Panel with 3 Tabs)
   ═══════════════════════════════════════════════════════════════════════════ */
export function DesktopTradeStation({
  asset,
  price,
  tf,
  setTf,
  timeframes,
  amount,
  setAmount,
  amountStr,
  setAmountStr,
  commitAmount,
  displayBalance,
  onTrade,
  balanceWarn,
  chartLoading,
  currency,
  minAmount,
  tradeBlocked,
  currencySymbol,
  activeTrades,
  completedTrades,
  onOpenAssetModal,
  onOpenHistory,
}: {
  asset: DesktopAssetItem;
  price: number;
  tf: DesktopTimeframe;
  setTf: (t: DesktopTimeframe) => void;
  timeframes: DesktopTimeframe[];
  amount: number;
  setAmount: (fn: (prev: number) => number) => void;
  amountStr: string;
  setAmountStr: (s: string) => void;
  commitAmount: (val: string) => void;
  displayBalance: number;
  onTrade: (dir: "UP" | "DOWN") => void;
  balanceWarn: boolean;
  chartLoading: boolean;
  currency: string;
  minAmount: number;
  tradeBlocked: boolean;
  currencySymbol: string;
  activeTrades: DesktopActiveTrade[];
  completedTrades: DesktopCompletedTrade[];
  onOpenAssetModal: () => void;
  onOpenHistory: () => void;
}) {
  const [panelTab, setPanelTab] = useState<"TRADE" | "ACTIVE" | "HISTORY">("TRADE");

  const sym = currencySymbol;
  const netProfit = (amount * (asset.payout / 100)).toFixed(2);
  const totalReturn = (amount * (1 + asset.payout / 100)).toFixed(2);
  const step = currency === "TL" ? 10 : 5;

  // Multiplier helpers
  const handleHalf = () => setAmount((a) => Math.max(minAmount, Math.floor(a / 2)));
  const handleDouble = () => setAmount((a) => Math.min(displayBalance, a * 2));
  const handleMax = () => setAmount(() => Math.floor(displayBalance));
  const handleAddDelta = (delta: number) => setAmount((a) => Math.min(displayBalance, a + delta));

  // Quick presets depending on currency
  const presets = currency === "TL" ? [50, 100, 250, 500, 1000] : [10, 25, 50, 100, 250];

  // Expiry Steppers
  const currentTfIdx = timeframes.findIndex((item) => item.secs === tf.secs);
  const handlePrevTf = () => {
    if (currentTfIdx > 0) setTf(timeframes[currentTfIdx - 1]);
  };
  const handleNextTf = () => {
    if (currentTfIdx < timeframes.length - 1) setTf(timeframes[currentTfIdx + 1]);
  };

  const expiryClockTime = fmtClock(Date.now() + tf.secs * 1000);

  return (
    <aside className="w-[340px] xl:w-[360px] 2xl:w-[380px] shrink-0 h-full border-l border-white/10 bg-black flex flex-col justify-between overflow-hidden z-20 select-none">
      {/* ── Top Bar: Asset Badge + Payout Pill ── */}
      <div className="p-3 border-b border-white/10 bg-[#0b0c10] shrink-0">
        <div
          onClick={onOpenAssetModal}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#121318] border border-white/10 hover:border-white/20 hover:bg-[#181920] transition-all cursor-pointer group"
          title="Varlık Değiştir (Tıklayın)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 flex items-center justify-center shrink-0">
              <AssetIcon label={asset.label} size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                  {asset.label}
                </span>
                <ChevronDown size={12} className="text-white/40 group-hover:text-white" />
              </div>
              <p className="text-[10px] text-white/40 truncate">{asset.desc || "Forex & OTC"}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-xs font-bold text-white block">
              {price.toFixed(asset.digits)}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              +{asset.payout}% KÂR
            </span>
          </div>
        </div>

        {/* ── Tabs: [İşlem Yap] | [Açık İşlemler] | [Geçmiş] ── */}
        <div className="flex items-center gap-1 mt-2.5 p-1 rounded-xl bg-[#0b0c10] border border-white/10">
          <button
            onClick={() => setPanelTab("TRADE")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              panelTab === "TRADE"
                ? "bg-white text-black font-black shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Zap size={13} />
            <span>İşlem</span>
          </button>

          <button
            onClick={() => setPanelTab("ACTIVE")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              panelTab === "ACTIVE"
                ? "bg-white text-black font-black shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <TrendingUp size={13} />
            <span>Açık</span>
            {activeTrades.length > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#FF6B00] text-[9px] font-black text-white flex items-center justify-center">
                {activeTrades.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setPanelTab("HISTORY")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              panelTab === "HISTORY"
                ? "bg-white text-black font-black shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <History size={13} />
            <span>Geçmiş</span>
          </button>
        </div>
      </div>

      {/* ── Body based on Tab ── */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 flex flex-col gap-3">
        {panelTab === "TRADE" && (
          <>
            {/* 1. Time / Expiry Card */}
            <div className="p-3 rounded-2xl bg-[#121318] border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Vade / Süre
                </span>
                <span className="font-mono text-[10px] font-bold text-white/60">
                  Bitiş: {expiryClockTime}
                </span>
              </div>

              {/* Stepper Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTf}
                  disabled={currentTfIdx <= 0}
                  className="h-8 w-8 rounded-lg bg-[#1a1b22] hover:bg-[#22242e] disabled:opacity-30 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Minus size={14} />
                </button>

                <div className="flex-1 h-8 rounded-lg bg-[#0b0c10] border border-white/10 flex items-center justify-center font-black text-sm text-white">
                  <Clock size={13} className="mr-1.5 text-white/50" />
                  <span>{tf.label}</span>
                </div>

                <button
                  onClick={handleNextTf}
                  disabled={currentTfIdx >= timeframes.length - 1}
                  className="h-8 w-8 rounded-lg bg-[#1a1b22] hover:bg-[#22242e] disabled:opacity-30 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Grid Presets */}
              <div className="grid grid-cols-4 gap-1.5 mt-0.5">
                {timeframes.map((item) => {
                  const isSel = item.secs === tf.secs;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setTf(item)}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isSel
                          ? "bg-white text-black shadow-md scale-[1.02]"
                          : "bg-[#181920] text-white/50 hover:bg-[#22242d] hover:text-white border border-white/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Investment Amount Card */}
            <div className="p-3 rounded-2xl bg-[#121318] border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Yatırım Tutarı
                </span>
                <span className="text-[10px] font-semibold text-white/40">
                  Min: {sym}{minAmount}
                </span>
              </div>

              {/* Amount Input with Steppers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmount((a) => Math.max(minAmount, a - step))}
                  className="h-10 w-10 rounded-xl bg-[#1a1b22] hover:bg-[#22242e] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Minus size={16} />
                </button>

                <div className="flex-1 h-10 px-3 rounded-xl bg-[#0b0c10] border border-white/10 flex items-center justify-center font-black text-xl text-white">
                  <span className="text-white/40 mr-1 text-base">{sym}</span>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    onBlur={() => commitAmount(amountStr)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitAmount(amountStr);
                    }}
                    className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-black text-white text-lg p-0"
                  />
                </div>

                <button
                  onClick={() => setAmount((a) => Math.min(displayBalance, a + step))}
                  className="h-10 w-10 rounded-xl bg-[#1a1b22] hover:bg-[#22242e] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Pro Multipliers (½, 2X, Delta, Max) */}
              <div className="grid grid-cols-4 gap-1.5 mt-0.5">
                <button
                  onClick={handleHalf}
                  className="py-1 rounded-lg bg-[#1a1b22] hover:bg-[#242632] text-[11px] font-bold text-white/70 hover:text-white transition-colors"
                >
                  ½
                </button>
                <button
                  onClick={handleDouble}
                  className="py-1 rounded-lg bg-[#1a1b22] hover:bg-[#242632] text-[11px] font-bold text-white/70 hover:text-white transition-colors"
                >
                  2X
                </button>
                <button
                  onClick={() => handleAddDelta(currency === "TL" ? 100 : 25)}
                  className="py-1 rounded-lg bg-[#1a1b22] hover:bg-[#242632] text-[11px] font-bold text-white/70 hover:text-white transition-colors"
                >
                  +{currency === "TL" ? "100" : "25"}
                </button>
                <button
                  onClick={handleMax}
                  className="py-1 rounded-lg bg-[#1a1b22] hover:bg-[#242632] text-[11px] font-bold text-white/70 hover:text-white transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Currency Presets */}
              <div className="grid grid-cols-5 gap-1 mt-0.5">
                {presets.map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(() => val)}
                    className={`py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      amount === val
                        ? "bg-[#FF6B00] text-black font-black"
                        : "bg-[#181920] text-white/50 hover:bg-[#22242e] hover:text-white border border-white/5"
                    }`}
                  >
                    {sym}{val}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Profit Matrix */}
            <div className="p-3 rounded-2xl bg-[#121318] border border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 font-medium">Ödeme Oranı:</span>
                <span className="font-bold text-white">%{asset.payout}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 font-medium">Net Kazanç:</span>
                <span className="font-black text-emerald-400 text-sm">
                  +{sym}{netProfit}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                <span className="text-white/50 font-semibold">Toplam Dönüş:</span>
                <span className="font-black text-white text-sm">
                  {sym}{totalReturn}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ACTIVE TRADES TAB */}
        {panelTab === "ACTIVE" && (
          <div className="flex flex-col gap-2">
            {activeTrades.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-2">
                  <TrendingUp size={20} />
                </div>
                <p className="text-xs font-bold text-white/70">Açık Pozisyon Yok</p>
                <p className="text-[10px] text-white/40 mt-1 max-w-[200px]">
                  Yukarı veya Aşağı butonlarıyla anında yeni bir işlem başlatabilirsiniz.
                </p>
                <button
                  onClick={() => setPanelTab("TRADE")}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition-colors"
                >
                  İşlem Paneline Dön
                </button>
              </div>
            ) : (
              activeTrades.map((trade) => {
                const now = Date.now();
                const expiry =
                  trade.expiryTime ?? (trade.startTime ?? now) + (trade.duration ?? 30) * 1000;
                const rem = Math.max(0, expiry - now);
                const isUp = trade.direction === "UP";
                const startP = trade.entryPrice ?? trade.startPrice ?? price;
                const curP = livePriceRegistry[trade.asset || trade.assetLabel || asset.label] ?? price;
                const isWin = isUp ? curP >= startP : curP <= startP;
                const pRate = trade.payoutRate ?? asset.payout;

                return (
                  <div
                    key={trade.id}
                    className="p-3 rounded-xl bg-[#121318] border border-white/10 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isUp ? "▲ YUKARI" : "▼ AŞAĞI"}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {trade.assetLabel || trade.asset || asset.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-black text-white">
                        {sym}{trade.amount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-white/50">
                        <Clock size={11} />
                        <span className="font-mono">{fmtCountdown(rem)}</span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono text-xs font-black ${
                            isWin ? "text-emerald-400" : "text-white/40"
                          }`}
                        >
                          {isWin ? `+${sym}${(trade.amount * (1 + pRate / 100)).toFixed(2)}` : `${sym}0.00`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {panelTab === "HISTORY" && (
          <div className="flex flex-col gap-2">
            {completedTrades.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-2">
                  <History size={20} />
                </div>
                <p className="text-xs font-bold text-white/70">Geçmiş İşlem Yok</p>
                <p className="text-[10px] text-white/40 mt-1 max-w-[200px]">
                  Tamamlanan işlemler burada anlık olarak listelenecektir.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <span>Son İşlemler</span>
                  <button onClick={onOpenHistory} className="text-[#FF6B00] hover:underline cursor-pointer">
                    Tüm Geçmiş →
                  </button>
                </div>
                {completedTrades.slice(0, 10).map((tr) => {
                  const won = tr.result === "WIN";
                  return (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-xl bg-[#121318] border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            tr.direction === "UP" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {tr.direction === "UP" ? "▲" : "▼"}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{tr.asset}</p>
                          <span className="text-[9px] text-white/40 font-mono">
                            {sym}{tr.amount}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-black ${
                            won ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {won ? `+${sym}${tr.profit.toFixed(2)}` : `-${sym}${tr.amount}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Action Area: Call & Put Buttons ── */}
      <div className="p-3 border-t border-white/10 bg-[#0c0d11] flex flex-col gap-2 shrink-0">
        {/* Warning if any */}
        <AnimatePresence>
          {balanceWarn && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
            >
              <X size={13} className="shrink-0" />
              <span>Yetersiz Bakiye! Lütfen tutarı düşürün.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CALL BUTTON (YUKARI) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onTrade("UP")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          className="h-14 rounded-2xl flex items-center justify-between px-4 text-white font-black text-sm disabled:opacity-40 shadow-[0_8px_24px_rgba(14,203,129,0.25)] hover:shadow-[0_10px_30px_rgba(14,203,129,0.4)] cursor-pointer transition-all hover:brightness-110 active:brightness-95 group relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0ecb81, #059669)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-black/25 flex items-center justify-center text-white">
              <ArrowUp size={20} strokeWidth={3} />
            </div>
            <div className="text-left">
              <span className="text-sm font-black tracking-wide block leading-tight">YUKARI (CALL)</span>
              <span className="text-[9px] font-bold text-white/70 block">Kısayol: [W / ▲]</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black bg-black/30 px-2 py-1 rounded-lg block">
              +{asset.payout}%
            </span>
          </div>
        </motion.button>

        {/* PUT BUTTON (AŞAĞI) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onTrade("DOWN")}
          disabled={tradeBlocked || balanceWarn || chartLoading}
          className="h-14 rounded-2xl flex items-center justify-between px-4 text-white font-black text-sm disabled:opacity-40 shadow-[0_8px_24px_rgba(246,70,93,0.25)] hover:shadow-[0_10px_30px_rgba(246,70,93,0.4)] cursor-pointer transition-all hover:brightness-110 active:brightness-95 group relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f6465d, #dc2626)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-black/25 flex items-center justify-center text-white">
              <ArrowDown size={20} strokeWidth={3} />
            </div>
            <div className="text-left">
              <span className="text-sm font-black tracking-wide block leading-tight">AŞAĞI (PUT)</span>
              <span className="text-[9px] font-bold text-white/70 block">Kısayol: [S / ▼]</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black bg-black/30 px-2 py-1 rounded-lg block">
              +{asset.payout}%
            </span>
          </div>
        </motion.button>
      </div>
    </aside>
  );
}
