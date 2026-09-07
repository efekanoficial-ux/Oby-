import { useState, useCallback, useRef } from "react";
import { CandleChart } from "@/components/candle-chart";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AssetIcon } from "@/lib/asset-icons";

const ASSETS = [
  { label: "Crypto IDX", base: 6850.25 },
  { label: "AUD/CAD", base: 0.9080 },
  { label: "AUD/CHF", base: 0.5520 },
  { label: "AUD/DKK", base: 4.4200 },
  { label: "AUD/HUF", base: 233.50 },
  { label: "AUD/JPY", base: 97.20 },
  { label: "AUD/NOK", base: 6.9300 },
  { label: "AUD/NZD", base: 1.0820 },
  { label: "AUD/SEK", base: 6.9100 },
  { label: "AUD/SGD", base: 0.8650 },
  { label: "AUD/USD", base: 0.6600 },
  { label: "AUD/ZAR", base: 12.050 },
  { label: "CAD/CHF", base: 0.6080 },
];

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
            className="flex items-center gap-2 rounded-lg bg-[#161616] border border-[#222] px-3 py-1.5 text-sm font-bold text-white hover:border-white/20 transition-colors"
          >
            <AssetIcon label={asset.label} size={18} />
            {asset.label}
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-4 top-12 z-40 rounded-xl border border-[#222] bg-[#111] shadow-2xl overflow-hidden max-h-80 overflow-y-auto py-1"
              >
                {ASSETS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => { setAsset(a); setShowMenu(false); }}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-[#1a1a1a] transition-colors ${a.label === asset.label ? "text-[#0ecb81] bg-white/[0.03]" : "text-white"}`}
                  >
                    <AssetIcon label={a.label} size={20} />
                    {a.label}
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
