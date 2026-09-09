import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDemoAccount } from "@/context/DemoAccountContext";

interface LeaderTrader {
  id: string;
  rank: number;
  name: string;
  countryCode: string;
  countryFlag: string;
  countryName: string;
  profitUSD: number;
  tradeCount: number;
  isCurrentUser?: boolean;
}

const USD_TRY_RATE = 47; // 1 USD = 47 TL

const BASE_TRADERS = [
  { name: "Mehmet K.", countryCode: "TR", countryFlag: "🇹🇷", countryName: "Türkiye", baseProfit: 19840, baseTrades: 142 },
  { name: "Alexander P.", countryCode: "US", countryFlag: "🇺🇸", countryName: "ABD", baseProfit: 16150, baseTrades: 124 },
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

function getDailyResetRemaining() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
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

function calculateUserRank(profitUSD: number, cutoffProfit: number): number {
  if (profitUSD >= cutoffProfit) return 20; // Reaches top 20
  
  if (profitUSD <= 0) {
    // Zararda olursam 20.000 seviyelerinde gözüksün
    const lossOffset = Math.min(4500, Math.round(Math.abs(profitUSD) * 25));
    return 20150 + lossOffset;
  }
  
  if (profitUSD < 1) {
    // 0$ - 1$ arası: ~2.500 seviyesinden 700'e iner
    return Math.round(2500 - profitUSD * 1800);
  }
  
  // 1$ ve üzeri: 600-700'lü seviyelerden başlasın (~690)
  // 1$'dan cutoffProfit'e doğru 690'dan 21'e yumuşak geçiş
  const t = Math.min(1, (profitUSD - 1) / Math.max(1, cutoffProfit - 1));
  return Math.max(21, Math.round(690 * Math.pow(21 / 690, t)));
}

export default function LeaderboardPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { completedTrades } = useDemoAccount();
  const [countdown, setCountdown] = useState(getDailyResetRemaining);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDailyResetRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const liveTimer = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(liveTimer);
  }, []);

  // Real user today profit calculation
  const userTodayStats = useMemo(() => {
    if (!currentUser) {
      return { hasTraded: false, isProfit: false, profitUSD: 0, tradeCount: 0 };
    }
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    
    const todayTrades = completedTrades.filter((tr) => tr.closedAt && tr.closedAt >= startOfToday);
    const tradeCount = todayTrades.length;
    if (tradeCount === 0) {
      return { hasTraded: false, isProfit: false, profitUSD: 0, tradeCount: 0 };
    }

    const rawProfit = todayTrades.reduce((sum, tr) => sum + (tr.profit || 0), 0);
    const currency = (currentUser as any)?.currency ?? "USD";
    const isTL = currency === "TL";
    const profitUSD = isTL ? rawProfit / USD_TRY_RATE : rawProfit;

    return {
      hasTraded: true,
      isProfit: profitUSD > 0,
      profitUSD: Math.round(profitUSD * 100) / 100,
      tradeCount,
    };
  }, [currentUser, completedTrades]);

  const { top20, userRank } = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < todayKey.length; i++) {
      hash = (hash * 31 + todayKey.charCodeAt(i)) & 0xffffff;
    }

    const list: LeaderTrader[] = BASE_TRADERS.map((t, index) => {
      const deltaSeed = (hash + index * 17) % 300;
      const profit = t.baseProfit + deltaSeed + ((tick % (index + 1)) === 0 ? 10 : 0);
      return {
        id: `trader-${index}`,
        rank: index + 1,
        name: t.name,
        countryCode: t.countryCode,
        countryFlag: t.countryFlag,
        countryName: t.countryName,
        profitUSD: profit,
        tradeCount: t.baseTrades,
      };
    });

    const cutoffProfit = list[list.length - 1]?.profitUSD || 350;
    let finalUserRank = 0;

    if (userTodayStats.hasTraded && currentUser) {
      if (userTodayStats.profitUSD >= cutoffProfit) {
        // Enters top 20!
        const userTrader: LeaderTrader = {
          id: "current-user",
          rank: 0,
          name: `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}. (Siz)`,
          countryCode: "TR",
          countryFlag: "🇹🇷",
          countryName: "Türkiye",
          profitUSD: userTodayStats.profitUSD,
          tradeCount: userTodayStats.tradeCount,
          isCurrentUser: true,
        };
        list.push(userTrader);
        list.sort((a, b) => b.profitUSD - a.profitUSD);
      } else {
        finalUserRank = calculateUserRank(userTodayStats.profitUSD, cutoffProfit);
      }
    }

    const sliced = list.slice(0, 20).map((item, idx) => {
      const r = idx + 1;
      if (item.isCurrentUser) {
        finalUserRank = r;
      }
      return { ...item, rank: r };
    });

    return {
      top20: sliced,
      userRank: finalUserRank,
    };
  }, [userTodayStats, currentUser, tick]);

  return (
    <div className="h-full w-full overflow-y-auto bg-black text-white flex flex-col">
      {/* ── Sub-header with Centered Countdown & Back Button ── */}
      <div className="relative flex items-center justify-center px-4 py-3 bg-black shrink-0">
        <button
          onClick={() => navigate("/profile")}
          className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Geri"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Centered Countdown */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white tracking-wide">
          <Clock size={13} className="text-white/40" />
          <span className="text-white/40 text-[11px] font-sans mr-0.5">Sıfırlanma (00:00):</span>
          <span>{countdown.hours}</span>
          <span className="text-white/30">:</span>
          <span>{countdown.minutes}</span>
          <span className="text-white/30">:</span>
          <span>{countdown.seconds}</span>
        </div>
      </div>

      {/* ── Table Column Headers (No Percentages) ── */}
      <div className="px-4 py-1.5 shrink-0 bg-black">
        <div className="grid grid-cols-12 px-3 py-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
          <div className="col-span-2">Sıra</div>
          <div className="col-span-6">Yatırımcı</div>
          <div className="col-span-4 text-right">Günlük Kâr</div>
        </div>
      </div>

      {/* ── Top 20 List ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2 space-y-1 bg-black">
        {top20.map((trader) => {
          const isTop1 = trader.rank === 1;
          const isTop2 = trader.rank === 2;
          const isTop3 = trader.rank === 3;
          const isUser = trader.isCurrentUser;

          return (
            <div
              key={trader.id}
              className={`grid grid-cols-12 items-center px-3 py-2.5 rounded-xl transition-all ${
                isUser
                  ? "bg-white/[0.09] border border-white/25"
                  : isTop1
                  ? "bg-white/[0.04]"
                  : "bg-white/[0.015]"
              }`}
            >
              {/* Rank */}
              <div className="col-span-2 flex items-center">
                {isTop1 ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black font-black text-xs">
                    1
                  </span>
                ) : isTop2 ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-white font-bold text-xs">
                    2
                  </span>
                ) : isTop3 ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white/80 font-bold text-xs">
                    3
                  </span>
                ) : (
                  <span className="font-mono text-xs font-semibold text-white/40 ml-1">
                    #{trader.rank}
                  </span>
                )}
              </div>

              {/* Trader Name & Flag & Trade Count */}
              <div className="col-span-6 flex items-center gap-2.5 min-w-0 pr-1">
                <span className="text-base shrink-0 select-none">
                  {trader.countryFlag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs truncate font-semibold ${isUser ? "text-white font-bold" : "text-white/90"}`}>
                      {trader.name}
                    </p>
                    {isUser && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-white text-black shrink-0">
                        SİZ
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 truncate">{trader.tradeCount} İşlem</p>
                </div>
              </div>

              {/* Daily Profit USD */}
              <div className="col-span-4 text-right">
                <p className="text-xs font-mono font-bold text-white">
                  +${trader.profitUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[9px] text-white/25 uppercase font-sans">USD</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── User's Standing Footer (If user has traded today) ── */}
      {userTodayStats.hasTraded && userRank > 0 && (
        <div className="p-3.5 px-5 bg-black border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
              <User size={13} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🇹🇷</span>
                <span className="text-xs font-bold text-white">{currentUser?.name} {currentUser?.surname}</span>
                <span className="font-mono text-[11px] font-bold text-white/50">
                  #{userRank.toLocaleString("tr-TR")}
                </span>
              </div>
              <p className="text-[9px] text-white/40">
                {userTodayStats.tradeCount} İşlem · {userTodayStats.isProfit ? "Kârda" : "Zararda"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-mono font-black block ${userTodayStats.profitUSD < 0 ? "text-red-400" : "text-white"}`}>
              {userTodayStats.profitUSD >= 0 ? "+" : ""}${userTodayStats.profitUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-white/30 font-sans uppercase">USD Kazanç</span>
          </div>
        </div>
      )}
    </div>
  );
}
