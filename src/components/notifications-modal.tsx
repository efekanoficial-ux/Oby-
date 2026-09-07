import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, TrendingUp, Wallet, ShieldAlert, Award } from "lucide-react";

export interface NotificationsModalProps {
  show: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: "trade" | "wallet" | "system" | "vip";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "trade",
    title: "Piyasa Fırsatı: BTC/USD",
    desc: "BTC/USD grafiğinde son 1 saatte yüksek volatilite tespit edildi.",
    time: "5 dk önce",
    read: false,
  },
  {
    id: "2",
    type: "vip",
    title: "VIP Avantajları Aktif",
    desc: "Aktivitenize göre yüksek kazanç oranlarından yararlanabilirsiniz.",
    time: "1 saat önce",
    read: false,
  },
  {
    id: "3",
    type: "wallet",
    title: "Hoş Geldiniz!",
    desc: "Obyo Option platformuna başarıyla giriş yaptınız. Demo hesabınız hazır.",
    time: "Dün",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Güvenlik Güncellemesi",
    desc: "Hesabınız en üst düzey veri şifreleme protokolleri ile korunmaktadır.",
    time: "2 gün önce",
    read: true,
  },
];

export function NotificationsModal({ show, onClose }: NotificationsModalProps) {
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const clearNotification = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "trade":
        return <TrendingUp size={16} className="text-[#0ecb81]" />;
      case "wallet":
        return <Wallet size={16} className="text-[#FF6B00]" />;
      case "vip":
        return <Award size={16} className="text-[#FFB800]" />;
      case "system":
        return <ShieldAlert size={16} className="text-[#3b82f6]" />;
    }
  };

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#111111] border border-white/10 p-5 text-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B00] text-[9px] font-black text-black">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bildirimler</h3>
                  <p className="text-xs text-white/40">Sistem ve işlem güncellemeleri</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[#FF6B00] hover:underline font-semibold px-2 py-1"
                    title="Tümünü Okundu İşaretle"
                  >
                    <CheckCheck size={14} />
                    <span>Okundu Yap</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-white/30">
                  <Bell size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">Bildiriminiz bulunmuyor.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                      item.read
                        ? "bg-white/2 border-white/5 text-white/70"
                        : "bg-white/6 border-white/15 text-white"
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-white tracking-wide">{item.title}</h4>
                        <span className="text-[10px] text-white/30 font-medium">{item.time}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => clearNotification(item.id)}
                      className="absolute top-2.5 right-2.5 text-white/20 hover:text-white/60 p-1"
                      title="Kaldır"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <button
              onClick={onClose}
              className="mt-4 shrink-0 w-full rounded-xl py-2.5 text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Kapat
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
