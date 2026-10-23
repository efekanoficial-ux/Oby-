import fs from "fs";
let content = fs.readFileSync("src/context/AuthContext.tsx", "utf-8");

content = content.replace(
  'adminUpdateKYC:   (userId: string, status: "verified" | "rejected", reason?: string) => Promise<{ success: boolean; error?: string }>;',
  'adminUpdateKYC:   (userId: string, status: "verified" | "rejected", reason?: string) => Promise<{ success: boolean; error?: string }>;\n  deleteRequest: (id: string) => Promise<void>;'
);

fs.writeFileSync("src/context/AuthContext.tsx", content);
