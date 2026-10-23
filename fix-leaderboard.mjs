import fs from "fs";

let content = fs.readFileSync("src/pages/leaderboard.tsx", "utf-8");

// Change `tr.isDemo !== true` to `(tr as any).isDemo !== true`
content = content.replace(
  'tr.closedAt && tr.closedAt >= startOfToday && tr.isDemo !== true',
  'tr.closedAt && tr.closedAt >= startOfToday && (tr as any).isDemo !== true'
);

fs.writeFileSync("src/pages/leaderboard.tsx", content);
