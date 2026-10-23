import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

const oldLine = `      {/* Underline perfectly matching target width */}
      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x,
            top: targetRect.bottom + 4,
            width: targetRect.width,
            height: 3,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed z-[9999] bg-white rounded-full pointer-events-none shadow-[0_2px_8px_rgba(255,255,255,0.6)]"
        />
      )}`;

const newArrow = `      {/* Bouncing Arrow Pointing at Target */}
      {targetRect && currentStep.position !== "center" && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x + targetRect.width / 2 - 12,
            top: currentStep.position === "bottom" ? targetRect.bottom + 6 : targetRect.top - 28,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed z-[9999] pointer-events-none flex items-center justify-center w-6 h-6"
        >
          <motion.div
            animate={{ y: currentStep.position === "bottom" ? [0, -6, 0] : [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            {currentStep.position === "bottom" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))' }}>
                <path d="M12 2l-10 12h6v8h8v-8h6z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))' }}>
                <path d="M12 22l10-12h-6v-8h-8v8h-6z" />
              </svg>
            )}
          </motion.div>
        </motion.div>
      )}`;

content = content.replace(oldLine, newArrow);

// Bump version for testing
content = content.replace(/hasSeenInteractiveTutorialv9/g, 'hasSeenInteractiveTutorialv10');

fs.writeFileSync("src/components/tutorial.tsx", content);
