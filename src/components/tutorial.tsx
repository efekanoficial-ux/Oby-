import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, ChevronRight, UserPlus, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

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
    body: "Aşağıdaki YUKARI veya AŞAĞI butonuna tıklayarak hemen ilk deneme işleminizi açın.",
    position: "top",
    waitForClick: true,
  },
  {
    target: "none",
    title: "Tebrikler!",
    body: "İlk deneme işleminizi başarıyla açtınız. Kesintisiz işlem yapmak ve portföyünüzü yönetmek için şimdi tamamen ücretsiz hesabınızı oluşturun.",
    position: "center",
  }
];




function getPolygon(rect: DOMRect | null) {

  if (!rect) return 'none';
  const { x, y, width: w, height: h } = rect;
  const r = x + w;
  const b = y + h;
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${y}px, ${x}px ${y}px, ${x}px ${b}px, ${r}px ${b}px, ${r}px ${y}px, ${x}px ${y}px, 0% ${y}px)`;
}

export function Tutorial() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isMobile) {
      const seen = localStorage.getItem("hasSeenInteractiveTutorialv12");
      if (!seen) {
        setTimeout(() => setShow(true), 1500);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!show || !isMobile) return;
    const currentStep = STEPS[step];
    if (currentStep.target === "none") {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const targetId = currentStep.target;
      const els = document.querySelectorAll(`[data-tour="${targetId}"]`);
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
        // Tam otursun (0 padding)
        setTargetRect(new DOMRect(rect.x, rect.y, rect.width, rect.height));
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.addEventListener("scroll", updateRect);
    
    const interval = setInterval(updateRect, 300);

    return () => {
      window.removeEventListener("resize", updateRect);
      if (scroller) scroller.removeEventListener("scroll", updateRect);
      clearInterval(interval);
    };
  }, [show, step, isMobile]);

  // Handle actual click during trade step
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (show && STEPS[step].waitForClick && targetRect) {
        if (
          e.clientX >= targetRect.x &&
          e.clientX <= targetRect.x + targetRect.width &&
          e.clientY >= targetRect.y &&
          e.clientY <= targetRect.y + targetRect.height
        ) {
          // They clicked the real trade button through the hole!
          setTimeout(() => {
            setStep(s => s + 1);
          }, 800);
        }
      }
    };
    window.addEventListener("click", handleGlobalClick, true);
    return () => window.removeEventListener("click", handleGlobalClick, true);
  }, [show, step, targetRect]);

  if (!show || !isMobile) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (currentStep.waitForClick) return; // Ignore if waiting for real interaction
    if (!isLast) {
      setStep(s => s + 1);
    } else {
      handleCloseAndRegister();
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("hasSeenInteractiveTutorialv12", "true");
  };

  const handleCloseAndRegister = () => {
    handleClose();
    setLocation("/auth");
  };

  let tooltipStyle: React.CSSProperties = {};
  if (currentStep.position === "center") {
    tooltipStyle = { top: "50%", left: 24, right: 24, transform: "translateY(-50%)" };
  } else if (targetRect) {
    if (currentStep.position === "bottom") {
      tooltipStyle = { top: targetRect.bottom + 36, left: 16, right: 16 };
    } else {
      tooltipStyle = { bottom: window.innerHeight - targetRect.top + 36, left: 16, right: 16 };
    }
  }

  return (
    <>
      {/* Visual overlay: Blur + Mask (pointer events off to not block clicks) */}
      
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <mask id="tutorial-hole">
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>
      
      <div
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          mask: "url(#tutorial-hole)",
          WebkitMask: "url(#tutorial-hole)",
        }}
      />

      {/* Hit-test overlay: Block clicks outside the hole */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-auto"
        style={{
          clipPath: targetRect ? getPolygon(targetRect) : 'none',
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />

      {/* Bouncing Modern Arrow Pointing at Target */}
      {targetRect && currentStep.position !== "center" && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x + targetRect.width / 2 - 12,
            top: currentStep.position === "bottom" ? targetRect.bottom + 6 : targetRect.top - 30,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed z-[10002] pointer-events-none flex items-center justify-center w-6 h-6"
        >
          <motion.div
            animate={{ y: currentStep.position === "bottom" ? [0, -5, 0] : [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            {currentStep.position === "bottom" ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
                }}
              >
                <path
                  d="M12 3L4 12H9V21H15V12H20L12 3Z"
                  fill="#FFFFFF"
                  stroke="#18181B"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
                }}
              >
                <path
                  d="M12 21L20 12H15V3H9V12H4L12 21Z"
                  fill="#FFFFFF"
                  stroke="#18181B"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.div>
        </motion.div>
      )}

      
      {/* Tooltip Content */}

      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <AnimatePresence>
          {(targetRect || currentStep.position === "center") && (
            <motion.div
              key={step}
              initial={{ 
                opacity: 0, 
                y: currentStep.position === "bottom" ? -10 : (currentStep.position === "center" ? 0 : 10),
                scale: currentStep.position === "center" ? 0.95 : 1 
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bg-[#111] border border-white/10 rounded-[24px] p-6 shadow-2xl pointer-events-auto flex flex-col gap-4"
              style={tooltipStyle}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-black text-lg text-white flex items-center gap-3">
                  {isLast ? (
                    <CheckCircle2 size={24} className="text-white" />
                  ) : (
                    <span className="flex items-center justify-center bg-white text-black w-6 h-6 rounded-full text-xs font-black shrink-0">
                      {step + 1}
                    </span>
                  )}
                  {currentStep.title}
                </h3>
                <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors shrink-0 mt-1">
                  <X size={18} />
                </button>
              </div>
              
              <p className="text-white/60 text-[13px] leading-relaxed font-medium">
                {currentStep.body}
              </p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5">
                  {STEPS.map((s, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: step === i ? 16 : 6,
                        background: step === i ? "#FFF" : "rgba(255,255,255,0.15)",
                        display: isLast ? "none" : "block"
                      }}
                    />
                  ))}
                </div>
                
                {!currentStep.waitForClick && (
                  <button
                    onClick={handleNext}
                    className="bg-white text-black font-black text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg ml-auto"
                  >
                    {isLast ? "Kayıt Ol" : "İleri"}
                    {isLast ? <UserPlus size={15} strokeWidth={2.5} /> : <ChevronRight size={15} strokeWidth={3} />}
                  </button>
                )}

                {currentStep.waitForClick && (
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider animate-pulse ml-auto">
                    İşlem açmanız bekleniyor...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
