import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Gift, ArrowLeft, Clock, CheckCircle2, AlertCircle, Zap,
  Coins, ChevronRight, Wallet, Check, UserCheck
} from "lucide-react";
import {
  Bonus, UserBonusClaim, listenBonuses, listenUserClaims,
  claimNoDepositBonus, activateDepositMatchBonus, isBonusForUser
} from "@/lib/bonuses";

export default function BonusesPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [claims, setClaims] = useState<UserBonusClaim[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "nodeposit" | "deposit_match" | "history">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Real-time listener for bonuses
  useEffect(() => {
    const unsubBonuses = listenBonuses((list) => {
      setBonuses(list);
    });
    return () => unsubBonuses();
  }, []);

  // Real-time listener for user claims
  useEffect(() => {
    if (!currentUser) {
      setClaims([]);
      return;
    }
    const unsubClaims = listenUserClaims(currentUser.id, currentUser.email, (userClaims) => {
      setClaims(userClaims);
    });
    return () => unsubClaims();
  }, [currentUser]);

  // Live timer tick for countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to format remaining time
  const getRemainingTime = (expiresAt: number) => {
    const diff = expiresAt - now;
    if (diff <= 0) return { expired: true, text: "Süresi Doldu" };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return {
      expired: false,
      text: `${hours > 0 ? `${hours}sa ` : ""}${mins}dk ${secs}sn kaldı`,
      hours,
      mins,
      secs,
    };
  };

  // Filter bonuses relevant to this user with deduplication
  const userBonuses = Array.from(
    new Map(
      bonuses
        .filter((b) => isBonusForUser(b, currentUser))
        .map((b) => [b.id, b])
    ).values()
  );

  // Handle Activation
  const handleActivate = async (bonus: Bonus) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    setProcessingId(bonus.id);
    setFeedbackMsg(null);

    try {
      if (bonus.type === "nodeposit") {
        const res = await claimNoDepositBonus(bonus, currentUser);
        if (res.success) {
          setFeedbackMsg({ type: "success", text: res.message || "Bonus başarıyla hesabınıza eklendi!" });
        } else {
          setFeedbackMsg({ type: "error", text: res.error || "Bonus alınamadı." });
        }
      } else {
        const res = await activateDepositMatchBonus(bonus, currentUser);
        if (res.success) {
          setFeedbackMsg({ type: "success", text: res.message || "Yatırım bonusu etkinleştirildi!" });
        } else {
          setFeedbackMsg({ type: "error", text: res.error || "Bonus etkinleştirilemedi." });
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err?.message || "Beklenmeyen bir hata oluştu." });
    } finally {
      setProcessingId(null);
    }
  };

  // Auto-dismiss feedback toast after 5s
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Determine claim state for a bonus
  const getClaimStatus = (bonusId: string) => {
    const claim = claims.find((c) => c.bonusId === bonusId);
    return claim ? claim.status : null; // "activated" | "used" | null
  };

  const displayedBonuses = userBonuses.filter((b) => {
    const claimStatus = getClaimStatus(b.id);
    const { expired } = getRemainingTime(b.expiresAt);

    if (activeFilter === "history") {
      return claimStatus === "used" || (expired && !claimStatus);
    }
    // For active tabs ("all", "nodeposit", "deposit_match"): don't show used or expired bonuses
    if (claimStatus === "used" || expired) {
      return false;
    }
    if (activeFilter === "nodeposit") {
      return b.type === "nodeposit";
    }
    if (activeFilter === "deposit_match") {
      return b.type === "deposit_match";
    }
    // "all" - shows all valid active bonuses
    return true;
  });

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070709] text-white flex flex-col">
      {/* ── Sticky Top Header ── */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/5 px-4 py-3 shrink-0 flex items-center justify-between">
        <button
          onClick={() => navigate("/profile")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:text-white transition-colors cursor-pointer"
          title="Geri"
        >
          <ArrowLeft size={16} />
        </button>

        <h1 className="text-sm font-black text-white tracking-wide">Bonuslar</h1>

        <div className="w-8" />
      </div>

      {/* ── Feedback Message Banner ── */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-4 mt-3 p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              feedbackMsg.type === "success"
                ? "bg-[#0ecb81]/15 border-[#0ecb81]/30 text-[#0ecb81]"
                : "bg-[#f6465d]/15 border-[#f6465d]/30 text-[#f6465d]"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span className="flex-1">{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 max-w-xl mx-auto w-full flex flex-col gap-4 pb-12">
        {/* ── Category Filter Tabs ── */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/5">
          <button
            onClick={() => setActiveFilter("all")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeFilter === "all"
                ? "bg-white text-black font-black shadow"
                : "text-white/40 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveFilter("nodeposit")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeFilter === "nodeposit"
                ? "bg-white text-black font-black shadow"
                : "text-white/40 hover:text-white"
            }`}
          >
            Nakit
          </button>
          <button
            onClick={() => setActiveFilter("deposit_match")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeFilter === "deposit_match"
                ? "bg-white text-black font-black shadow"
                : "text-white/40 hover:text-white"
            }`}
          >
            Yatırım %
          </button>
          <button
            onClick={() => setActiveFilter("history")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeFilter === "history"
                ? "bg-white text-black font-black shadow"
                : "text-white/40 hover:text-white"
            }`}
          >
            Geçmiş
          </button>
        </div>

        {/* ── Bonus Cards List ── */}
        <div className="flex flex-col gap-3">
          {displayedBonuses.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
              <p className="text-sm font-bold text-white/60 mb-1">
                {activeFilter === "history"
                  ? "Geçmişte kullanılan bonus bulunmuyor"
                  : "Şu an kullanılabilir bonus bulunmuyor"}
              </p>
              <p className="text-xs text-white/30 max-w-xs">
                Yeni bonuslar ve kişiye özel hediyeler tanımlandığında burada listelenecektir.
              </p>
            </div>
          ) : (
            displayedBonuses.map((bonus) => {
              const claimStatus = getClaimStatus(bonus.id);
              const { expired, text: timeText } = getRemainingTime(bonus.expiresAt);
              const isProcessing = processingId === bonus.id;
              const isPersonal = bonus.target === "user";

              const isNoDeposit = bonus.type === "nodeposit";
              const isDepositMatch = bonus.type === "deposit_match";

              const isUsed = claimStatus === "used";
              const isActivated = claimStatus === "activated";

              return (
                <div
                  key={bonus.id}
                  className={`relative rounded-2xl p-4 border transition-all ${
                    isUsed
                      ? "bg-[#141416]/60 border-white/5 opacity-70"
                      : isActivated
                      ? "bg-[#1c1c20] border-[#0ecb81]/30"
                      : expired
                      ? "bg-[#141416]/40 border-white/5 opacity-50"
                      : "bg-[#18181b] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top Badges & Countdown */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPersonal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/15">
                          <UserCheck size={10} />
                          Size Özel
                        </span>
                      )}

                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white border border-white/15"
                      >
                        {isNoDeposit ? (
                          <>
                            <Coins size={10} className="text-white" />
                            {currentUser?.currency === "TL" && bonus.currency === "USD"
                              ? `${bonus.amount === 10 ? 500 : bonus.amount * 50} ₺ Nakit`
                              : `${bonus.amount} ${bonus.currency === "TL" ? "₺" : "$"} Nakit`}
                          </>
                        ) : (
                          <>
                            <Zap size={10} className="text-white" />
                            %{bonus.amount} Yatırım Bonusu
                          </>
                        )}
                      </span>

                      {bonus.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/60 border border-white/5">
                          {bonus.badge}
                        </span>
                      )}
                    </div>

                    {/* Expiration Timer / Status Badge */}
                    <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
                      {isUsed ? (
                        <span className="text-[#0ecb81] font-bold text-[10px]">Kullanıldı</span>
                      ) : isActivated ? (
                        <span className="text-[#0ecb81] font-bold text-[10px] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0ecb81] animate-ping" />
                          Etkin
                        </span>
                      ) : expired ? (
                        <span className="text-white/40 font-medium text-[10px]">Süresi Doldu</span>
                      ) : (
                        <span className="text-white font-mono font-medium flex items-center gap-1 text-[10px]">
                          <Clock size={11} className="text-white" />
                          <span className="text-white">{timeText}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-black text-white tracking-tight mb-1">
                    {bonus.title}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed mb-3">
                    {bonus.description}
                  </p>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-white/40 font-medium">
                      {isNoDeposit
                        ? "Yatırım şartı yoktur."
                        : "Yatırım yaparken % bonus otomatik eklenir."}
                    </div>

                    <div>
                      {isUsed ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-[#0ecb81] bg-[#0ecb81]/10 px-3 py-1.5 rounded-xl border border-[#0ecb81]/20">
                          <Check size={13} />
                          <span>Hesaba Aktarıldı</span>
                        </div>
                      ) : isActivated ? (
                        <button
                          onClick={() => navigate("/wallet")}
                          className="flex items-center gap-1.5 text-xs font-black text-black px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md select-none"
                          style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 4px 14px rgba(255,107,0,0.35)" }}
                        >
                          <Wallet size={13} />
                          <span>Şimdi Yatırım Yap</span>
                        </button>
                      ) : expired ? (
                        <div className="text-xs font-semibold text-white/30 bg-white/5 px-3 py-1.5 rounded-xl">
                          Süresi Doldu
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={isProcessing}
                          onClick={() => handleActivate(bonus)}
                          className={`flex items-center gap-1.5 text-xs font-black text-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md select-none ${
                            isProcessing ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 4px 14px rgba(255,107,0,0.35)" }}
                        >
                          {isProcessing ? (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                          ) : (
                            <span>Etkinleştir</span>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
