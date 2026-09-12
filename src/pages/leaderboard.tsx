import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, ArrowLeft, User } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import {
  LeaderTrader,
  USD_TRY_RATE,
  getTurkeyTime,
  getTurkeyTodayKey,
  getDailyResetRemaining,
  calculateUserRank,
  getDeterministicBots,
  syncUserLeaderboard,
} from "@/lib/leaderboard";

export default function LeaderboardPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { completedTrades } = useDemoAccount();
  const [countdown, setCountdown] = useState(getDailyResetRemaining);
  const [tick, setTick] = useState(0);
  const [firestoreTraders, setFirestoreTraders] = useState<LeaderTrader[]>([]);

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
    
    const trNow = getTurkeyTime();
    // Start of today in Turkey time (UTC+3)
    const startOfToday = new Date(Date.UTC(trNow.getUTCFullYear(), trNow.getUTCMonth(), trNow.getUTCDate(), -3, 0, 0, 0)).getTime();
    
    const todayTrades = completedTrades.filter((tr) => 
      tr.closedAt && tr.closedAt >= startOfToday
    );
    
    const realTrades = todayTrades.filter(tr => tr.mode === "real");
    const activeTradesList = realTrades.length > 0 ? realTrades : todayTrades;
    
    const tradeCount = activeTradesList.length;
    if (tradeCount === 0) {
      return { hasTraded: false, isProfit: false, profitUSD: 0, tradeCount: 0 };
    }

    const rawProfit = activeTradesList.reduce((sum, tr) => sum + (tr.profit || 0), 0);
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

  // Sync current registered user's performance to Firestore leaderboard collection
  useEffect(() => {
    if (!currentUser || !userTodayStats.hasTraded || userTodayStats.profitUSD <= 0) return;
    const todayKey = getTurkeyTodayKey();
    const fullName = `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}.`.trim();
    syncUserLeaderboard({
      userId: currentUser.id,
      name: fullName,
      profitUSD: userTodayStats.profitUSD,
      tradeCount: userTodayStats.tradeCount,
      todayKey,
    });
  }, [currentUser, userTodayStats]);

  // Listen to all real registered users who traded today in real-time from Firestore
  useEffect(() => {
    const todayKey = getTurkeyTodayKey();
    const q = query(
      collection(db, "leaderboard"),
      where("dateKey", "==", todayKey)
    );
    const unsub = onSnapshot(q, (snap) => {
      const traders: LeaderTrader[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: `real-${data.userId}`,
            userId: data.userId,
            rank: 0,
            name: data.name || "Kullanıcı",
            countryCode: data.countryCode || "TR",
            countryFlag: data.countryFlag || "🇹🇷",
            countryName: data.countryName || "Türkiye",
            profitUSD: Number(data.profitUSD || 0),
            tradeCount: Number(data.tradeCount || 0),
          };
        })
        .filter((t) => t.profitUSD > 0 && t.tradeCount > 0);
      setFirestoreTraders(traders);
    }, (err) => {
      console.warn("Leaderboard onSnapshot error:", err);
    });
    return () => unsub();
  }, []);

  const { top20, userRank } = useMemo(() => {
    const todayKey = getTurkeyTodayKey();
    const bots = getDeterministicBots(todayKey);

    const mergedMap = new Map<string, LeaderTrader>();

    // 1. Add base benchmark bots
    for (const b of bots) {
      mergedMap.set(b.id, { ...b });
    }

    // 2. Add real users from Firestore (shared with everyone)
    for (const r of firestoreTraders) {
      const isMe = currentUser?.id === r.userId;
      mergedMap.set(`user-${r.userId}`, {
        ...r,
        isCurrentUser: isMe,
        name: isMe ? `${r.name} (Siz)` : r.name,
      });
    }

    // 3. Optimistic update for current user if their local stats are positive and fresh
    if (currentUser && userTodayStats.hasTraded && userTodayStats.profitUSD > 0) {
      const myKey = `user-${currentUser.id}`;
      const existing = mergedMap.get(myKey);
      const myDisplayName = `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}. (Siz)`.trim();
      if (!existing || existing.profitUSD < userTodayStats.profitUSD) {
        mergedMap.set(myKey, {
          id: `real-${currentUser.id}`,
          userId: currentUser.id,
          rank: 0,
          name: myDisplayName,
          countryCode: "TR",
          countryFlag: "🇹🇷",
          countryName: "Türkiye",
          profitUSD: userTodayStats.profitUSD,
          tradeCount: userTodayStats.tradeCount,
          isCurrentUser: true,
        });
      }
    }

    const allList = Array.from(mergedMap.values());
    allList.sort((a, b) => {
      if (b.profitUSD !== a.profitUSD) {
        return b.profitUSD - a.profitUSD;
      }
      return b.tradeCount - a.tradeCount;
    });

    let finalUserRank = 0;
    allList.forEach((trader, idx) => {
      const r = idx + 1;
      trader.rank = r;
      if (trader.isCurrentUser) {
        finalUserRank = r;
      }
    });

    const cutoffProfit = allList[19]?.profitUSD || bots[bots.length - 1]?.profitUSD || 350;

    if (!finalUserRank && userTodayStats.hasTraded && currentUser) {
      finalUserRank = calculateUserRank(userTodayStats.profitUSD, cutoffProfit);
    }

    return {
      top20: allList.slice(0, 20),
      userRank: finalUserRank,
    };
  }, [firestoreTraders, userTodayStats, currentUser, tick]);

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
