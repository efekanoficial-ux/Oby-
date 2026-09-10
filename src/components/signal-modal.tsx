import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface SignalModalProps {
  visible: boolean;
  onClose: () => void;
  assetLabel: string;
}

export function SignalModal({ visible, onClose, assetLabel }: SignalModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [signal, setSignal] = useState<"up" | "down" | null>(null);
  const [strength, setStrength] = useState(0);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (visible) {
      setSignal(null);
      
      const storageKey = `obyo_signal_time_${assetLabel}`;
      const lastSignalStr = localStorage.getItem(storageKey);
      const lastSignal = lastSignalStr ? parseInt(lastSignalStr, 10) : 0;
      const now = Date.now();
      const elapsed = now - lastSignal;
      const remainingCooldown = Math.max(0, 60000 - elapsed);
      
      if (remainingCooldown > 0) {
        setCooldown(Math.ceil(remainingCooldown / 1000));
        setAnalyzing(false);
        interval = setInterval(() => {
          const newElapsed = Date.now() - lastSignal;
          const newRemaining = Math.max(0, 60000 - newElapsed);
          if (newRemaining <= 0) {
            setCooldown(0);
            setAnalyzing(true); // Automatically start analysis once cooldown ends
            
            // Simulate analysis
            setTimeout(() => {
              setSignal(Math.random() > 0.5 ? "up" : "down");
              setStrength(Math.floor(Math.random() * (98 - 75 + 1)) + 75); // 75-98%
              setAnalyzing(false);
              localStorage.setItem(storageKey, Date.now().toString());
            }, 1500);
            
            clearInterval(interval);
          } else {
            setCooldown(Math.ceil(newRemaining / 1000));
          }
        }, 1000);
      } else {
        setCooldown(0);
        setAnalyzing(true);
        // Simulate analysis
        const timer = setTimeout(() => {
          setSignal(Math.random() > 0.5 ? "up" : "down");
          setStrength(Math.floor(Math.random() * (98 - 75 + 1)) + 75); // 75-98%
          setAnalyzing(false);
          localStorage.setItem(storageKey, Date.now().toString());
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    
    return () => clearInterval(interval);
  }, [visible, assetLabel]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Obyo Sinyal Robotu</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{assetLabel} Analizi</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {cooldown > 0 ? (
                <div className="flex flex-col items-center py-6">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1a1a1a] bg-white/5 flex items-center justify-center mb-4">
                    <Clock size={20} className="text-white/40" />
                  </div>
                  <p className="text-sm font-bold text-white text-center">Yeni Sinyal Bekleniyor</p>
                  <p className="text-xs text-white/40 mt-1 text-center">Sinyal robotu 1 dakikalık periyotlarla çalışır. Lütfen {cooldown} saniye bekleyin.</p>
                </div>
              ) : analyzing ? (
                <div className="flex flex-col items-center py-6">
                  <div className="w-12 h-12 rounded-full border-4 border-[#1a1a1a] border-t-[#4DA2FF] animate-spin mb-4" />
                  <p className="text-sm font-bold text-white">Piyasa Analiz Ediliyor...</p>
                  <p className="text-xs text-white/40 mt-1">Algoritmalar 1 dakikalık fırsatları tarıyor</p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="text-center mb-6">
                    <p className="text-xs font-bold text-white/50 mb-1">Önerilen İşlem (1 Dakika)</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xl font-black text-white">{assetLabel}</span>
                      <span className="text-white/20">|</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${signal === "up" ? "bg-[#2EBD85]/20 text-[#2EBD85]" : "bg-[#F6465D]/20 text-[#F6465D]"}`}>
                        {signal === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {signal === "up" ? "YUKARI (CALL)" : "AŞAĞI (PUT)"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-[#111] rounded-2xl p-4 border border-[#1a1a1a]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white/60">Sinyal Gücü</span>
                      <span className="text-xs font-black text-[#4DA2FF]">% {strength}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${strength}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-[#4DA2FF]/50 to-[#4DA2FF] rounded-full"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 mt-3 text-center">Bu sinyal algoritmik analizlere dayanır, kesin kazanç garantisi vermez.</p>
                  </div>
                  
                  <button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors cursor-pointer border border-white/10">
                    Anladım, Kapat
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
