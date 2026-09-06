import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";

export interface ToastData {
  id: number;
  type: "open" | "close";
  direction: "UP" | "DOWN";
  asset: string;
  amount: number;
  payout?: number;
  won?: boolean;
}

interface Props {
  toast: ToastData | null;
}

export function TradeToast({ toast }: Props) {
  const isUp  = toast?.direction === "UP";
  const won   = toast?.won;
  const isOpen = toast?.type === "open";

  const accent = isOpen
    ? isUp ? "#0ecb81" : "#f6465d"
    : won  ? "#0ecb81" : "#f6465d";

  return (
    <AnimatePresence mode="wait">
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ y: -90, opacity: 0, scale: 0.88 }}
          animate={{ y: 0,   opacity: 1, scale: 1    }}
          exit={{   y: -90, opacity: 0, scale: 0.88 }}
          transition={{ type: "spring", stiffness: 520, damping: 36 }}
          className="fixed top-3 left-3 right-3 z-[999] overflow-hidden"
          style={{ pointerEvents: "none" }}
        >
          {/* Glass card */}
          <div
            className="relative flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(12,12,12,0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${accent}22`,
            }}
          >
            {/* Colored left stripe */}
            <div
              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
              style={{ backgroundColor: accent }}
            />

            {/* Icon bubble */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ml-1"
              style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}
            >
              {isOpen ? (
                isUp
                  ? <ArrowUp  size={18} strokeWidth={2.5} style={{ color: accent }} />
                  : <ArrowDown size={18} strokeWidth={2.5} style={{ color: accent }} />
              ) : (
                won
                  ? <TrendingUp  size={18} strokeWidth={2.5} style={{ color: accent }} />
                  : <TrendingDown size={18} strokeWidth={2.5} style={{ color: accent }} />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-black text-white leading-tight">
                  {isOpen
                    ? `İşlem Açıldı`
                    : won ? "Kazandınız! 🎉" : "İşlem Kapandı"}
                </span>
                {!isOpen && (
                  <span
                    className="text-[11px] font-black"
                    style={{ color: accent }}
                  >
                    {won ? `+$${toast.payout?.toFixed(2)}` : `-$${toast.amount}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-white/40">{toast.asset}</span>
                <span className="text-white/15">·</span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: accent }}
                >
                  {isUp ? "▲ YUKARI" : "▼ AŞAĞI"}
                </span>
                <span className="text-white/15">·</span>
                <span className="text-[11px] text-white/40">${toast.amount}</span>
              </div>
            </div>

            {/* Shimmer sweep */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${accent}12 50%, transparent 100%)`,
              }}
            />
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 2, ease: "linear", delay: 0.1 }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
            style={{ backgroundColor: accent }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
