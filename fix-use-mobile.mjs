import fs from "fs";
let content = fs.readFileSync("src/hooks/use-mobile.tsx", "utf-8");

const oldCode = `  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {`;

const newCode = `  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("src/hooks/use-mobile.tsx", content);
