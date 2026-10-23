import fs from "fs";
let content = fs.readFileSync("src/pages/admin.tsx", "utf-8");

// Add new states
const newStates = `  const [processingReq, setProcessingReq] = useState<string | null>(null);

  /* Delete Request / Reset Stats state */
  const [reqToDelete, setReqToDelete] = useState<string | null>(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);
  const [showStatsResetConfirm, setShowStatsResetConfirm] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);`;

content = content.replace('  const [processingReq, setProcessingReq] = useState<string | null>(null);', newStates);

fs.writeFileSync("src/pages/admin.tsx", content);
