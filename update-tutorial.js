const fs = require("fs");
let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

// Add useIsMobile import if not present
if (!content.includes("useIsMobile")) {
  content = content.replace(
    'import { motion, AnimatePresence } from "framer-motion";',
    'import { motion, AnimatePresence } from "framer-motion";\nimport { useIsMobile } from "@/hooks/use-mobile";'
  );
}

const tutorialComponent = `export function Tutorial() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isMobile) {
      const seen = localStorage.getItem("hasSeenMobileTutorial2");
      if (!seen) {
        setTimeout(() => setShow(true), 1500);
      }
    }
  }, [isMobile]);

  if (!show || !isMobile) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("hasSeenMobileTutorial2", "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex flex-col bg-[#0a0a0c] border-t border-white/10 rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: step === i ? 24 : 8,
                      background: step === i ? currentStep.color : "rgba(255,255,255,0.2)"
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Illustration Area */}
            <div
              className="relative w-full h-[240px] flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: currentStep.bg }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {currentStep.illustration}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-xl font-black text-white leading-tight">
                      {currentStep.title}
                    </h2>
                    <p className="text-sm font-semibold mt-1" style={{ color: currentStep.color }}>
                      {currentStep.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="min-h-[60px]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[13px] text-white/60 leading-relaxed"
                  >
                    {currentStep.body}
                  </motion.p>
                </AnimatePresence>
              </div>

              {currentStep.tip && (
                <div className="flex items-start gap-2.5 rounded-xl bg-white/5 border border-white/5 p-3">
                  <div
                    className="flex shrink-0 h-5 w-5 items-center justify-center rounded-full font-black text-[10px]"
                    style={{ background: currentStep.color, color: "#000" }}
                  >
                    !
                  </div>
                  <p className="text-[11px] font-medium text-white/80 leading-relaxed">
                    {currentStep.tip}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleNext}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black shadow-lg transition-transform active:scale-95"
                style={{ background: currentStep.color, color: "#000" }}
              >
                {isLast ? t.tutDone : t.tutNext}
                {!isLast && <ChevronRight size={18} strokeWidth={3} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`;

content = content.replace(/export function Tutorial\(\) \{\s*return null;\s*\}/, tutorialComponent);

fs.writeFileSync("src/components/tutorial.tsx", content);
