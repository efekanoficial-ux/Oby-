import fs from "fs";
let content = fs.readFileSync("src/pages/home.tsx", "utf-8");

// Change modal positioning to be centered on all screens
const oldModalPos = `            className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[380px] z-[60] rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl"`;
const newModalPos = `            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[380px] z-[60] rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl"`;
content = content.replace(oldModalPos, newModalPos);

// Fix animation entry for center (from bottom slide to center scale or simple opacity)
const oldAnim = `initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}`;
const newAnim = `initial={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }} animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}`;
content = content.replace(oldAnim, newAnim);

// Remove the pull bar line since it's centered now
const oldPullBar = `<div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>`;
content = content.replace(oldPullBar, "");

// Change colors and remove AKTİF badge
const oldItemColor = `style={{ background: isActive ? \`\${a.color}14\` : "rgba(255,255,255,0.02)", border: isActive ? \`1px solid \${a.color}30\` : "1px solid transparent" }}`;
const newItemColor = `style={{ background: isActive ? "rgba(42,171,238,0.1)" : "rgba(255,255,255,0.02)", border: isActive ? "1px solid rgba(42,171,238,0.3)" : "1px solid transparent" }}`;
content = content.replace(oldItemColor, newItemColor);

const oldLabelLine = `{isActive && <span className="rounded px-1 py-0.5 text-[8px] font-bold" style={{ background: \`\${a.color}25\`, color: a.color }}>AKTİF</span>}`;
content = content.replace(oldLabelLine, "");

fs.writeFileSync("src/pages/home.tsx", content);
