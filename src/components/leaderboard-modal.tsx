import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, User } from "lucide-react";
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

export function LeaderboardModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { currentUser } = useAuth();
  const { completedTrades } = useDemoAccount();
  const [countdown, setCountdown] = useState(getDailyResetRemaining);
  const [tick, setTick] = useState(0);
  const [firestoreTraders, setFirestoreTraders] = useState<LeaderTrader[]>([]);

  useEffect(() => {
    if (!show) return;
    const timer = setInterval(() => {
      setCountdown(getDailyResetRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const liveTimer = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(liveTimer);
  }, [show]);

  const userTodayStats = useMemo(() => {
    if (!currentUser) {
      return { hasTraded: false, isProfit: false, profitUSD: 0, tradeCount: 0 };
    }
    
    const trNow = getTurkeyTime();
    const startOfToday = new Date(Date.UTC(trNow.getUTCFullYear(), trNow.getUTCMonth(), trNow.getUTCDate(), -3, 0, 0, 0)).getTime();
    
    const todayTrades = completedTrades.filter((tr) => tr.closedAt && tr.closedAt >= startOfToday);
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

  // Sync current user's performance to Firestore
  useEffect(() => {
    if (!show || !currentUser || !userTodayStats.hasTraded || userTodayStats.profitUSD <= 0) return;
    const todayKey = getTurkeyTodayKey();
    const fullName = `${currentUser.name} ${currentUser.surname?.charAt(0) || ""}.`.trim();
    syncUserLeaderboard({
      userId: currentUser.id,
      name: fullName,
      profitUSD: userTodayStats.profitUSD,
      tradeCount: userTodayStats.tradeCount,
      todayKey,
    });
  }, [show, currentUser, userTodayStats]);

  // Listen to Firestore real users
  useEffect(() => {
    if (!show) return;
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
  }, [show]);

  const { top20, userRank } = useMemo(() => {
    const todayKey = getTurkeyTodayKey();
    const bots = getDeterministicBots(todayKey);

    const mergedMap = new Map<string, LeaderTrader>();

    // 1. Benchmark bots
    for (const b of bots) {
      mergedMap.set(b.id, { ...b });
    }

    // 2. Real users from Firestore
    for (const r of firestoreTraders) {
      const isMe = currentUser?.id === r.userId;
      mergedMap.set(`user-${r.userId}`, {
        ...r,
        isCurrentUser: isMe,
        name: isMe ? `${r.name} (Siz)` : r.name,
      });
    }

    // 3. Current user optimistic update
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

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col h-[100dvh] md:h-[85vh] w-full max-w-xl bg-black text-white md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Centered Countdown Header */}
          <div className="relative flex items-center justify-center px-5 pt-5 pb-3 bg-black shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white tracking-wide">
              <Clock size={14} className="text-white/40" />
              <span className="text-white/40 text-[11px] font-sans mr-0.5">Sıfırlanma (00:00):</span>
              <span>{countdown.hours}</span>
              <span className="text-white/30">:</span>
              <span>{countdown.minutes}</span>
              <span className="text-white/30">:</span>
              <span>{countdown.seconds}</span>
            </div>

            <button
              onClick={onClose}
              className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={17} />
            </button>
          </div>

          {/* Table Columns (No Percentages) */}
          <div className="px-5 py-2 shrink-0 bg-black">
            <div className="grid grid-cols-12 px-2 py-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
              <div className="col-span-2">Sıra</div>
              <div className="col-span-6">Yatırımcı</div>
              <div className="col-span-4 text-right">Günlük Kâr</div>
            </div>
          </div>

          {/* Top 20 List */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-1 bg-black">
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
                      : "bg-white/[0.015] hover:bg-white/[0.03]"
                  }`}
                >
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
                      <span className="font-mono text-xs font-semibold text-white/40 ml-1.5">
                        #{trader.rank}
                      </span>
                    )}
                  </div>

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

          {/* User's Standing Footer */}
          {userTodayStats.hasTraded && userRank > 0 && (
            <div className="p-3.5 px-5 bg-black border-t border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                  <User size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🇹🇷</span>
                    <span className="text-xs font-bold text-white">{currentUser?.name} {currentUser?.surname}</span>
                    <span className="font-mono text-xs font-bold text-white/50">
                      #{userRank.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
