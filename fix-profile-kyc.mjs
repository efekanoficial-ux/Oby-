import fs from "fs";
let content = fs.readFileSync("src/pages/profile.tsx", "utf-8");

content = content.replace(
  "{/* ── KYC Status Card ── */}\n          {currentUser && (",
  "{/* ── KYC Status Card ── */}\n          {currentUser && currentUser.kycStatus !== \"verified\" && ("
);

fs.writeFileSync("src/pages/profile.tsx", content);
