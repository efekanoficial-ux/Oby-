import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Clock, ArrowLeft, User, Trophy, Zap, AlertCircle, CheckCircle2,
  ChevronRight, Sparkles, Shield, Flame, Check, Coins, Lock, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import {
  Tournament,
  DEFAULT_TOURNAMENTS,
  listenTournaments,
  joinTournament,
  isUserVip,
  getDeterministicTournamentLeaders,
  TournamentLeader
} from "@/lib/tournaments";
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
  const { setMode } = useAccountMode();
  const { completedTrades } = useDemoAccount();

  const [mainTab, setMainTab] = useState<"daily" | "tournaments">(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "tournaments") return "tournaments";
    } catch {}
    return "daily";
  });
  const [countdown, setCountdown] = useState(getDailyResetRemaining);
  const [tick, setTick] = useState(0);
  const [firestoreTraders, setFirestoreTraders] = useState<LeaderTrader[]>([]);

  // Tournament states
  const [tournaments, setTournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);
  const [selectedTourId, setSelectedTourId] = useState<string>(DEFAULT_TOURNAMENTS[0].id);
  const [isJoining, setIsJoining] = useState(false);
  const [joinModalTour, setJoinModalTour] = useState<Tournament | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync tournaments from Firestore
  useEffect(() => {
    const unsub = listenTournaments((list) => {
      setTournaments(list);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Daily reset countdown
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

  // Selected tournament object
  const selectedTour = useMemo(() => {
    return tournaments.find((t) => t.id === selectedTourId) || tournaments[0] || DEFAULT_TOURNAMENTS[0];
  }, [tournaments, selectedTourId]);

  // Tournament leaders for selected tournament
  const tournamentLeaders = useMemo(() => {
    return getDeterministicTournamentLeaders(selectedTour.id, currentUser);
  }, [selectedTour.id, currentUser, tick]);

  // User currency checks
  const isTL = (currentUser?.currency || "USD") === "TL";
  const userSym = isTL ? "₺" : "$";
  const entryFee = isTL ? selectedTour.entryFeeTL : selectedTour.entryFeeUSD;
  const userRealBal = currentUser?.realBalance ?? 0;
  const hasEnoughBal = userRealBal >= entryFee;
  const isVip = isUserVip(currentUser);
  const hasJoined = currentUser?.joinedTournaments?.includes(selectedTour.id);

  // Time remaining for tournament (1 week duration calculation)
  const tournamentTimeLeft = useMemo(() => {
    const diff = Math.max(0, selectedTour.endsAt - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, mins };
  }, [selectedTour.endsAt, tick]);

  // Handle joining tournament
  const handleJoinTournament = async (t: Tournament) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    if (!isVip) {
      setNoticeMessage({
        type: "error",
        text: "Turnuvaya katılım için VIP üyelik gereklidir. Lütfen cüzdanınızdan yatırım yaparak VIP statüsüne yükselin.",
      });
      return;
    }

    if (!hasEnoughBal) {
      const feeFormatted = isTL ? `${entryFee.toLocaleString("tr-TR")} ₺` : `$${entryFee}`;
      setNoticeMessage({
        type: "error",
        text: `Yetersiz bakiye! Katılım için gerçek bakiyenizden ${feeFormatted} tahsil edilecektir. Lütfen önce cüzdanınıza bakiye yükleyin.`,
      });
      return;
    }

    setIsJoining(true);
    const result = await joinTournament(t, currentUser);
    setIsJoining(false);

    if (result.success) {
      setJoinModalTour(null);
      setMode("tournament");
    } else {
      setNoticeMessage({
        type: "error",
        text: result.error || "Turnuvaya katılırken bir hata oluştu.",
      });
    }
  };

  // Real user today profit calculation for Daily Leaderboard
  const userTodayStats = useMemo(() => {
    if (!currentUser) {
      return { hasTraded: false, isProfit: false, profitUSD: 0, tradeCount: 0 };
    }
    
    const trNow = getTurkeyTime();
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
    const isUserTL = currency === "TL";
    const profitUSD = isUserTL ? rawProfit / USD_TRY_RATE : rawProfit;

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

  // Listen to daily leaderboard
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

    for (const b of bots) {
      mergedMap.set(b.id, { ...b });
    }

    for (const r of firestoreTraders) {
      const isMe = currentUser?.id === r.userId;
      mergedMap.set(`user-${r.userId}`, {
        ...r,
        isCurrentUser: isMe,
        name: isMe ? `${r.name} (Siz)` : r.name,
      });
    }

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
    <div className="h-full w-full overflow-hidden bg-[#070709] text-white flex flex-col">
      {/* ── Header with Back Button & Centered Countdown ── */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/5 px-4 pt-3 pb-2.5 shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Geri"
          >
            <ArrowLeft size={16} />
          </button>

          {mainTab === "daily" ? (
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white tracking-wide">
              <Clock size={13} className="text-white/40" />
              <span className="text-white/40 text-[11px] font-sans mr-0.5">Sıfırlanma (00:00):</span>
              <span>{countdown.hours}</span>
              <span className="text-white/30">:</span>
              <span>{countdown.minutes}</span>
              <span className="text-white/30">:</span>
              <span>{countdown.seconds}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white tracking-wide">
              <Clock size={13} className="text-white/40" />
              <span className="text-white/40 text-[11px] font-sans mr-0.5">Turnuva Süresi:</span>
              <span>{tournamentTimeLeft.days}g {tournamentTimeLeft.hours}s {tournamentTimeLeft.mins}d</span>
            </div>
          )}

          <div className="w-8" />
        </div>

        {/* Günlük Sıralama ve Turnuva Butonları (Sıfırlanma kısmının hemen altında) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            onClick={() => setMainTab("daily")}
            className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === "daily"
                ? "bg-white text-black font-black shadow-md"
                : "text-white/40 hover:text-white"
            }`}
          >
            <span>Günlük Sıralama</span>
          </button>

          <button
            onClick={() => setMainTab("tournaments")}
            className={`flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === "tournaments"
                ? "bg-white text-black font-black shadow-md"
                : "text-white/40 hover:text-white"
            }`}
          >
            <span>Turnuva</span>
          </button>
        </div>
      </div>

      {/* Notice Message Toast */}
      {noticeMessage && (
        <div className="mx-4 mt-2 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs font-bold ${
              noticeMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {noticeMessage.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{noticeMessage.text}</span>
            </div>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-white/40 hover:text-white text-sm leading-none ml-1 cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: DAILY LEADERBOARD (GÜNLÜK RESETLENEN TOP 20) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === "daily" && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Table Headers */}
          <div className="px-4 py-2 shrink-0 bg-black/60 border-b border-white/5">
            <div className="grid grid-cols-12 px-3 py-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
              <div className="col-span-2">Sıra</div>
              <div className="col-span-6">Yatırımcı</div>
              <div className="col-span-4 text-right">Günlük Kâr</div>
            </div>
          </div>

          {/* Top 20 Table */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-1">
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

            {/* Bonuses Banner Under Leaderboard */}
            <div
              onClick={() => navigate("/bonuses")}
              className="mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B00]/15 via-[#FFB800]/10 to-transparent border border-[#FF6B00]/30 flex items-center justify-between gap-3 cursor-pointer hover:border-[#FF6B00]/50 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] shrink-0 border border-[#FF6B00]/30 group-hover:scale-105 transition-transform">
                  <Gift size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">Bonuslar & Fırsatlar</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FF6B00] text-black uppercase">
                      Hediye
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate">
                    Yatırımsız nakit bakiye ve %50 yatırım bonuslarını etkinleştirin.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#FF6B00] flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span>Bonuslar</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* User's Standing Footer */}
          {userTodayStats.hasTraded && userRank > 0 && (
            <div className="p-3.5 px-5 bg-black border-t border-white/10 flex items-center justify-between shrink-0">
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: TOURNAMENTS (YATAY SEÇİLEBİLİR 5 BORSA TURNUVASI) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === "tournaments" && (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Horizontal Scrollable 5 Tournaments List - Sade & Modern Tasarım */}
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-bold text-white/60">
                Turnuvalar (1 Hafta Süre)
              </span>
              <span className="text-[10px] text-white/30 font-medium">Yana kaydırın →</span>
            </div>

            {/* Carousel */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
              {tournaments.slice(0, 5).map((tour) => {
                const isSelected = tour.id === selectedTour.id;
                const isTourJoined = currentUser?.joinedTournaments?.includes(tour.id);

                return (
                  <div
                    key={tour.id}
                    onClick={() => setSelectedTourId(tour.id)}
                    className={`relative flex-shrink-0 w-56 rounded-xl overflow-hidden cursor-pointer snap-start border transition-all ${
                      isSelected
                        ? "border-white/50 bg-[#16171f] shadow-lg ring-1 ring-white/20"
                        : "border-white/10 hover:border-white/25 bg-[#0e0f14]"
                    }`}
                  >
                    {/* Image with subtle overlay - no logo */}
                    <div className="relative h-24 w-full overflow-hidden bg-black/60">
                      <img
                        src={tour.imageUrl}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f14] via-transparent to-black/30" />

                      {/* VIP Tag */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold border border-white/20">
                        VIP
                      </div>

                      {/* Prize */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold border border-white/20">
                        {tour.prizePool}
                      </div>

                      {/* Joined Badge */}
                      {isTourJoined && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-bold">
                          <Check size={10} strokeWidth={3} />
                          Katıldınız
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-2.5">
                      <h3 className="text-xs font-bold text-white truncate mb-1">
                        {tour.title}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] text-white/50">
                        <span>Giriş: {isTL ? `${tour.entryFeeTL.toLocaleString("tr-TR")} ₺` : `$${tour.entryFeeUSD}`}</span>
                        <span className="font-mono text-white/70">100 ¥</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Active Tournament Box (Sade Tasarım) ── */}
          <div className="rounded-2xl border border-white/10 bg-[#0e0f14] overflow-hidden">
            {/* Cover image */}
            <div className="relative h-32 w-full overflow-hidden">
              <img
                src={selectedTour.imageUrl}
                alt={selectedTour.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f14] via-[#0e0f14]/50 to-black/40" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold border border-white/15">
                  VIP Şartı
                </span>
                <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold border border-white/15">
                  {selectedTour.prizePool}
                </span>
              </div>

              {/* 1-Week Remaining Countdown */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-white">
                <Clock size={12} className="text-white/60" />
                <span>Kalan: {tournamentTimeLeft.days}g {tournamentTimeLeft.hours}s {tournamentTimeLeft.mins}d</span>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="p-4 flex flex-col gap-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {selectedTour.title}
                </h2>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  {selectedTour.subtitle}
                </p>
              </div>

              {/* Minimal Specs */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-white/40 uppercase font-medium">Katılım</span>
                  <span className="text-xs font-bold text-white">
                    {isTL ? `${selectedTour.entryFeeTL.toLocaleString("tr-TR")} ₺` : `$${selectedTour.entryFeeUSD}`}
                  </span>
                  <span className="text-[9px] text-white/30">VIP + Bakiye</span>
                </div>

                <div className="flex flex-col gap-0.5 border-x border-white/5">
                  <span className="text-[9px] text-white/40 uppercase font-medium">Turnuva Parası</span>
                  <span className="text-xs font-bold text-white">
                    {selectedTour.startingBalance} ¥
                  </span>
                  <span className="text-[9px] text-white/30">Başlangıç</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-white/40 uppercase font-medium">Süre</span>
                  <span className="text-xs font-bold text-white">
                    1 Hafta
                  </span>
                  <span className="text-[9px] text-white/30">{selectedTour.participantsCount} Katılımcı</span>
                </div>
              </div>

              {/* Participation Action Button */}
              <div>
                {!currentUser ? (
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-3 rounded-xl font-bold text-xs text-black bg-white hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Giriş Yap ve Turnuvaya Katıl
                  </button>
                ) : hasJoined ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                      <div>
                        <p className="text-xs font-bold text-white">Turnuvaya Katıldınız</p>
                        <p className="text-[10px] text-white/40">1 Hafta sonunda en çok ¥ yapan kazanır</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {(currentUser.tournamentBalance ?? 100).toFixed(2)} ¥
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setMode("tournament");
                        navigate("/");
                      }}
                      className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-black bg-white hover:bg-white/90 transition-all cursor-pointer"
                    >
                      <Trophy size={14} />
                      Turnuvada İşlem Yap (100 ¥ İle Başla)
                    </button>
                  </div>
                ) : !isVip ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      Turnuvaya katılım VIP üyelere açıktır. VIP olmak için hesabınıza en az {isTL ? "500 ₺" : "10 $"} yatırınız.
                    </div>
                    <button
                      onClick={() => navigate("/wallet?tab=deposit")}
                      className="w-full py-3 rounded-xl font-bold text-xs text-black bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
                    >
                      VIP Olmak İçin Para Yatır
                    </button>
                  </div>
                ) : !hasEnoughBal ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                      Yetersiz bakiye. Katılım ücreti {isTL ? `${entryFee.toLocaleString("tr-TR")} ₺` : `$${entryFee}`} gerçek bakiyenizden tahsil edilecektir. (Mevcut: {isTL ? `${userRealBal.toLocaleString("tr-TR")} ₺` : `$${userRealBal.toFixed(2)}`}).
                    </div>
                    <button
                      onClick={() => navigate("/wallet?tab=deposit")}
                      className="w-full py-3 rounded-xl font-bold text-xs text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                    >
                      Cüzdana Bakiye Ekle
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoinTournament(selectedTour)}
                    disabled={isJoining}
                    className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-black bg-white hover:bg-white/90 transition-all cursor-pointer"
                  >
                    {isJoining ? (
                      <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    ) : (
                      <>
                        <Trophy size={14} />
                        Turnuvaya Katıl ({isTL ? `${entryFee.toLocaleString("tr-TR")} ₺` : `$${entryFee}`} Bakiyeden Çekilir)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Tournament Leaderboard Section (Katılmadan Sıralama Gözükmez!) ── */}
          {!hasJoined ? (
            /* Locked State - Katılmadan sıralamalar gizli */
            <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-6 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Turnuva Sıralaması Gizli</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 leading-relaxed">
                  Katılımcı sıralamasını ve liderleri görmek için turnuvaya katılmanız gerekmektedir. Katıldığınızda 100 ¥ başlangıç bakiyesi hesabınıza tanımlanır.
                </p>
              </div>

              {/* Katıl Butonu */}
              <div className="mt-1">
                {!currentUser ? (
                  <button
                    onClick={() => navigate("/auth")}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                ) : !isVip ? (
                  <button
                    onClick={() => navigate("/wallet?tab=deposit")}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
                  >
                    VIP Olmak İçin Para Yatır
                  </button>
                ) : !hasEnoughBal ? (
                  <button
                    onClick={() => navigate("/wallet?tab=deposit")}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Cüzdana Bakiye Ekle
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinTournament(selectedTour)}
                    disabled={isJoining}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-white/90 transition-all cursor-pointer"
                  >
                    {isJoining ? "İşleniyor..." : `Turnuvaya Katıl (${isTL ? `${entryFee.toLocaleString("tr-TR")} ₺` : `$${entryFee}`})`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Unlocked State - Katıldıktan sonra sıralama açık */
            <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-white/60" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Turnuva Sıralaması (1 Hafta)
                  </h3>
                </div>
                <span className="text-[10px] text-white/50 font-mono font-medium">
                  100 ¥ Başlangıç
                </span>
              </div>

              {/* List */}
              <div className="flex flex-col gap-1.5">
                {tournamentLeaders.map((ldr) => {
                  const isTop1 = ldr.rank === 1;
                  const isTop2 = ldr.rank === 2;
                  const isTop3 = ldr.rank === 3;
                  const isUser = ldr.isCurrentUser;

                  return (
                    <div
                      key={ldr.userId}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                        isUser
                          ? "bg-white/[0.08] border border-white/20"
                          : "bg-white/[0.02] border border-white/5"
                      }`}
                    >
                      {/* Rank & User Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold shrink-0"
                          style={{
                            background: isTop1 ? "#fff" : isTop2 ? "rgba(255,255,255,0.2)" : isTop3 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                            color: isTop1 ? "#000" : "#fff"
                          }}
                        >
                          {ldr.rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm select-none">{ldr.countryFlag}</span>
                            <span className={`text-xs truncate ${isUser ? "font-bold text-white" : "font-medium text-white/90"}`}>
                              {ldr.name}
                            </span>
                            {isUser && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-white text-black shrink-0">
                                SİZ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30">{ldr.tradeCount} İşlem</span>
                        </div>
                      </div>

                      {/* Tournament Balance & Profit */}
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-white">
                          {ldr.tournamentBalance.toFixed(2)} ¥
                        </p>
                        <span className="text-[9px] text-[#0ecb81] font-mono">
                          +{((ldr.tournamentBalance - 100)).toFixed(2)} ¥
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
