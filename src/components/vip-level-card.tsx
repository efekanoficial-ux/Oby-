import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface VIPLevelCardProps {
  totalDeposited: number;
  currency?: "USD" | "TL";
}

interface LevelRawConfig {
  id: string;
  name: string;
  color: string;
  minAmount: number;
  bonus: string;
}

const levelsUSDConfig: LevelRawConfig[] = [
  { id: "free",   name: "FREE",   color: "#71717a", minAmount: 0,     bonus: "%0" },
  { id: "silver", name: "SILVER", color: "#cbd5e1", minAmount: 10,    bonus: "%2" },
  { id: "gold",   name: "GOLD",   color: "#fde047", minAmount: 50,    bonus: "%5" },
  { id: "vip",    name: "VIP",    color: "#d8b4fe", minAmount: 200,   bonus: "%12" }
];

const levelsTLConfig: LevelRawConfig[] = [
  { id: "free",   name: "FREE",   color: "#71717a", minAmount: 0,     bonus: "%0" },
  { id: "silver", name: "SILVER", color: "#cbd5e1", minAmount: 500,   bonus: "%2" },
  { id: "gold",   name: "GOLD",   color: "#fde047", minAmount: 2500,  bonus: "%5" },
  { id: "vip",    name: "VIP",    color: "#d8b4fe", minAmount: 10000, bonus: "%12" }
];

