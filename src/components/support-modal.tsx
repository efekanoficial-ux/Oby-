import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Headphones,
  Send,
  PhoneCall,
  ChevronLeft,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  SupportChat,
  listenUserSupportChat,
  sendUserSupportMessage,
  requestLiveAgentConnection,
  markSupportChatReadByUser,
} from "@/lib/support";

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SupportModal({ visible, onClose }: SupportModalProps) {
  const { currentUser, triggerTelegramNotify } = useAuth();
  const { t } = useLanguage();

  const userId = currentUser?.id || currentUser?.email || "guest_user";
  const userName = currentUser?.name
    ? `${currentUser.name} ${currentUser.surname || ""}`.trim()
    : currentUser?.email?.split("@")[0] || "Misafir Kullanıcı";
  const userEmail = currentUser?.email || "misafir@obyo.option";

  const [chat, setChat] = useState<SupportChat | null>(null);
  const [inputText, setInputText] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  /* Listen to user's support chat */
  useEffect(() => {
    if (!visible) return;
    const unsub = listenUserSupportChat(userId, (data) => {
      setChat(data);
      if (data?.unreadUser) {
        markSupportChatReadByUser(userId);
      }
    });
    return () => unsub();
  }, [visible, userId]);

  /* Reset local connect request state when modal closes */
  useEffect(() => {
    if (!visible) {
      setIsConnecting(false);
      setCountdown(60);
    }
  }, [visible]);

  /* Auto scroll chat to bottom when active */
  useEffect(() => {
    if (visible && chat?.status === "active") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages, chat?.status, visible]);

  /* 60-Second Countdown timer for agent connection */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnecting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnecting, countdown]);

  /* Start agent connection: hide button, start 60s countdown, send Telegram notify */
  const handleConnectAgent = async () => {
    setIsConnecting(true);
    setCountdown(60);
    await requestLiveAgentConnection(userId, userName, userEmail);

    /* Trigger Telegram Notification to Admin */
    try {
      if (triggerTelegramNotify) {
        triggerTelegramNotify({
          type: "support",
          userName,
          userEmail,
        }).catch(() => {});
      }
    } catch {}
  };

  /* Send message from input bar */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    await sendUserSupportMessage(userId, userName, userEmail, textToSend);
  };

  if (!visible) return null;

  /* Messaging input is unlocked ONLY when Müşteri Hizmetleri (Admin) approves / chat status is active */
  const isApprovedAndActive = chat?.status === "active";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-black text-white select-none overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        {/* ── 1. Minimal Header (Küçük Müşteri Hizmetleri, Arka Plansız Kulaklık, Rozetsiz, 7/24 YAZISIZ) ── */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
              title={t.cancelOrBack || "Geri Dön"}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Arka plan kutusu/dairesi olmayan kulaklık ikonu */}
            <Headphones size={16} className="text-white/80 shrink-0" />

            {/* Küçük Müşteri Hizmetleri Yazısı */}
            <span className="text-xs font-medium text-white/80 tracking-tight">
              {t.customerService || "Müşteri Hizmetleri"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── 2. Full Page Body ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4 sm:p-6 overflow-hidden justify-between">
          
          {/* DURUM 1: Müşteri Hizmetleri Onay Verdi (Aktif Sohbet Ekranı) */}
          {isApprovedAndActive ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 rounded-2xl bg-white/[0.02] border border-white/10 mb-3">
              {chat?.messages?.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-white text-black font-semibold rounded-br-none shadow-md"
                        : m.sender === "system"
                        ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 rounded-bl-none"
                        : "bg-white/10 text-white font-medium border border-white/15 rounded-bl-none shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[9px] opacity-60 mb-1 font-mono">
                      <span>
                        {m.sender === "user"
                          ? t.you || "Siz"
                          : m.sender === "system"
                          ? t.system || "Sistem"
                          : t.agent || "Müşteri Temsilcisi"}
                      </span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
          ) : isConnecting ? (
            /* DURUM 2: Butona Bastık -> Buton Kayboldu & Ortada Şık Dairesel Sayaç Başladı */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center space-y-3"
              >
                {/* Dairesel Sayaç */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#0ecb81"
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 - (201 * countdown) / 60}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-sm font-black font-mono text-white">
                    {countdown}s
                  </span>
                </div>

                {/* Altındaki Bekleniyor Yazısı */}
                <p className="text-xs font-medium text-white/80 tracking-tight">
                  {t.waitingForAgent || "Size uygun müşteri temsilcisi bekleniyor..."}
                </p>
                <p className="text-[10px] text-white/40">
                  {t.unlocksOnApproval || "Müşteri hizmetleri onay verince mesajlaşabilirsiniz..."}
                </p>
              </motion.div>
            </div>
          ) : (
            /* DURUM 3: Varsayılan Görünüm -> Ekranın Tam Ortasında Bağlan Tuşu */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
              <Headphones size={32} className="text-white/30" />
              <div>
                <p className="text-xs font-semibold text-white/70">
                  {t.welcomeLiveSupport || "Canlı destek hattına hoş geldiniz"}
                </p>
                <p className="text-[11px] text-white/40 mt-1 max-w-xs">
                  {t.clickToConnectDesc || "Temsilciye bağlanmak ve mesajlaşmayı aktifleştirmek için aşağıdaki butona tıklayın."}
                </p>
              </div>

              <button
                onClick={handleConnectAgent}
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneCall size={14} />
                <span>{t.connectToAgent || "Müşteri Temsilcisine Bağlan"}</span>
              </button>
            </div>
          )}

          {/* Yoğunluk Sistem Mesajı */}
          {chat?.status === "busy" && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-200/90">
              {t.busyMessage || "Müşteri hizmetlerimiz şu an yoğun, lütfen daha sonra tekrar deneyiniz."}
            </div>
          )}

          {/* ── Alt Mesajlaşma Alanı (Sadece Müşteri Hizmetleri Onay Verince Aktifleşir) ── */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={inputText}
                disabled={!isApprovedAndActive}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isApprovedAndActive
                    ? t.typeYourMessage || "Mesajınızı yazınız..."
                    : t.unlocksOnApproval || "Müşteri hizmetleri onay verince mesajlaşabilirsiniz..."
                }
                className={`w-full px-4 py-3 rounded-2xl border text-xs text-white placeholder:text-white/30 outline-none transition-all ${
                  isApprovedAndActive
                    ? "bg-white/[0.06] border-white/15 focus:border-white/30"
                    : "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed pr-9"
                }`}
              />
              {!isApprovedAndActive && (
                <Lock size={14} className="absolute right-3.5 text-white/30 pointer-events-none" />
              )}
            </div>

            <button
              type="submit"
              disabled={!isApprovedAndActive || !inputText.trim()}
              className="h-11 px-5 rounded-2xl bg-white/15 border border-white/20 text-white hover:bg-white/25 disabled:opacity-30 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>{t.sendMsg || "Gönder"}</span>
              <Send size={14} />
            </button>
          </form>

        </div>
      </div>
    </AnimatePresence>
  );
}
