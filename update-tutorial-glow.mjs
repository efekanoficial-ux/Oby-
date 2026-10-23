import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

// Change position of step-3 to bottom
content = content.replace(
  'target: "step-3",\n    title: "Vade Süresi",\n    body: "Tahmininizin ne kadar süre sonra sonuçlanacağını seçin. (Örn: 1 Dakika)",\n    position: "top",',
  'target: "step-3",\n    title: "Vade Süresi",\n    body: "Tahmininizin ne kadar süre sonra sonuçlanacağını seçin. (Örn: 1 Dakika)",\n    position: "bottom",'
);

// We need to inject the CSS for the glow animation and add a div for it.
const styleInjection = `
const pulseCss = \`
@keyframes tut-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 1), 0 0 15px 5px rgba(255, 255, 255, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 1), 0 0 25px 10px rgba(255, 255, 255, 0.6);
    transform: scale(1.05);
  }
}
\`;

function getPolygon(rect: DOMRect | null) {
`;

content = content.replace('function getPolygon(rect: DOMRect | null) {', styleInjection);

// Inject the style tag and glow div
const glowDiv = `
      {/* Glow effect box */}
      {targetRect && (
        <motion.div
          initial={false}
          animate={{
            left: targetRect.x,
            top: targetRect.y,
            width: targetRect.width,
            height: targetRect.height,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed z-[9999] rounded-xl pointer-events-none"
          style={{ animation: "tut-glow-pulse 1.5s infinite ease-in-out" }}
        />
      )}

      {/* Tooltip Content */}
`;

content = content.replace('{/* Tooltip Content */}', glowDiv);

// Inject the style block inside the return
content = content.replace(
  '<svg width="0" height="0" className="absolute pointer-events-none">',
  '<style>{pulseCss}</style>\n      <svg width="0" height="0" className="absolute pointer-events-none">'
);

// We want to make sure hasSeenInteractiveTutorialv6 is used so it shows up for testing
content = content.replace(/hasSeenInteractiveTutorialv5/g, 'hasSeenInteractiveTutorialv6');

fs.writeFileSync("src/components/tutorial.tsx", content);
