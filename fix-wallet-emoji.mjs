import fs from "fs";
let content = fs.readFileSync("src/pages/wallet.tsx", "utf-8");

const oldText = `: "⚠️ Lütfen Dekont Yükleyiniz (Zorunlu)"}`;
const newText = `: "Lütfen Dekont Yükleyiniz (Zorunlu)"}`;
content = content.replace(oldText, newText);

fs.writeFileSync("src/pages/wallet.tsx", content);