export function VIPLevelCard({ totalDeposited, currency: propCurrency }: VIPLevelCardProps) {
  const { currentUser } = useAuth();
  const accountMode = useAccountMode();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("free");

  const effectiveCurrency: "USD" | "TL" = 
    propCurrency || 
    (currentUser?.currency as "USD" | "TL") || 
    (accountMode?.currency as "USD" | "TL") || 
    "USD";

  const isUSD = effectiveCurrency === "USD";
  const rawLevels = isUSD ? levelsUSDConfig : levelsTLConfig;
  const symbol = isUSD ? "$" : "₺";
  const locale = isUSD ? "en-US" : "tr-TR";

  // Map dynamic localized withdrawal speed and support descriptions
  const getLevelDetails = (id: string) => {
    switch (id) {
      case "silver":
        return { withdrawalTime: t.hours12, support: t.supportPriority };
      case "gold":
        return { withdrawalTime: t.hours2, support: t.supportVip };
      case "vip":
        return { withdrawalTime: t.instantWithdraw || t.instant, support: t.supportAdvisor };
      case "free":
      default:
        return { withdrawalTime: t.hours24, support: t.supportNormal };
    }
  };

  const levels = rawLevels.map(lvl => ({
    ...lvl,
    ...getLevelDetails(lvl.id)
  }));

  let currentIdx = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalDeposited >= levels[i].minAmount) {
      currentIdx = i;
      break;
    }
  }

  const currentLevel = levels[currentIdx];
  const nextLevel = levels[currentIdx + 1] || null;

  let progress = 100;
  let leftAmount = 0;
  if (nextLevel) {
    const prev = currentLevel.minAmount;
    const target = nextLevel.minAmount;
    const diff = target - prev;
    const curr = Math.max(0, totalDeposited - prev);
    progress = diff > 0 ? Math.min(100, Math.max(0, (curr / diff) * 100)) : 100;
    leftAmount = Math.max(0, target - totalDeposited);
  }

  const maxTarget = levels[levels.length - 1].minAmount;
  const globalProgress = maxTarget > 0 ? Math.min(100, (totalDeposited / maxTarget) * 100) : 100;

  return (
    <>
      {/* ── Modern Animated Sleek Widget ── */}
      <div className="px-4 mb-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveTab(currentLevel.id);
            setShowModal(true);
          }}
          className="relative overflow-hidden rounded-3xl p-5 cursor-pointer shadow-2xl group flex flex-col justify-between"
          style={{
            background: "rgba(10, 10, 12, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)"
          }}
        >
          {/* Subtle animated background ambient glow corresponding to level */}
          <motion.div
            animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[40px] pointer-events-none"
            style={{ background: currentLevel.color }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-medium tracking-widest text-white/40 uppercase block mb-1">
                {t.currentStatus}
              </span>
              <div 
                className="text-lg font-black tracking-wider"
                style={{ color: currentLevel.color, textShadow: `0 0 20px ${currentLevel.color}40` }}
              >
                {currentLevel.name}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-5">
            {nextLevel ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-medium text-white/50">
                  <span>{nextLevel.name} {t.toNextLevel}</span>
                  <span className="text-white/80">{symbol}{leftAmount.toLocaleString(locale)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden relative border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ background: currentLevel.color }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium tracking-wide mt-2" style={{ color: currentLevel.color }}>
                {t.maxLevelReached}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Fullscreen Statü / VIP Sayfası ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#09090b] text-white"
            style={{ isolation: "isolate" }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-6 z-10">
              <h3 className="text-2xl font-bold tracking-tight text-white">{t.statusTitle}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-12">
              <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
              `}} />

              {/* Pill Tabs */}
              <div className="flex gap-1.5 sm:gap-2 mb-6 w-full overflow-x-auto pb-1">
                {levels.map(lvl => (
                  <button 
                    key={lvl.id}
                    onClick={() => setActiveTab(lvl.id)}
                    className="flex-1 py-2.5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: activeTab === lvl.id ? `${lvl.color}15` : 'rgba(255,255,255,0.03)',
                      color: activeTab === lvl.id ? lvl.color : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${activeTab === lvl.id ? `${lvl.color}30` : 'transparent'}`
                    }}
                  >
                    {lvl.name}
                  </button>
                ))}
              </div>

              {/* Global Progress Bar */}
              <div className="mb-10 px-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{t.depositProgress}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {symbol}{totalDeposited.toLocaleString(locale)} / {symbol}{maxTarget.toLocaleString(locale)}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${globalProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-zinc-500 to-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Content */}
              <AnimatePresence mode="wait">
                 {levels.map((lvl) => {
                   if (lvl.id !== activeTab) return null;

                   const isActiveLevelCurrent = lvl.id === currentLevel.id;
                   const isLocked = currentLevel.minAmount < lvl.minAmount;
                   
                   let tabProgress = 0;
                   if (isLocked) {
                     tabProgress = lvl.minAmount > 0 
                       ? Math.min(100, Math.max(0, (totalDeposited / lvl.minAmount) * 100)) 
                       : 100;
                   }

                   return (
                     <motion.div 
                       key={lvl.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       transition={{ duration: 0.2 }}
                       className="flex flex-col gap-6"
                     >
                        {/* Hero Title */}
                        <div>
                          {isActiveLevelCurrent && (
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/5 border border-white/10 text-white/70">
                                {t.currentLevelBadge}
                              </span>
                            </div>
                          )}
                          <h4 className="text-6xl font-black tracking-tighter leading-none mb-3" style={{ color: lvl.color, textShadow: `0 0 40px ${lvl.color}30` }}>
                            {lvl.name}
                          </h4>
                          <p className="text-sm text-white/40 font-medium">
                            {lvl.minAmount === 0 
                              ? t.freeLevelDesc 
                              : (t.requireDepositDesc || "Requires min {amount}").replace("{amount}", `${symbol}${lvl.minAmount.toLocaleString(locale)}`)}
                          </p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          
                          {/* Progress Card (Full Width) */}
                          {isLocked && (
                            <div className="col-span-2 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center shadow-lg">
                              <div className="flex justify-between items-center mb-3 text-xs font-semibold uppercase tracking-wider">
                                <span className="text-white/40">{t.remainingDeposit}</span>
                                <span style={{ color: lvl.color }}>
                                  {symbol}{(lvl.minAmount - totalDeposited).toLocaleString(locale)}
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${tabProgress}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                   className="h-full rounded-full shadow-[0_0_10px_currentColor]" 
                                   style={{ backgroundColor: lvl.color, color: lvl.color }} 
                                 />
                              </div>
                            </div>
                          )}

                          {/* Withdrawal Speed (Half Width) */}
                          <div className="col-span-1 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6 shadow-lg">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5" style={{ color: lvl.color }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">{t.withdrawalSpeed}</p>
                              <p className="text-xl font-bold text-white/90">{lvl.withdrawalTime}</p>
                            </div>
                          </div>

                          {/* Customer Support (Half Width) */}
                          <div className="col-span-1 p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6 shadow-lg">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5" style={{ color: lvl.color }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-1">{t.supportType}</p>
                              <p className="text-xl font-bold text-white/90">{lvl.support}</p>
                            </div>
                          </div>

                          {/* Extra Bonus (Full Width) */}
                          <div className="col-span-2 p-6 rounded-3xl border relative overflow-hidden flex items-center justify-between shadow-lg"
                               style={{ borderColor: `${lvl.color}20`, background: `linear-gradient(135deg, ${lvl.color}10 0%, rgba(255,255,255,0.01) 100%)` }}>
                             <div className="absolute -top-12 -right-12 w-40 h-40 opacity-20 blur-[40px] rounded-full pointer-events-none" style={{ background: lvl.color }} />
                             
                             <div className="relative z-10">
                               <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1">{t.extraProfit}</p>
                               <p className="text-lg font-bold text-white/90">{t.depositBonus}</p>
                             </div>
                             
                             <div className="relative z-10 flex items-center gap-2">
                               <span className="text-5xl font-black tracking-tighter" style={{ color: lvl.color, textShadow: `0 4px 20px ${lvl.color}40` }}>
                                 {lvl.bonus}
                               </span>
                             </div>
                          </div>

                        </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

