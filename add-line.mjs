import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

const lineDiv = `      {/* Hit-test overlay: Block clicks outside the hole */}
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

      {/* Small white line under the target */}
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

content = content.replace(
  /\{\/\* Hit-test overlay: Block clicks outside the hole \*\/\}[\s\S]*?onPointerDown=\{\(e\) => e.stopPropagation\(\)\}\n      \/>/,
  lineDiv
);

// Bump version so it shows up again
content = content.replace(/hasSeenInteractiveTutorialv7/g, 'hasSeenInteractiveTutorialv8');

fs.writeFileSync("src/components/tutorial.tsx", content);
