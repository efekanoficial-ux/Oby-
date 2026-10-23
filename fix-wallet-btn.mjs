import fs from "fs";
let content = fs.readFileSync("src/pages/wallet.tsx", "utf-8");

const oldBtnText = `? "✓ Transferi ve Dekontu Gönder"
                      : "⚠️ Lütfen Dekont Yükleyiniz (Zorunlu)"}`;

const newBtnText = `? "Transferi gerçekleştirdim."
                      : "⚠️ Lütfen Dekont Yükleyiniz (Zorunlu)"}`;

content = content.replace(oldBtnText, newBtnText);

fs.writeFileSync("src/pages/wallet.tsx", content);
