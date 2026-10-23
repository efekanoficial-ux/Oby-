import fs from "fs";

let content = fs.readFileSync("src/components/tutorial.tsx", "utf-8");

// Remove the pulsing animation CSS
const cssToRemove = `const pulseCss = \`
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
\`;`;

content = content.replace(cssToRemove, "");
content = content.replace("<style>{pulseCss}</style>", "");

// Remove the glow div
const glowDivRegex = /\{\/\* Glow effect box \*\/\}.*?\{\/\* Tooltip Content \*\/\}/s;
content = content.replace(glowDivRegex, "{/* Tooltip Content */}");

// Change position of step-3 back to "top"
content = content.replace(
  'target: "step-3",\n    title: "Vade Süresi",\n    body: "Tahmininizin ne kadar süre sonra sonuçlanacağını seçin. (Örn: 1 Dakika)",\n    position: "bottom",',
  'target: "step-3",\n    title: "Vade Süresi",\n    body: "Tahmininizin ne kadar süre sonra sonuçlanacağını seçin. (Örn: 1 Dakika)",\n    position: "top",'
);

// Bump version to v7
content = content.replace(/hasSeenInteractiveTutorialv6/g, 'hasSeenInteractiveTutorialv7');

fs.writeFileSync("src/components/tutorial.tsx", content);
