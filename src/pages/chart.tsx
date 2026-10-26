import { useState, useCallback, useRef } from "react";
import { CandleChart } from "@/components/candle-chart";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AssetIcon } from "@/lib/asset-icons";

import { ASSETS } from "@/lib/assets";

export default function Chart() {
  const [asset, setAsset] = useState(ASSETS[0]);
  const [showMenu, setShowMenu] = useState(false);
  const [price, setPrice] = useState(ASSETS[0].base);
  const prevRef = useRef(ASSETS[0].base);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  const handlePrice = useCallback((p: number) => {
    if (Math.abs(p - prevRef.current) > 0.0001) {
      setDir(p > prevRef.current ? "up" : "down");
      setTimeout(() => setDir(null), 400);
      prevRef.current = p;
    }
    setPrice(p);
  }, []);

  return (
    <div className="flex h-full flex-col">
        {/* Asset bar */}
        <div className="relative flex h-12 shrink-0 items-center justify-between border-b border-[#1a1a1a] bg-[#0d0d0d] px-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-all cursor-pointer"
          >
            <AssetIcon label={asset.label} size={18} />
            <span>{asset.label}</span>
            <ChevronDown size={14} className="text-white/40" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="absolute left-4 top-14 z-40 rounded-2xl border border-white/10 bg-[#121318]/95 backdrop-blur-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto p-1.5 w-60 space-y-1"
              >
                {ASSETS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => { setAsset(a); setShowMenu(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      a.label === asset.label ? "text-[#1aa369] bg-white/[0.08]" : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AssetIcon label={a.label} size={18} />
                      <span>{a.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1aa369]">%{a.payout}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-end">
            <span className={`text-sm font-black font-mono ${dir === "up" ? "text-[#00C853]" : dir === "down" ? "text-[#FF1744]" : "text-white"}`}>
              {price < 10 ? price.toFixed(4) : price.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#00C853] font-semibold">Canlı</span>
          </div>
        </div>

        {/* Full screen chart */}
        <div className="flex-1 min-h-0">
          <CandleChart basePrice={asset.base} symbol={asset.label} onPriceChange={handlePrice} />
        </div>
      </div>
  );
}
