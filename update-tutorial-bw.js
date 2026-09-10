import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

// We'll rewrite the component to be B/W and add navigation
const newTutorial = `
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, ChevronRight, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { t } from "@/i18n";

const STEPS = [
  {
    target: "step-1",
    title: "Varlık Seçimi",
    body: "Buradan işlem yapmak istediğiniz döviz çiftini veya varlığı seçebilirsiniz.",
    position: "bottom",
  },
  {
    target: "step-2",
    title: "Yatırım Tutarı",
    body: "İşleme gireceğiniz tutarı buradan belirleyin. (Örn: 50₺)",
    position: "top",
  },
  {
    target: "step-3",
    title: "Vade Süresi",
    body: "Tahmininizin ne kadar süre sonra sonuçlanacağını seçin. (Örn: 1 Dakika)",
    position: "top",
  },
  {
    target: "step-4",
    title: "İşlem Yönü",
    body: "Fiyatın YUKARI mı yoksa AŞAĞI mı gideceğini tahmin ederek işleminizi başlatın.",
    position: "top",
  }
];

export function Tutorial() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isMobile) {
      const seen = localStorage.getItem("hasSeenInteractiveTutorialv3");
      if (!seen) {
        setTimeout(() => setShow(true), 1500);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!show || !isMobile) return;

    const updateRect = () => {
      const targetId = STEPS[step].target;
      const els = document.querySelectorAll(\`[data-tour="\${targetId}"]\`);
      let visibleEl = null;
      
      for (let i = els.length - 1; i >= 0; i--) {
        const e = els[i] as HTMLElement;
        const rect = e.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(e).display !== 'none') {
          visibleEl = e;
          break;
        }
      }
      
      if (visibleEl) {
        const rect = visibleEl.getBoundingClientRect();
        setTargetRect(new DOMRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4));
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    // Observe scroll on the container to update position in real-time
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.addEventListener("scroll", updateRect);
    
    const interval = setInterval(updateRect, 300);
    
    return () => {
      window.removeEventListener("resize", updateRect);
      if (scroller) scroller.removeEventListener("scroll", updateRect);
      clearInterval(interval);
    };
  }, [show, step, isMobile]);

  if (!show || !isMobile) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setStep(s => s + 1);
    } else {
      handleCloseAndRegister();
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("hasSeenInteractiveTutorialv3", "true");
  };

  const handleCloseAndRegister = () => {
    handleClose();
    // Redirect to register
    setLocation("/auth");
  };

  let tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    if (currentStep.position === "bottom") {
      tooltipStyle = { top: targetRect.bottom + 12, left: 16, right: 16 };
    } else {
      tooltipStyle = { bottom: window.innerHeight - targetRect.top + 12, left: 16, right: 16 };
    }
  } else {
    tooltipStyle = { top: "50%", left: 16, right: 16, transform: "translateY(-50%)" };
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
      <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
        <defs>
          <mask id="cutout-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: targetRect.x,
                  y: targetRect.y,
                  width: targetRect.width,
                  height: targetRect.height,
                }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#cutout-mask)" />
      </svg>
      
      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x,
            top: targetRect.y,
            width: targetRect.width,
            height: targetRect.height,
          }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          className="absolute border border-white/60 rounded-xl pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.15)]"
        />
      )}

      <AnimatePresence>
        {targetRect && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: currentStep.position === "bottom" ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bg-white text-black border border-white/20 rounded-2xl p-5 shadow-2xl"
            style={tooltipStyle}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="flex items-center justify-center bg-black text-white w-6 h-6 rounded-full text-xs font-black">
                  {step + 1}
                </span>
                {currentStep.title}
              </h3>
              <button onClick={handleClose} className="text-black/40 hover:text-black transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-black/80 text-sm leading-relaxed mb-5 font-medium">
              {currentStep.body}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: step === i ? 16 : 6,
                      background: step === i ? "#000" : "rgba(0,0,0,0.15)"
                    }}
                  />
                ))}
              </div>
              
              <button
                onClick={handleNext}
                className="bg-black text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                {isLast ? "Kayıt Ol" : "İleri"}
                {isLast ? <UserPlus size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={3} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync("src/components/tutorial.tsx", newTutorial);
