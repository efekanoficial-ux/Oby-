import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LeaderTrader {
  id: string;
  rank: number;
  name: string;
  countryCode: string;
  countryFlag: string;
  countryName: string;
  profitUSD: number;
  tradeCount: number;
  isCurrentUser?: boolean;
  userId?: string;
}

export const USD_TRY_RATE = 47; // 1 USD = 47 TL

export const BASE_TRADERS = [
  { name: "Alexander P.", countryCode: "US", countryFlag: "🇺🇸", countryName: "ABD", baseProfit: 19840, baseTrades: 142 },
  { name: "Mehmet K.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 16150, baseTrades: 124 },
  { name: "Lukas S.", countryCode: "DE", countryFlag: "🇩🇪", countryName: "Almanya", baseProfit: 13420, baseTrades: 110 },
  { name: "Rashad A.", countryCode: "AZ", countryFlag: "🇦🇿", countryName: "Azerbaycan", baseProfit: 11800, baseTrades: 98 },
  { name: "Oliver T.", countryCode: "GB", countryFlag: "🇬🇧", countryName: "İngiltere", baseProfit: 9650, baseTrades: 86 },
  { name: "Caner Y.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 8200, baseTrades: 76 },
  { name: "David S.", countryCode: "US", countryFlag: "🇺🇸", countryName: "ABD", baseProfit: 7100, baseTrades: 69 },
  { name: "Pierre D.", countryCode: "FR", countryFlag: "🇫🇷", countryName: "Fransa", baseProfit: 5850, baseTrades: 62 },
  { name: "Elnur M.", countryCode: "AZ", countryFlag: "🇦🇿", countryName: "Azerbaycan", baseProfit: 4920, baseTrades: 55 },
  { name: "Sven V.", countryCode: "NL", countryFlag: "🇳🇱", countryName: "Hollanda", baseProfit: 3950, baseTrades: 48 },
  { name: "Burak T.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 3140, baseTrades: 44 },
  { name: "Carlos M.", countryCode: "BR", countryFlag: "🇧🇷", countryName: "Brezilya", baseProfit: 2520, baseTrades: 39 },
  { name: "Kenji T.", countryCode: "JP", countryFlag: "🇯🇵", countryName: "Japonya", baseProfit: 1980, baseTrades: 36 },
  { name: "Tariq A.", countryCode: "SA", countryFlag: "🇸🇦", countryName: "Suudi Arabistan", baseProfit: 1520, baseTrades: 32 },
  { name: "Emre D.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 1180, baseTrades: 28 },
  { name: "Maximilian W.", countryCode: "DE", countryFlag: "🇩🇪", countryName: "Almanya", baseProfit: 920, baseTrades: 25 },
  { name: "Liam C.", countryCode: "CA", countryFlag: "🇨🇦", countryName: "Kanada", baseProfit: 740, baseTrades: 22 },
  { name: "Mateo G.", countryCode: "ES", countryFlag: "🇪🇸", countryName: "İspanya", baseProfit: 580, baseTrades: 19 },
  { name: "Leonardo B.", countryCode: "IT", countryFlag: "🇮🇹", countryName: "İtalya", baseProfit: 450, baseTrades: 16 },
  { name: "Serkan A.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 360, baseTrades: 14 },
];

// Unified Turkey Time (UTC+3) ensuring identical leaderboard numbers worldwide
export function getTurkeyTime(): Date {
  const now = new Date();
  const trMs = now.getTime() + (3 * 3600 * 1000);
  return new Date(trMs);
}

export function getTurkeyTodayKey(): string {
  return getTurkeyTime().toISOString().slice(0, 10);
}

export function getDailyResetRemaining() {
  const trNow = getTurkeyTime();
  const trMidnight = new Date(trNow);
  trMidnight.setUTCHours(24, 0, 0, 0);
  const diffMs = trMidnight.getTime() - trNow.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    hours: h.toString().padStart(2, "0"),
    minutes: m.toString().padStart(2, "0"),
    seconds: s.toString().padStart(2, "0"),
  };
}

export function calculateUserRank(profitUSD: number, cutoffProfit: number): number {
  if (profitUSD >= cutoffProfit) return 20;
  
  if (profitUSD <= 0) {
    const lossOffset = Math.min(4500, Math.round(Math.abs(profitUSD) * 25));
    return 20150 + lossOffset;
  }
  
  if (profitUSD < 1) {
    return Math.round(2500 - profitUSD * 1800);
  }
  
  const t = Math.min(1, (profitUSD - 1) / Math.max(1, cutoffProfit - 1));
  return Math.max(21, Math.round(690 * Math.pow(21 / 690, t)));
}

export function getDeterministicBots(todayKey: string): LeaderTrader[] {
  const trNow = getTurkeyTime();
  const hour = trNow.getUTCHours();
  const minute = trNow.getUTCMinutes();
  
  let timeScale = (hour * 60 + minute) / (24 * 60);
  timeScale = Math.max(0.08, timeScale);
  
  let hash = 0;
  for (let i = 0; i < todayKey.length; i++) {
    hash = (hash * 31 + todayKey.charCodeAt(i)) & 0xffffff;
  }

  const list: LeaderTrader[] = BASE_TRADERS.map((t, index) => {
    const dailyVar = ((hash + index * 17) % 100) / 100;
    const maxDailyProfit = t.baseProfit * (0.8 + dailyVar * 0.4);
    const maxDailyTrades = t.baseTrades * (0.8 + dailyVar * 0.4);
    const currentProfit = Math.round(maxDailyProfit * timeScale * 100) / 100;
    const currentTrades = Math.max(1, Math.floor(maxDailyTrades * timeScale));

    return {
      id: `bot-${index}`,
      rank: 0,
      name: t.name,
      countryCode: t.countryCode,
      countryFlag: t.countryFlag,
      countryName: t.countryName,
      profitUSD: currentProfit,
      tradeCount: currentTrades,
      isCurrentUser: false,
    };
  });

  list.sort((a, b) => b.profitUSD - a.profitUSD);

  // Ensure top bot is not Turkish
  if (list.length > 0 && list[0].countryCode === "TR") {
    const highestNonTRIndex = list.findIndex(t => t.countryCode !== "TR");
    if (highestNonTRIndex !== -1) {
      const tempProfit = list[0].profitUSD;
      const tempTrades = list[0].tradeCount;
      list[highestNonTRIndex].profitUSD = Math.round((tempProfit + 150.50) * 100) / 100;
      list[highestNonTRIndex].tradeCount = tempTrades + 3;
      list[0].profitUSD = Math.round((tempProfit - 50.25) * 100) / 100;
      list.sort((a, b) => b.profitUSD - a.profitUSD);
    }
  }

  return list;
}

export async function syncUserLeaderboard(params: {
  userId: string;
  name: string;
  profitUSD: number;
  tradeCount: number;
  todayKey: string;
}) {
  if (!params.userId || params.tradeCount <= 0) return;
  try {
    const userDoc = doc(db, "leaderboard", params.userId);
    await setDoc(userDoc, {
      userId: params.userId,
      name: params.name,
      countryCode: "TR",
      countryFlag: "🇹🇷",
      countryName: "Türkiye",
      profitUSD: Math.round(params.profitUSD * 100) / 100,
      tradeCount: params.tradeCount,
      dateKey: params.todayKey,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn("Leaderboard sync warning:", err);
  }
}
