import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
  isWidgetReady: boolean;
}

export function SplashScreen({ onComplete, isWidgetReady }: SplashScreenProps) {
  const [minDone, setMinDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2800;
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else setMinDone(true);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (minDone && isWidgetReady) {
      setVisible(false);
      setTimeout(onComplete, 600);
    }
  }, [minDone, isWidgetReady, onComplete]);

  const messages = ["Bağlanıyor...", "Grafik yükleniyor...", "Hazırlanıyor..."];
  const msgIdx = Math.min(2, Math.floor((progress / 100) * 3));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Outer ambient glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.05, 0.15],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle, #FF6B00 0%, transparent 70%)" }}
          />

          {/* Logo container */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Spinning ring 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute h-36 w-36 rounded-full"
              style={{
                border: "1.5px solid transparent",
                borderTopColor: "#FF6B00",
                borderRightColor: "#FF6B0040",
              }}
            />
            {/* Spinning ring 2 — opposite */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
              className="absolute h-28 w-28 rounded-full"
              style={{
                border: "1px solid transparent",
                borderTopColor: "#FFB80080",
                borderLeftColor: "#FFB80030",
              }}
            />
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
              className="absolute h-24 w-24 rounded-full"
              style={{ border: "2px solid #FF6B00" }}
            />

            {/* Logo — black background, show the orange icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="relative z-10 h-20 w-20 overflow-hidden rounded-2xl shadow-2xl"
              style={{ boxShadow: "0 0 32px rgba(255,107,0,0.4)" }}
            >
              <img
                src="/logo.jpg"
                alt="Obyo Option"
                className="h-full w-full object-cover"
                style={{ background: "#000" }}
              />
            </motion.div>
          </div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-1 text-2xl font-black tracking-tight"
            style={{ color: "#FF6B00" }}
          >
            Obyo Option
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mb-10 text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#444" }}
          >
            Demo Trading Platform
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, width: "60%" }}
            animate={{ opacity: 1, width: "72%" }}
            transition={{ delay: 0.6 }}
            className="relative h-0.5 overflow-hidden rounded-full"
            style={{ backgroundColor: "#1a1a1a", width: "72%" }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #FF6B00, #FFB800)",
                boxShadow: "0 0 8px #FF6B00",
              }}
              transition={{ duration: 0.05 }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-3 text-xs font-medium"
            style={{ color: "#555" }}
          >
            {messages[msgIdx]}
          </motion.p>

          {/* Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-[10px] font-medium text-muted-foreground"
          >
            v1.0.0 • Demo
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
