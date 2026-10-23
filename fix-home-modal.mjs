import fs from "fs";
let content = fs.readFileSync("src/pages/home.tsx", "utf-8");

const oldAnim = `initial={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }} animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }} exit={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}`;
const newAnim = `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}`;
content = content.replace(oldAnim, newAnim);

const oldClass = `className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[380px] z-[60] rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl"`;
const newClass = `className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-[380px] z-[60] rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl"`;
content = content.replace(oldClass, newClass);

fs.writeFileSync("src/pages/home.tsx", content);
