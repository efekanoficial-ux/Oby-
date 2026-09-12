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
        initial={{ opacity: 0, y: -25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto"
      >
        <div
          className="p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-2.5"
          style={{
            background: "linear-gradient(180deg, rgba(26,14,16,0.96) 0%, rgba(18,12,14,0.98) 100%)",
            borderColor: "rgba(246,70,93,0.35)",
            boxShadow: "0 10px 32px -4px rgba(246,70,93,0.22), 0 0 0 1px rgba(246,70,93,0.15)",
          }}
        >
          {/* Top row: alert badge, title, close button */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#f6465d]/20 border border-[#f6465d]/30 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-[#f6465d]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white tracking-tight">
                    İşleminiz Reddedildi
                  </h4>
                  {unviewedRejections.length > 1 && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#f6465d]/25 text-[#f6465d] border border-[#f6465d]/35">
                      +{unviewedRejections.length - 1}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/70 font-medium truncate">
                  {typeLabel} talebiniz ({sym}{latest.amount}) onaylanmadı.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Kapat"
            >
              <X size={15} />
            </button>
          </div>

          {/* Rejection Reason description box if exists */}
          {latest.rejectionReason && (
            <div className="px-3 py-2 rounded-xl bg-[#f6465d]/10 border border-[#f6465d]/20 text-[11px] text-white/85 leading-relaxed font-medium">
              <span className="text-white/40 text-[10px] font-bold block mb-0.5 uppercase tracking-wider">
                Red Gerekçesi:
              </span>
              "{latest.rejectionReason}"
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleGoToTransactions}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f6465d] hover:bg-[#f6465d]/90 text-white text-xs font-black transition-all cursor-pointer shadow-md"
            >
              <Clock size={13} />
              <span>İşlemleri İncele</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
