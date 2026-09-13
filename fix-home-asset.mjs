import fs from "fs";
let content = fs.readFileSync("src/pages/home.tsx", "utf-8");

const oldAssetSheet = `            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "80vh" }}`;

const newAssetSheet = `            className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[380px] z-[60] rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl"
            style={{ background: "linear-gradient(180deg, rgba(20,20,24,0.95) 0%, rgba(10,10,12,0.98) 100%)", border: "1px solid rgba(255,255,255,0.15)", maxHeight: "75vh", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8)" }}`;

content = content.replace(oldAssetSheet, newAssetSheet);

const oldLines = `                    <div className="flex items-end gap-0.5 h-6 shrink-0">
                      {[60,75,55,80,65,90,70].map((h, j) => (
                        <div key={j} className="rounded-t-[1px]" style={{ width:3, height:\`\${h*0.24}px\`, background: isActive ? a.color : "#2a2a2a" }} />
                      ))}
                    </div>`;

content = content.replace(oldLines, "");

fs.writeFileSync("src/pages/home.tsx", content);
