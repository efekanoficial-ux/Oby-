import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

const oldLine = `      {/* Small white line under the target */}
      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x + (targetRect.width / 2) - 16,
            top: targetRect.bottom + 6,
            width: 32,
            height: 4,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed z-[9999] bg-white rounded-full pointer-events-none shadow-[0_2px_8px_rgba(255,255,255,0.5)]"
        />
      )}`;

const newLine = `      {/* Underline perfectly matching target width */}
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

content = content.replace(oldLine, newLine);

// Bump version for testing
content = content.replace(/hasSeenInteractiveTutorialv8/g, 'hasSeenInteractiveTutorialv9');

fs.writeFileSync("src/components/tutorial.tsx", content);
