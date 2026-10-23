import React from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";

export function RejectionAlert() {
  const [location, navigate] = useLocation();
  const { currentUser, requests, isRejectionViewed, markRejectionsAsViewed } = useAuth();
  const { currency } = useAccountMode();

  if (!currentUser) return null;

  // Find user's unviewed rejected requests
  const userRequests = requests.filter(r => (
    r.userId === currentUser.id ||
    (r.userEmail && currentUser.email && r.userEmail.toLowerCase() === currentUser.email.toLowerCase())
  ));

  const unviewedRejections = userRequests.filter(
    r => r.status === "rejected" && !isRejectionViewed(r)
  );

  // If none or if user is currently on the transactions page, do not display top popup
  const isOnTransactionsPage = location === "/wallet" && window.location.search.includes("tab=pending");
  if (unviewedRejections.length === 0 || isOnTransactionsPage) {
    return null;
  }

  const latest = unviewedRejections[0];
  const isTL = (currentUser?.currency || currency) === "TL";
  const sym = isTL ? "₺" : "$";
  const typeLabel = latest.type === "deposit" ? "Para Yatırma" : "Para Çekme";

  const handleGoToTransactions = () => {
    navigate("/wallet?tab=pending");
  };

  const handleDismiss = () => {
    markRejectionsAsViewed(unviewedRejections.map(r => r.id));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pointer-events-auto"
      >
        <div
          className="p-2.5 rounded-xl border shadow-xl backdrop-blur-xl flex flex-col gap-1.5"
          style={{
            background: "linear-gradient(180deg, rgba(26,14,16,0.96) 0%, rgba(18,12,14,0.98) 100%)",
            borderColor: "rgba(246,70,93,0.35)",
            boxShadow: "0 8px 24px -4px rgba(246,70,93,0.2), 0 0 0 1px rgba(246,70,93,0.12)",
          }}
        >
          {/* Top row: alert badge, title, close button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-lg bg-[#f6465d]/20 border border-[#f6465d]/30 flex items-center justify-center shrink-0">
                <AlertCircle size={13} className="text-[#f6465d]" />
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <h4 className="text-[11px] font-black text-white tracking-tight">
                  İşleminiz Reddedildi
                </h4>
                <span className="text-[10px] text-white/50">({sym}{latest.amount})</span>
                {unviewedRejections.length > 1 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#f6465d]/25 text-[#f6465d]">
                    +{unviewedRejections.length - 1}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGoToTransactions}
                className="px-2.5 py-1 rounded-lg bg-[#f6465d]/25 hover:bg-[#f6465d]/40 text-[#f6465d] text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
              >
                <span>İncele</span>
                <ArrowRight size={10} />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Kapat"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Rejection Reason description box if exists */}
          {latest.rejectionReason && (
            <div className="px-2.5 py-1.5 rounded-lg bg-[#f6465d]/10 border border-[#f6465d]/20 text-[10px] text-white/80 leading-snug font-medium truncate">
              <span className="text-[#f6465d] font-bold mr-1">Neden:</span>
              "{latest.rejectionReason}"
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
