import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Headphones,
  Send,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Bot,
  BellRing,
  PhoneCall,
  Check,
} from "lucide-react";
import {
  SupportChat,
  listenAllSupportChats,
  sendAdminSupportReply,
  sendAdminBusyResponse,
  approveAndConnectSupportChat,
} from "@/lib/support";

export function AdminSupportTab() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  /* Listen to all user support chats in real-time */
  useEffect(() => {
    const unsub = listenAllSupportChats((allChats) => {
      setChats(allChats);
      if (allChats.length > 0 && !selectedChatId) {
        setSelectedChatId(allChats[0].id);
      }
    });
    return () => unsub();
  }, [selectedChatId]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  /* Auto-scroll to bottom of chat */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  /* Approve user connection and unlock chat */
  const handleApproveConnection = async () => {
    if (!selectedChatId) return;
    setIsSending(true);
    await approveAndConnectSupportChat(selectedChatId);
    setIsSending(false);
  };

  /* Send Custom Admin Reply */
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !replyText.trim()) return;

    setIsSending(true);
    await sendAdminSupportReply(selectedChatId, replyText.trim());
    setIsSending(false);
    setReplyText("");
  };

  /* Send Busy Auto-Reply ("Müşteri Hizmetleri Yoğun") */
  const handleSendBusyReply = async () => {
    if (!selectedChatId) return;
    setIsSending(true);
    await sendAdminBusyResponse(selectedChatId);
    setIsSending(false);
  };

  const filteredChats = chats.filter(
    (c) =>
      c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[500px] gap-4">
      {/* ── Left Sidebar: User Support List ───────────────────────────────────── */}
      <div className="w-full lg:w-80 flex flex-col rounded-3xl bg-[#111319] border border-white/10 overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/10 bg-[#161822]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-[#0ecb81]" />
              <h3 className="text-sm font-black text-white">Destek Mesajları</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-black text-white">
              {chats.length}
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Kullanıcı veya mesaj ara..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30">
              Destek mesajı bulunamadı.
            </div>
          ) : (
            filteredChats.map((c) => {
              const isSelected = c.id === selectedChatId;
              const isWaiting = c.status === "waiting";
              const isBusy = c.status === "busy";

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-white/10 border-white/30 text-white shadow-lg"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white truncate max-w-[170px]">
                      {c.userName || c.userEmail}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        isWaiting
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                          : isBusy
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30"
                      }`}
                    >
                      {isWaiting ? "Bekliyor" : isBusy ? "Yoğun" : "Aktif"}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 truncate">
                    {c.lastMessage || "Mesaj yok"}
                  </p>

                  <div className="flex items-center justify-between text-[9.5px] text-white/30 pt-1 font-mono">
                    <span>{c.userEmail}</span>
                    <span>
                      {c.lastUpdated
                        ? new Date(c.lastUpdated).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Selected Chat Details & Reply Controls ──────────────── */}
      <div className="flex-1 flex flex-col rounded-3xl bg-[#111319] border border-white/10 overflow-hidden">
        {!selectedChat ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white/30">
            <MessageSquare size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Lütfen yanıtlamak istediğiniz kullanıcıyı seçin</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-[#161822] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{selectedChat.userName}</h4>
                  <p className="text-xs text-white/50">{selectedChat.userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Approve & Connect Button */}
                {selectedChat.status === "waiting" && (
                  <button
                    onClick={handleApproveConnection}
                    disabled={isSending}
                    className="px-3.5 py-2 rounded-xl bg-[#0ecb81] hover:bg-[#0bb371] text-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg animate-pulse"
                    title="Kullanıcının canlı destek talebini onaylar ve mesajlaşmayı aktifleştirir"
                  >
                    <Check size={14} />
                    <span>Talebi Onayla & Sohbete Bağlan</span>
                  </button>
                )}

                {/* Busy Auto-Reply Button */}
                <button
                  onClick={handleSendBusyReply}
                  disabled={isSending}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  title="Kullanıcıya 'Müşteri Hizmetleri Yoğun' otomatik mesajını gönderir"
                >
                  <AlertTriangle size={14} />
                  <span>Müşteri Hizmetleri Yoğun</span>
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#0a0b0f]">
              {selectedChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "admin"
                      ? "items-end"
                      : m.sender === "system"
                      ? "items-center"
                      : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs ${
                      m.sender === "admin"
                        ? "bg-white text-black font-black rounded-br-none shadow-md"
                        : m.sender === "system"
                        ? "bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30"
                        : "bg-white/10 text-white rounded-bl-none border border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[9.5px] opacity-70 mb-1 font-mono">
                      <span>
                        {m.sender === "admin"
                          ? "Yönetici (Siz)"
                          : m.sender === "system"
                          ? "Sistem Mesajı"
                          : selectedChat.userName}
                      </span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-white/10 bg-[#161822] flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Kullanıcıya mesaj yanıtı yazın (Onaylayıp bağlar)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-5 py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-white/90 disabled:opacity-30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>Gönder</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
