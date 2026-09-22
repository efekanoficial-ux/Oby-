import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ObyoUser, ObyoRequest, PaymentSettings, CustomPaymentMethod } from "@/context/AuthContext";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Check, X, LogOut,
  Shield, Clock, ChevronDown, ChevronUp, Filter, TrendingUp,
  PlusCircle, Settings, Landmark, Zap, Bitcoin, Save, AlertCircle,
  RefreshCw, CheckCircle2, Plus, Trash2, Edit3, Wallet, CreditCard,
  QrCode, CircleDollarSign, Eye, EyeOff, Search, AlertTriangle,
  FileText, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, Maximize2,
  Send, Bot, Bell, Key, Copy, CheckCheck, MessageSquare, Trophy,
  Gift, Sparkles, Coins
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Tournament,
  DEFAULT_TOURNAMENTS,
  listenTournaments,
  saveTournament,
  resetTournamentsToDefault,
} from "@/lib/tournaments";
import {
  Bonus,
  listenBonuses,
  saveBonus,
  deleteBonus,
} from "@/lib/bonuses";
import { AdminBonusesTab } from "@/components/admin/AdminBonusesTab";

type AdminTab  = "requests" | "users" | "tournaments" | "bonuses" | "settings" | "telegram";
type ReqFilter = "all" | "deposit" | "withdraw" | "pending";

function StatusBadge({ status }: { status: ObyoRequest["status"] }) {
  const cfg = {
    pending:  { bg: "rgba(255,184,0,0.12)",  border: "#FFB80030", color: "#FFB800", label: "Bekliyor"   },
    accepted: { bg: "rgba(14,203,129,0.12)", border: "#0ecb8130", color: "#0ecb81", label: "Onaylandı"  },
    rejected: { bg: "rgba(246,70,93,0.12)",  border: "#f6465d30", color: "#f6465d", label: "Reddedildi" },
  }[status];
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-white/60 select-none">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[#0ecb81]" : "bg-white/15"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function CustomPaymentIcon({ iconType, size = 18 }: { iconType?: string; size?: number }) {
  if (iconType === "bank") return <Landmark size={size} />;
  if (iconType === "crypto") return <Bitcoin size={size} />;
  if (iconType === "card") return <CreditCard size={size} />;
  if (iconType === "qr") return <QrCode size={size} />;
  if (iconType === "dollar") return <CircleDollarSign size={size} />;
  return <Wallet size={size} />;
}

const COLOR_OPTIONS = [
  { label: "Mor", value: "#9B51E0" },
  { label: "Yeşil", value: "#0ecb81" },
  { label: "Turuncu", value: "#FF6B00" },
  { label: "Mavi", value: "#2F80ED" },
  { label: "Sarı", value: "#FFB800" },
  { label: "Kırmızı", value: "#EB5757" },
  { label: "Pembe", value: "#E91E63" },
  { label: "Turkuaz", value: "#00C49F" },
];

const ICON_OPTIONS = [
  { id: "wallet", label: "Cüzdan", icon: Wallet },
  { id: "bank", label: "Banka", icon: Landmark },
  { id: "crypto", label: "Kripto", icon: Bitcoin },
  { id: "card", label: "Kredi Kartı", icon: CreditCard },
  { id: "qr", label: "Karekod", icon: QrCode },
  { id: "dollar", label: "Nakit/Dolar", icon: CircleDollarSign },
];

export default function Admin() {
  const [, navigate] = useLocation();
  const {
    users,
    requests,
    processRequest,
    addBalanceDirect,
    logout,
    isAdmin,
    ready,
    paymentSettings,
    updatePaymentSettings,
    adminUpdateKYC,
    deleteUserPermanently,
    deleteRequest,
    triggerTelegramNotify,
  } = useAuth();

  useEffect(() => {
    if (ready && !isAdmin) navigate("/auth");
  }, [ready, isAdmin, navigate]);

  const [tab, setTab] = useState<AdminTab>("requests");
  const [filter, setFilter] = useState<ReqFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processingReq, setProcessingReq] = useState<string | null>(null);

  /* Delete Request / Reset Stats state */
  const [reqToDelete, setReqToDelete] = useState<string | null>(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);
  const [showStatsResetConfirm, setShowStatsResetConfirm] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);

  /* Request Rejection Modal state */
  const [rejectModalReq, setRejectModalReq] = useState<ObyoRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  /* Receipt Lightbox Viewer state */
  const [viewingReceipt, setViewingReceipt] = useState<{
    url: string;
    name: string;
    reqId?: string;
    userName?: string;
    amount?: number;
    currency?: string;
    status?: ObyoRequest["status"];
  } | null>(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [receiptRotation, setReceiptRotation] = useState(0);

  /* Payment Settings Form state */
  const [formSettings, setFormSettings] = useState<PaymentSettings>(paymentSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  /* Custom Payment Method modal and editing state */
  const [editingCustomMethod, setEditingCustomMethod] = useState<CustomPaymentMethod | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  /* Tournament Management Admin State */
  const [tournaments, setTournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [tourSaveMsg, setTourSaveMsg] = useState<string | null>(null);
  const [isSavingTour, setIsSavingTour] = useState(false);

  useEffect(() => {
    const unsub = listenTournaments((list) => {
      setTournaments(list);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const handleSaveTournament = async (t: Tournament) => {
    setIsSavingTour(true);
    const res = await saveTournament(t);
    setIsSavingTour(false);
    if (res.success) {
      setTourSaveMsg(`"${t.title}" başarıyla güncellendi!`);
      setEditingTournament(null);
      setTimeout(() => setTourSaveMsg(null), 3500);
    } else {
      alert("Turnuva kaydedilemedi: " + (res.error || "Bilinmeyen hata"));
    }
  };

  const handleResetTournaments = async () => {
    if (confirm("Tüm turnuvalar varsayılan ayarlara, isimlere ve resimlere sıfırlansın mı?")) {
      setIsSavingTour(true);
      await resetTournamentsToDefault();
      setIsSavingTour(false);
      setTourSaveMsg("Turnuvalar varsayılana sıfırlandı!");
      setTimeout(() => setTourSaveMsg(null), 3500);
    }
  };

  // Keep local form in sync with remote payment settings when loaded
  useEffect(() => {
    setFormSettings(paymentSettings);
  }, [paymentSettings]);

  const handleOpenNewCustomMethod = () => {
    setEditingCustomMethod({
      id: "cm_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      enabled: true,
      name: "",
      subtitle: "",
      badge: "",
      color: "#9B51E0",
      iconType: "wallet",
      currency: "TL",
      minAmount: 100,
      accountHolder: "",
      accountNumber: "",
      transferCode: "",
      qrCode: "",
      notes: "",
    });
    setIsCustomModalOpen(true);
  };

  const handleEditCustomMethod = (method: CustomPaymentMethod) => {
    setEditingCustomMethod({ ...method });
    setIsCustomModalOpen(true);
  };

  const handleDeleteCustomMethod = (id: string) => {
    if (confirm("Bu ödeme yöntemini silmek istediğinize emin misiniz?")) {
      setFormSettings(prev => ({
        ...prev,
        customMethods: (prev.customMethods || []).filter(m => m.id !== id)
      }));
    }
  };

  const handleToggleCustomMethod = (id: string) => {
    setFormSettings(prev => ({
      ...prev,
      customMethods: (prev.customMethods || []).map(m =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      )
    }));
  };

  const handleSaveCustomMethodInModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomMethod || !editingCustomMethod.name.trim()) return;

    setFormSettings(prev => {
      const list = prev.customMethods || [];
      const idx = list.findIndex(m => m.id === editingCustomMethod.id);
      let updatedList: CustomPaymentMethod[];
      if (idx >= 0) {
        updatedList = [...list];
        updatedList[idx] = editingCustomMethod;
      } else {
        updatedList = [...list, editingCustomMethod];
      }
      return { ...prev, customMethods: updatedList };
    });

    setIsCustomModalOpen(false);
    setEditingCustomMethod(null);
  };

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setEditingCustomMethod(prev => prev ? ({ ...prev, qrCode: dataUrl }) : null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /* Direct balance per-user input state */
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);

  /* User search and delete state */
  const [userSearch, setUserSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<ObyoUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userDeleteSuccess, setUserDeleteSuccess] = useState<string | null>(null);

  const handleDeleteUserPermanently = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserPermanently(userToDelete.id, userToDelete.email);
      if (res.success) {
        setUserDeleteSuccess(`${userToDelete.name} ${userToDelete.surname} (${userToDelete.email}) ve tüm kullanıcı verileri kalıcı olarak silindi.`);
        setUserToDelete(null);
        setTimeout(() => setUserDeleteSuccess(null), 5000);
      } else {
        alert("Silme işlemi başarısız: " + (res.error || "Bilinmeyen hata"));
      }
    } catch (err: any) {
      alert("Hata oluştu: " + (err?.message || err));
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/auth"); };

  const filteredReqs = requests.filter(r => {
    if (filter === "deposit")  return r.type === "deposit";
    if (filter === "withdraw") return r.type === "withdraw";
    if (filter === "pending")  return r.status === "pending";
    return true;
  });

  const pendingReqs     = requests.filter(r => r.status === "pending");
  const pendingCount    = pendingReqs.length;
  const totalDeposited  = requests
    .filter(r => r.type === "deposit" && r.status === "accepted")
    .reduce((s, r) => s + r.amount, 0);

  const displayedUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    const fullName = `${u.name || ""} ${u.surname || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const id = (u.id || "").toLowerCase();
    return fullName.includes(q) || email.includes(q) || id.includes(q);
  });

  const handleAddBalance = async (userId: string, userName: string, userEmail: string) => {
    const raw = parseFloat(addAmounts[userId] ?? "");
    if (!raw || raw <= 0) return;
    setAdding(userId);
    try {
      await addBalanceDirect(userId, raw, userName, userEmail);
      setAddAmounts(prev => ({ ...prev, [userId]: "" }));
    } finally {
      setAdding(null);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const res = await updatePaymentSettings(formSettings);
      if (res.success) {
        setSettingsSaveMsg("Hesap ve cüzdan bilgileri başarıyla güncellendi.");
      } else {
        setSettingsSaveMsg(`Hata: ${res.error || "Güncellenemedi"}`);
      }
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    }
  };

  /* Telegram Bot settings state */
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showBotToken, setShowBotToken] = useState(false);
  const [telegramSaveMsg, setTelegramSaveMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const handleSaveTelegramSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setTelegramSaveMsg(null);
    try {
      const res = await updatePaymentSettings({
        telegramEnabled: formSettings.telegramEnabled !== false,
        telegramBotToken: formSettings.telegramBotToken?.trim() || "",
        telegramChatId: formSettings.telegramChatId?.trim() || "",
        telegramNotifyDeposits: formSettings.telegramNotifyDeposits !== false,
        telegramNotifyWithdrawals: formSettings.telegramNotifyWithdrawals !== false,
        telegramNotifyRegistrations: formSettings.telegramNotifyRegistrations !== false,
        telegramNotifyKyc: formSettings.telegramNotifyKyc !== false,
      });
      if (res.success) {
        setTelegramSaveMsg("Telegram bot ayarları başarıyla kaydedildi.");
      } else {
        setTelegramSaveMsg(`Hata: ${res.error || "Kaydedilemedi"}`);
      }
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setTelegramSaveMsg(null), 4000);
    }
  };

  const handleSendTestTelegram = async () => {
    const token = formSettings.telegramBotToken?.trim();
    const chat = formSettings.telegramChatId?.trim();
    if (!token || !chat) {
      setTelegramTestResult({
        ok: false,
        message: "Lütfen test göndermeden önce Bot Token ve Chat ID alanlarını doldurunuz.",
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await triggerTelegramNotify({
        type: "test",
        botToken: token,
        chatId: chat,
      });
      if (res.ok) {
        setTelegramTestResult({
          ok: true,
          message: res.message || "Test bildirimi Telegram'a başarıyla gönderildi! Lütfen Telegram uygulamanızı kontrol edin.",
        });
      } else {
        setTelegramTestResult({
          ok: false,
          message: res.error || "Telegram mesajı gönderilemedi. Token ve Chat ID bilgilerinizi kontrol ediniz.",
        });
      }
    } catch (err: any) {
      setTelegramTestResult({
        ok: false,
        message: err?.message || "Bağlantı hatası oluştu.",
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'trc20QrCode' | 'erc20QrCode') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setFormSettings(prev => ({ ...prev, [field]: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0 bg-black z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Obyo" className="h-8 w-8 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(255,107,0,0.25)]" />
          <div>
            <p className="text-sm font-black text-white leading-none">Admin Panel</p>
            <p className="text-[10px] text-[#FF6B00] font-bold">admin@obyo.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)" }}>
            <Shield size={10} className="text-[#0ecb81]" />
            <span className="text-[10px] font-black text-[#0ecb81]">Admin</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#f6465d] border border-[#f6465d]/20 hover:bg-[#f6465d]/5 transition-colors cursor-pointer">
            <LogOut size={12} /> Çıkış
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-[#111]">
        {[
          { label: "Toplam Kullanıcı", value: users.length,                     icon: Users,      color: "#627EEA" },
          { label: "Bekleyen İstek",   value: pendingCount,                     icon: Clock,      color: "#FFB800" },
          { label: "Toplam Yatırım",   value: `${totalDeposited.toFixed(0)}`,  icon: TrendingUp, color: "#0ecb81" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-col gap-1 rounded-2xl p-3 relative group"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} style={{ color: s.color }} />
                  <span className="text-[9px] font-bold text-white/30 uppercase">{s.label}</span>
                </div>
                {s.label === "Toplam Yatırım" && (
                  <button
                    onClick={() => setShowStatsResetConfirm(true)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-500 cursor-pointer p-1"
                    title="Sıfırla (Onaylanmış Yatırımları Sil)"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <span className="text-lg font-black truncate" style={{ color: s.color }}>{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#111] shrink-0 overflow-x-auto no-scrollbar">
        {([
          { id: "requests",    label: "İstekler",     badge: pendingCount },
          { id: "users",       label: "Kullanıcılar"                      },
          { id: "tournaments", label: "Turnuvalar",   isTour: true        },
          { id: "bonuses",     label: "Bonuslar",     isBonus: true       },
          { id: "settings",    label: "Cüzdanlar"                         },
          { id: "telegram",    label: "Telegram",     isTelegram: true    },
        ] as { id: AdminTab; label: string; badge?: number; isTelegram?: boolean; isTour?: boolean; isBonus?: boolean }[]).map(t => {
          const isActive = tab === t.id;
          const isTgConfigured = Boolean(formSettings.telegramBotToken?.trim() && formSettings.telegramChatId?.trim());
          const activeColor = t.isTelegram ? "#2AABEE" : t.isTour ? "#A855F7" : t.isBonus ? "#FF6B00" : "#FF6B00";
          return (
            <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
              className="flex items-center gap-1.5 justify-center py-3 px-4 text-xs font-black relative cursor-pointer select-none whitespace-nowrap flex-1 md:flex-none"
              style={{ color: isActive ? activeColor : "#555" }}>
              {t.isTelegram && (
                <Send size={13} className={`shrink-0 ${isActive ? "text-[#2AABEE]" : "text-[#2AABEE]/60"}`} />
              )}
              {t.isTour && (
                <Trophy size={13} className={`shrink-0 ${isActive ? "text-[#A855F7]" : "text-[#A855F7]/60"}`} />
              )}
              {t.isBonus && (
                <Gift size={13} className={`shrink-0 ${isActive ? "text-[#FF6B00]" : "text-[#FF6B00]/60"}`} />
              )}
              <span>{t.label}</span>
              {t.isTelegram && (
                <span
                  title={isTgConfigured ? "Bot Aktif" : "Yapılandırılmadı"}
                  className={`h-2 w-2 rounded-full shrink-0 ${isTgConfigured ? "bg-[#0ecb81] shadow-[0_0_8px_rgba(14,203,129,0.6)]" : "bg-amber-400"}`}
                />
              )}
              {t.badge ? (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-black"
                  style={{ background: "#FFB800" }}>{t.badge}</span>
              ) : null}
              {isActive && (
                <motion.div layoutId="admin-tab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: activeColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-20 touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* ── REQUESTS tab ──────────────────────────────────────────────── */}
        {tab === "requests" && (
          <div className="p-4 flex flex-col gap-3">

            {/* Bekleyen İstekler Bildirim Kartı (Kalıcı ve Kaydırılabilir) */}
            {pendingCount > 0 && (
              <div className="rounded-2xl p-4 border border-[#FFB800]/30 bg-[#FFB800]/[0.08] relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#FFB800] animate-ping" />
                    <span className="text-xs font-black text-[#FFB800]">
                      {pendingCount} Bekleyen Onay Talebi Var
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-white/40">
                    Aşağı kaydırarak tüm talepleri inceleyebilirsiniz ↓
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Talepleri onaylayabilir veya reddedebilirsiniz. İncelemek istediğiniz işleme tıklayarak detayları açabilirsiniz.
                </p>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: "all",      label: "Tümü"    },
                  { id: "pending",  label: `Bekleyen (${pendingCount})` },
                  { id: "deposit",  label: "Yatırma"  },
                  { id: "withdraw", label: "Çekme"    },
                ] as { id: ReqFilter; label: string }[]).map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className="rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer"
                    style={{
                      background: filter === f.id ? "#FF6B00" : "#111",
                      color:      filter === f.id ? "#000"    : "#777",
                      border:     filter === f.id ? "1px solid #FF6B00" : "1px solid #1e1e1e",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-white/30">{filteredReqs.length} kayıt</span>
            </div>

            {filteredReqs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={28} className="text-white/10 mb-3" />
                <p className="text-sm text-white/20 font-bold">Kayıt bulunamadı</p>
              </div>
            )}

            {filteredReqs.map(req => {
              const isDeposit = req.type === "deposit";
              const color     = isDeposit ? "#0ecb81" : "#FF6B00";
              const isOpen    = expanded === req.id;
              const matchingUser = users.find(u => u.id === req.userId || u.email?.toLowerCase() === req.userEmail?.toLowerCase());
              const isReqTL   = req.currency === "TL" || matchingUser?.currency === "TL";
              const reqSym    = isReqTL ? "₺" : "$";

              return (
                <motion.div key={req.id} layout
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                  <button onClick={() => setExpanded(isOpen ? null : req.id)}
                    className="flex items-center gap-3 w-full p-4 text-left cursor-pointer">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}12` }}>
                      {isDeposit
                        ? <ArrowDownCircle size={16} style={{ color }} />
                        : <ArrowUpCircle  size={16} style={{ color }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{req.userName}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black shrink-0 border ${
                          isReqTL 
                            ? "bg-[#FF6B00]/15 text-[#FF6B00] border-[#FF6B00]/30" 
                            : "bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/30"
                        }`}>
                          {isReqTL ? "₺ TL Hesabı" : "$ Dolar Hesabı"}
                        </span>
                        <StatusBadge status={req.status} />
                        {req.receiptUrl && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30 flex items-center gap-1">
                            <FileText size={10} /> Dekont Var
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black" style={{ color }}>
                          {isDeposit ? "+" : "-"}{reqSym}{req.amount} ({isReqTL ? "TL" : "USD"})
                        </span>
                        <span className="text-[10px] text-white/25">· {req.method}</span>
                      </div>
                      {req.status === "rejected" && req.rejectionReason && (
                        <div className="mt-1 text-[11px] text-[#f6465d] flex items-center gap-1 font-medium truncate max-w-sm">
                          <AlertCircle size={11} className="shrink-0" />
                          <span className="truncate">Red: {req.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-white/25">
                        {format(req.createdAt, "dd MMM HH:mm", { locale: tr })}
                      </span>
                      {isOpen ? <ChevronUp size={13} className="text-white/25" /> : <ChevronDown size={13} className="text-white/25" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[#1a1a1a]">
                        <div className="p-4 flex flex-col gap-3">
                          {[
                            { label: "İstek ID",      value: req.id        },
                            { label: "Kullanıcı ID",  value: req.userId    },
                            { label: "Ad Soyad",      value: req.userName  },
                            { label: "E-posta",       value: req.userEmail },
                            ...(req.type === "withdraw" && req.destination
                              ? [{ label: req.method?.includes("IBAN") || req.method?.includes("EFT") ? "IBAN Numarası" : "Cüzdan Adresi", value: req.destination }]
                              : []),
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between">
                              <span className="text-xs text-white/30">{row.label}</span>
                              <span className="text-xs font-mono text-white/60 truncate ml-4 max-w-[200px]">{row.value}</span>
                            </div>
                          ))}

                          {/* ── Dekont İnceleme Bölümü ── */}
                          {req.receiptUrl ? (
                            <div className="p-3.5 rounded-2xl border border-[#0ecb81]/30 bg-[#0ecb81]/[0.05] flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText size={15} className="text-[#0ecb81]" />
                                  <span className="text-xs font-black text-white">Transfer / Havale Dekontu</span>
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30">
                                    Kullanıcı Yükledi ✓
                                  </span>
                                </div>
                                {req.receiptName && (
                                  <span className="text-[10px] text-white/40 font-mono truncate max-w-[180px]">
                                    {req.receiptName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Tıklanabilir Küçük Önizleme */}
                                <div
                                  onClick={() => {
                                    setViewingReceipt({
                                      url: req.receiptUrl!,
                                      name: req.receiptName || `${req.userName} - Dekont`,
                                      reqId: req.id,
                                      userName: req.userName,
                                      amount: req.amount,
                                      currency: req.currency,
                                      status: req.status,
                                    });
                                    setReceiptZoom(1);
                                    setReceiptRotation(0);
                                  }}
                                  className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/15 bg-black/60 w-24 h-20 shrink-0 flex items-center justify-center shadow-md"
                                  title="Büyük boyutta incelemek için tıklayın"
                                >
                                  <img
                                    src={req.receiptUrl}
                                    alt="Dekont Önizleme"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                                    <Eye size={16} className="text-white" />
                                    <span className="text-[9px] font-bold text-white">Büyüt</span>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                  <p className="text-xs text-white/70 font-medium leading-relaxed">
                                    Kullanıcı havale transfer dekontunu sisteme yükledi. Tutar ve açıklamayı kontrol edebilirsiniz.
                                  </p>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingReceipt({
                                          url: req.receiptUrl!,
                                          name: req.receiptName || `${req.userName} - Dekont`,
                                          reqId: req.id,
                                          userName: req.userName,
                                          amount: req.amount,
                                          currency: req.currency,
                                          status: req.status,
                                        });
                                        setReceiptZoom(1);
                                        setReceiptRotation(0);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ecb81]/20 hover:bg-[#0ecb81]/30 text-[#0ecb81] text-xs font-black transition-all cursor-pointer"
                                    >
                                      <Eye size={13} />
                                      <span>Dekontu İncele (Tam Ekran)</span>
                                    </button>
                                    <a
                                      href={req.receiptUrl}
                                      download={req.receiptName || `dekont_${req.userName.replace(/\s+/g, "_")}.jpg`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer"
                                    >
                                      <Download size={13} />
                                      <span>İndir</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            (req.type === "deposit" && (req.method?.toLowerCase().includes("iban") || req.method?.toLowerCase().includes("havale"))) && (
                              <div className="p-3 rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/[0.05] flex items-center gap-2.5 text-xs text-[#FFB800]">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>Bu havale talebinde kullanıcı dekont yüklememiş.</span>
                              </div>
                            )
                          )}

                          {/* Reddedilme Sebebi (Eğer reddedildiyse) */}
                          {req.status === "rejected" && (
                            <div className="p-3 rounded-xl bg-[#f6465d]/10 border border-[#f6465d]/20 text-xs">
                              <div className="flex items-center gap-1.5 text-[#f6465d] font-bold mb-1">
                                <AlertCircle size={13} className="shrink-0" />
                                <span>Kullanıcıya İletilen Red Sebebi:</span>
                              </div>
                              <p className="text-white/80 font-medium leading-relaxed pl-5">
                                {req.rejectionReason || "Sebep belirtilmedi."}
                              </p>
                            </div>
                          )}

                          {/* İsteğe bağlı Onay / Red Butonları — Kaldırılabilir / Esnek Yönetim */}
                          {req.status === "pending" && (
                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                              <span className="text-[10px] font-bold text-white/40 uppercase">İşlem Onayı</span>
                              <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.97 }}
                                  disabled={processingReq === req.id}
                                  onClick={async () => {
                                    setProcessingReq(req.id);
                                    await processRequest(req.id, true);
                                    setProcessingReq(null);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-black disabled:opacity-50 cursor-pointer shadow-md"
                                  style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)" }}>
                                  <Check size={13} /> {processingReq === req.id ? "İşleniyor..." : "Onayla ve Bakiyeyi Güncelle"}
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.97 }}
                                  disabled={processingReq === req.id}
                                  onClick={() => {
                                    setRejectModalReq(req);
                                    setRejectReason(req.type === "withdraw" ? "Lütfen para yatırımı oluşturup çekim talebi verin." : "");
                                  }}
                                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-50 cursor-pointer hover:bg-[#f6465d]/25 transition-all"
                                  style={{ background: "rgba(246,70,93,0.15)", border: "1px solid rgba(246,70,93,0.25)" }}>
                                  <X size={13} className="text-[#f6465d]" /> Reddet...
                                </motion.button>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                            <button
                              onClick={() => setReqToDelete(req.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs font-bold"
                            >
                              <Trash2 size={12} /> Talebi Sil
                            </button>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── USERS tab ─────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="p-4 flex flex-col gap-3">
            {/* Delete Success Notification */}
            {userDeleteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-[#0ecb81]/30 bg-[#0ecb81]/10 text-xs font-bold text-[#0ecb81]"
              >
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{userDeleteSuccess}</span>
              </motion.div>
            )}

            {/* Search Bar */}
            {users.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-[#0d0d0d] border border-[#1e1e1e] px-3.5 py-2.5 text-sm text-white focus-within:border-[#FF6B00]/40 transition-colors">
                <Search size={16} className="text-white/30 shrink-0" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara (İsim, e-posta, ID)..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/25 outline-none"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch("")}
                    className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={28} className="text-white/10 mb-3" />
                <p className="text-sm text-white/20 font-bold">Henüz kayıtlı kullanıcı yok</p>
              </div>
            )}

            {users.length > 0 && displayedUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#0d0d0d] rounded-2xl border border-[#1a1a1a] p-6">
                <Users size={24} className="text-white/20 mb-2" />
                <p className="text-sm text-white/40 font-bold">"{userSearch}" ile eşleşen kullanıcı bulunamadı</p>
                <button
                  onClick={() => setUserSearch("")}
                  className="mt-3 text-xs text-[#FF6B00] hover:underline font-bold cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              </div>
            )}

            {displayedUsers.map(u => {
              const isOpen  = expanded === u.id;
              const pending = requests.filter(r => (r.userId === u.id || r.userEmail?.toLowerCase() === u.email?.toLowerCase()) && r.status === "pending").length;
              const isAddingThis = adding === u.id;
              const isUserTL = u.currency === "TL";
              const userSym = isUserTL ? "₺" : "$";

              return (
                <motion.div key={u.id} layout
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="flex items-center gap-3 w-full p-4 text-left cursor-pointer hover:bg-white/[0.01] transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-black overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        `${u.name.charAt(0)}${u.surname.charAt(0)}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white truncate">{u.name} {u.surname}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black shrink-0 border ${
                          isUserTL 
                            ? "bg-[#FF6B00]/15 text-[#FF6B00] border-[#FF6B00]/30" 
                            : "bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/30"
                        }`}>
                          {isUserTL ? "₺ TL Hesabı" : "$ Dolar Hesabı"}
                        </span>
                        {pending > 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-black shrink-0"
                            style={{ background: "#FFB800" }}>{pending}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 truncate block">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-black text-[#0ecb81]">
                          {userSym}{(u.realBalance ?? 0).toLocaleString(isUserTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-white/40 font-bold">
                          {isUserTL ? "TL Gerçek" : "USD Gerçek"}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Kullanıcıyı Sil"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserToDelete(u);
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                      {isOpen ? <ChevronUp size={13} className="text-white/25 shrink-0" /> : <ChevronDown size={13} className="text-white/25 shrink-0" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[#1a1a1a]">
                        <div className="p-4 flex flex-col gap-3">
                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Hesap Para Birimi", value: isUserTL ? "₺ Türk Lirası (TL Hesabı)" : "$ Amerikan Doları (USD Hesabı)", full: true },
                              { label: "Kullanıcı ID",   value: u.id,                                       full: true },
                              { label: "E-posta",        value: u.email,                                    full: true },
                              ...(u.tcKimlik || u.idNumber ? [{ label: "T.C. Kimlik No", value: u.tcKimlik || u.idNumber, full: false }] : []),
                              ...(u.referralCode ? [{ label: "Referans Kodu", value: u.referralCode, full: false }] : []),
                              { label: "Doğum Tarihi",   value: u.birthDate                                            },
                              { label: "Kayıt Tarihi",   value: format(u.createdAt, "dd.MM.yyyy")                      },
                              { label: "Demo Bakiye",    value: `${userSym}${(u.demoBalance ?? 0).toFixed(2)}`          },
                              { label: "Gerçek Bakiye",  value: `${userSym}${(u.realBalance ?? 0).toFixed(2)}`          },
                              { label: "Turnuva Bakiyesi", value: `${(u.tournamentBalance ?? 100).toFixed(2)} ¥`       },
                              { label: "Toplam Yatırım", value: `${userSym}${(u.totalDeposited ?? 0).toFixed(2)}`       },
                              { label: "Toplam Çekim",   value: `${userSym}${(u.totalWithdrawn ?? 0).toFixed(2)}`       },
                            ].map(row => (
                              <div key={row.label} className={`flex flex-col gap-0.5 rounded-xl p-2.5 ${row.full ? "col-span-2" : ""}`}
                                style={{ background: "#111", border: "1px solid #1e1e1e" }}>
                                <span className="text-[9px] font-bold text-white/25 uppercase">{row.label}</span>
                                <span className="text-xs font-bold text-white/70 break-all">{row.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* KYC / Kimlik Doğrulama Bölümü */}
                          <div className="rounded-xl p-3.5 flex flex-col gap-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-white/40 uppercase">Kimlik Doğrulama (KYC)</span>
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-black"
                                style={{
                                  backgroundColor: u.kycStatus === "verified" ? "rgba(14,203,129,0.12)" : u.kycStatus === "pending" ? "rgba(255,184,0,0.12)" : u.kycStatus === "rejected" ? "rgba(246,70,93,0.12)" : "rgba(255,255,255,0.04)",
                                  color: u.kycStatus === "verified" ? "#0ecb81" : u.kycStatus === "pending" ? "#FFB800" : u.kycStatus === "rejected" ? "#f6465d" : "#777"
                                }}>
                                {u.kycStatus === "verified" ? "Doğrulanmış" : u.kycStatus === "pending" ? "Onay Bekliyor" : u.kycStatus === "rejected" ? "Reddedildi" : "Başvuru Yok"}
                              </span>
                            </div>

                            {u.kycDetails ? (
                              <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-white/30">Ad Soyad (Kimlik):</span>
                                  <span className="font-bold text-white/80">{u.kycDetails.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/30">Doğum Tarihi:</span>
                                  <span className="font-bold text-white/80">{u.kycDetails.birthDate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/30">T.C. / Kimlik No:</span>
                                  <span className="font-bold text-white/80">{u.kycDetails.idNumber || "Belirtilmemiş"}</span>
                                </div>

                                {/* Kimlik Fotoğrafları */}
                                {(u.kycDetails.documentFrontUrl || u.kycDetails.documentBackUrl) && (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    <span className="text-[10px] text-white/20 font-bold uppercase">Kimlik Belgeleri</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      {u.kycDetails.documentFrontUrl && (
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] text-white/40">Ön Yüz</span>
                                          <a href={u.kycDetails.documentFrontUrl} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 aspect-video hover:opacity-85 transition-opacity">
                                            <img src={u.kycDetails.documentFrontUrl} alt="Kimlik Ön" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </a>
                                        </div>
                                      )}
                                      {u.kycDetails.documentBackUrl && (
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] text-white/40">Arka Yüz</span>
                                          <a href={u.kycDetails.documentBackUrl} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 aspect-video hover:opacity-85 transition-opacity">
                                            <img src={u.kycDetails.documentBackUrl} alt="Kimlik Arka" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Rejection Reason if any */}
                                {u.kycStatus === "rejected" && u.kycDetails?.rejectionReason && (
                                  <div className="rounded-lg p-2 mt-1 text-[11px] text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20">
                                    <span className="font-black">Red Nedeni:</span> {u.kycDetails.rejectionReason}
                                  </div>
                                )}

                                {/* Onay / Red Butonları */}
                                {u.kycStatus === "pending" && (
                                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={async () => {
                                        if (confirm(`${u.name} ${u.surname} kullanıcısının kimlik başvurusunu onaylamak istiyor musunuz?`)) {
                                          await adminUpdateKYC(u.id, "verified");
                                        }
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black text-black cursor-pointer"
                                      style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)" }}>
                                      <Check size={12} /> KYC Onayla
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={async () => {
                                        const r = prompt("Reddetme nedeni (Opsiyonel):") || "";
                                        await adminUpdateKYC(u.id, "rejected", r);
                                      }}
                                      className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white cursor-pointer"
                                      style={{ background: "rgba(246,70,93,0.15)", border: "1px solid rgba(246,70,93,0.25)" }}>
                                      <X size={12} className="text-[#f6465d]" /> KYC Reddet
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-white/30 italic">Henüz kimlik doğrulama başvurusu yapılmamış.</p>
                            )}
                          </div>

                          {/* Direct balance addition */}
                          <div className="rounded-xl p-3 flex flex-col gap-2"
                            style={{ background: "rgba(14,203,129,0.05)", border: "1px solid rgba(14,203,129,0.15)" }}>
                            <p className="text-[10px] font-black text-[#0ecb81] uppercase">
                              Doğrudan Bakiye Ekle ({isUserTL ? "₺ Türk Lirası" : "$ Amerikan Doları"})
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                placeholder={isUserTL ? "Miktar (₺ TL)" : "Miktar ($ USD)"}
                                value={addAmounts[u.id] ?? ""}
                                onChange={e => setAddAmounts(prev => ({ ...prev, [u.id]: e.target.value }))}
                                className="flex-1 rounded-xl bg-[#111] border border-[#1e1e1e] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#0ecb81]/40 transition-colors"
                              />
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                disabled={isAddingThis || !addAmounts[u.id] || parseFloat(addAmounts[u.id] ?? "0") <= 0}
                                onClick={() => handleAddBalance(u.id, `${u.name} ${u.surname}`, u.email)}
                                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-black disabled:opacity-40 transition-opacity cursor-pointer"
                                style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)" }}>
                                {isAddingThis
                                  ? <div className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                                  : <><PlusCircle size={13} /> Ekle</>
                                }
                              </motion.button>
                            </div>
                          </div>

                          {/* Tehlikeli Bölge - Kullanıcıyı Sil */}
                          <div className="rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#f6465d]/20 bg-[#f6465d]/5">
                            <div className="flex items-start gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-[#f6465d]/15 border border-[#f6465d]/25 flex items-center justify-center shrink-0 mt-0.5">
                                <Trash2 size={15} className="text-[#f6465d]" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-[#f6465d]">Kullanıcıyı ve Tüm Bilgilerini Sil</p>
                                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                                  Kullanıcı profili, demo ve gerçek bakiyeler, işlem geçmişi, açık pozisyonlar, para yatırma/çekme talepleri ve liderlik tablosu kayıtları kalıcı olarak tamamen silinir.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-[#f6465d] hover:bg-[#d63048] transition-all shrink-0 cursor-pointer shadow-lg shadow-[#f6465d]/20 active:scale-97"
                            >
                              <Trash2 size={13} />
                              <span>Kullanıcıyı Sil</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── TOURNAMENTS TAB (Turnuva Yönetimi) ─────────────────────────── */}
        {tab === "tournaments" && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Turnuva Yönetimi</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Liderlik sayfasındaki 5 borsa turnuvasının görsellerini, katılım ücretlerini ($ / ₺) ve başlangıç paralarını yönetin.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetTournaments}
                disabled={isSavingTour}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw size={13} className={isSavingTour ? "animate-spin" : ""} />
                Varsayılana Sıfırla
              </button>
            </div>

            {tourSaveMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3.5 rounded-2xl border border-[#0ecb81]/30 bg-[#0ecb81]/10 text-xs font-bold text-[#0ecb81]"
              >
                <CheckCircle2 size={16} />
                <span>{tourSaveMsg}</span>
              </motion.div>
            )}

            {/* Tournaments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.slice(0, 5).map((tour, idx) => (
                <div
                  key={tour.id}
                  className="rounded-2xl border border-white/10 bg-[#0d0d12] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image Banner */}
                    <div className="relative h-36 w-full overflow-hidden bg-black">
                      <img
                        src={tour.imageUrl}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-black/40 to-transparent" />
                      
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-black shadow">
                          VIP GEREKLİ
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-black border border-purple-400/30">
                          {tour.prizePool}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/80 font-bold">
                          #{idx + 1} Turnuva
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                          {tour.status === "active" ? "Aktif (1 Hafta)" : "Yakında"}
                        </span>
                      </div>
                    </div>

                    {/* Information */}
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white">{tour.title}</h4>
                        <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                          {tour.subtitle}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase block">Dolar Katılım</span>
                          <span className="font-mono font-bold text-white">${tour.entryFeeUSD} USD</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase block">TL Katılım</span>
                          <span className="font-mono font-bold text-[#FF6B00]">{tour.entryFeeTL.toLocaleString("tr-TR")} ₺</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase block">Turnuva Bakiyesi</span>
                          <span className="font-mono font-bold text-[#A855F7]">{tour.startingBalance} {tour.currencySymbol}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-white/30 uppercase block">Katılımcı Sayısı</span>
                          <span className="font-mono font-bold text-emerald-400">{tour.participantsCount} Yatırımcı</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => setEditingTournament({ ...tour })}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-black transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Turnuvayı Düzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── TOURNAMENT EDIT MODAL ── */}
            <AnimatePresence>
              {editingTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-lg rounded-3xl bg-[#0e0f14] border border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-purple-400" />
                        <h3 className="text-sm font-black text-white">Turnuva Düzenle</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingTournament(null)}
                        className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Modal Form Content */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingTournament) handleSaveTournament(editingTournament);
                      }}
                      className="p-5 overflow-y-auto flex flex-col gap-4 text-xs"
                    >
                      {/* Live Image Preview */}
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                          Turnuva Görsel Önizlemesi
                        </label>
                        <div className="h-32 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 relative">
                          <img
                            src={editingTournament.imageUrl}
                            alt="Önizleme"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80";
                            }}
                          />
                        </div>
                      </div>

                      {/* Image URL */}
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                          Resim Bağlantısı (URL)
                        </label>
                        <input
                          type="url"
                          required
                          value={editingTournament.imageUrl}
                          onChange={(e) => setEditingTournament({ ...editingTournament, imageUrl: e.target.value })}
                          className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white outline-none focus:border-purple-500 transition-colors font-mono"
                          placeholder="https://images.unsplash.com/..."
                        />
                        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setEditingTournament({ ...editingTournament, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" })}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 shrink-0 cursor-pointer"
                          >
                            Wall Street
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTournament({ ...editingTournament, imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80" })}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 shrink-0 cursor-pointer"
                          >
                            Kripto Boğalar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTournament({ ...editingTournament, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" })}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 shrink-0 cursor-pointer"
                          >
                            Forex Altın
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTournament({ ...editingTournament, imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80" })}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 shrink-0 cursor-pointer"
                          >
                            Nasdaq Teknoloji
                          </button>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                          Turnuva Başlığı
                        </label>
                        <input
                          type="text"
                          required
                          value={editingTournament.title}
                          onChange={(e) => setEditingTournament({ ...editingTournament, title: e.target.value })}
                          className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white font-bold outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                          Açıklama / Alt Başlık
                        </label>
                        <textarea
                          rows={2}
                          value={editingTournament.subtitle}
                          onChange={(e) => setEditingTournament({ ...editingTournament, subtitle: e.target.value })}
                          className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                      </div>

                      {/* Entry Fees (USD & TL) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Katılım Ücreti (USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={editingTournament.entryFeeUSD}
                            onChange={(e) => setEditingTournament({ ...editingTournament, entryFeeUSD: Number(e.target.value) || 0 })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white font-mono font-bold outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Katılım Ücreti (TL)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={editingTournament.entryFeeTL}
                            onChange={(e) => setEditingTournament({ ...editingTournament, entryFeeTL: Number(e.target.value) || 0 })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white font-mono font-bold outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Starting Balance & Currency Symbol */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Başlangıç Turnuva Parası
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={editingTournament.startingBalance}
                            onChange={(e) => setEditingTournament({ ...editingTournament, startingBalance: Number(e.target.value) || 100 })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white font-mono font-bold outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Para Birimi Simgesi
                          </label>
                          <input
                            type="text"
                            required
                            value={editingTournament.currencySymbol}
                            onChange={(e) => setEditingTournament({ ...editingTournament, currencySymbol: e.target.value })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white font-mono font-bold outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Prize Pool & Duration */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Ödül Havuzu Metni
                          </label>
                          <input
                            type="text"
                            value={editingTournament.prizePool}
                            onChange={(e) => setEditingTournament({ ...editingTournament, prizePool: e.target.value })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                            Süre
                          </label>
                          <input
                            type="text"
                            value={editingTournament.duration}
                            onChange={(e) => setEditingTournament({ ...editingTournament, duration: e.target.value })}
                            className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                          Turnuva Durumu
                        </label>
                        <select
                          value={editingTournament.status}
                          onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value as any })}
                          className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="active">Aktif (Kullanıcılar katılabilir)</option>
                          <option value="upcoming">Yakında Başlayacak</option>
                          <option value="completed">Tamamlandı</option>
                        </select>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2.5 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setEditingTournament(null)}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white font-bold cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingTour}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-lg shadow-purple-600/30 hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isSavingTour ? (
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <>
                              <Save size={14} />
                              Değişiklikleri Kaydet
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
        {tab === "bonuses" && (
          <AdminBonusesTab users={users} />
        )}
        {tab === "settings" && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">Ödeme Yöntemleri & Hesap Yönetimi</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Ödeme yöntemlerini açıp kapatabilir, hesap bilgilerini değiştirebilir veya yeni özel yöntemler ekleyebilirsiniz.
                </p>
              </div>
            </div>

            {settingsSaveMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3.5 rounded-2xl border border-[#0ecb81]/30 bg-[#0ecb81]/10 text-xs font-bold text-[#0ecb81]"
              >
                <CheckCircle2 size={16} />
                <span>{settingsSaveMsg}</span>
              </motion.div>
            )}

            <form onSubmit={handleSavePaymentSettings} className="flex flex-col gap-6">

              {/* 1. BANKA / HAVALE / EFT BİLGİLERİ */}
              <div className={`rounded-2xl p-5 border transition-all ${
                formSettings.ibanEnabled !== false ? "border-white/10 bg-[#0d0d10]" : "border-white/5 bg-[#0a0a0d] opacity-80"
              } flex flex-col gap-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#0ecb81]/10 border border-[#0ecb81]/25">
                      <Landmark size={16} className="text-[#0ecb81]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Havale / EFT (Banka) Bilgileri</h4>
                      <p className="text-[11px] text-white/40">Kullanıcılara gösterilen TR IBAN ve banka detayları</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {formSettings.ibanEnabled !== false ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2.5 py-1 rounded-full">
                        <Eye size={11} /> Aktif / Görünür
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        <EyeOff size={11} /> Kapalı / Gizli
                      </span>
                    )}
                    <ToggleSwitch
                      checked={formSettings.ibanEnabled !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, ibanEnabled: v }))}
                    />
                  </div>
                </div>

                {formSettings.ibanEnabled === false && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Bu yöntem şu an kapalıdır. Kullanıcıların Para Yatır ekranında listelenmeyecektir.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      Banka Adı
                    </label>
                    <input
                      type="text"
                      value={formSettings.ibanBank}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, ibanBank: e.target.value }))}
                      placeholder="Örn: Garanti BBVA"
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      Hesap Sahibi (Alıcı Adı)
                    </label>
                    <input
                      type="text"
                      value={formSettings.ibanHolder}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, ibanHolder: e.target.value }))}
                      placeholder="Örn: Obyo Financial Technologies Ltd."
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      IBAN Numarası
                    </label>
                    <input
                      type="text"
                      value={formSettings.ibanNumber}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, ibanNumber: e.target.value }))}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      Transfer Açıklama Kodu (Açıklama)
                    </label>
                    <input
                      type="text"
                      value={formSettings.ibanDescription ?? ""}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, ibanDescription: e.target.value }))}
                      placeholder="Örn: OBYO-TRANSFER veya Referans Kodu"
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                    />
                    <p className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                      Kullanıcılar havale/EFT ile para yatırırken bu açıklama kodunu banka transferine yazar. Dilediğiniz zaman buradan güncelleyebilirsiniz.
                    </p>
                  </div>

                  {/* Dekont Zorunluluğu Aç/Kapat Ayarı */}
                  <div className="sm:col-span-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#0ecb81]/10 border border-[#0ecb81]/25 shrink-0 mt-0.5 sm:mt-0">
                          <FileText size={15} className="text-[#0ecb81]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white">Havale / EFT Dekont Zorunluluğu</h5>
                            {formSettings.ibanReceiptRequired !== false ? (
                              <span className="text-[10px] font-bold text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2 py-0.5 rounded-full">
                                Zorunlu
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                İsteğe Bağlı
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {formSettings.ibanReceiptRequired !== false
                              ? "Açıkken: Kullanıcılar IBAN ile para yatırırken transfer dekontu görseli yüklemek zorundadır."
                              : "Kapalıyken: Kullanıcılar dekont yüklemeden de para yatırma bildiriminde bulunabilir."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <ToggleSwitch
                          checked={formSettings.ibanReceiptRequired !== false}
                          onChange={(v) => setFormSettings(prev => ({ ...prev, ibanReceiptRequired: v }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. KRİPTO CÜZDAN BİLGİLERİ (TRC-20) */}
              <div className={`rounded-2xl p-5 border transition-all ${
                formSettings.trc20Enabled !== false ? "border-white/10 bg-[#0d0d10]" : "border-white/5 bg-[#0a0a0d] opacity-80"
              } flex flex-col gap-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#27AE60]/10 border border-[#27AE60]/25">
                      <Zap size={16} className="text-[#27AE60]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">USDT TRC-20 (Tron Ağı)</h4>
                      <p className="text-[11px] text-white/40">Tron blokzinciri üzerinden USDT yatırma cüzdanı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {formSettings.trc20Enabled !== false ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2.5 py-1 rounded-full">
                        <Eye size={11} /> Aktif / Görünür
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        <EyeOff size={11} /> Kapalı / Gizli
                      </span>
                    )}
                    <ToggleSwitch
                      checked={formSettings.trc20Enabled !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, trc20Enabled: v }))}
                    />
                  </div>
                </div>

                {formSettings.trc20Enabled === false && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Bu yöntem şu an kapalıdır. Kullanıcıların Para Yatır ekranında listelenmeyecektir.</span>
                  </div>
                )}

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      USDT TRC-20 Cüzdan Adresi (Tron Ağı)
                    </label>
                    <input
                      type="text"
                      value={formSettings.trc20Address}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, trc20Address: e.target.value }))}
                      placeholder="T..."
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#27AE60]/50 transition-colors mb-2"
                      required
                    />
                    <div className="flex items-center gap-3">
                      {formSettings.trc20QrCode && (
                        <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
                          <img src={formSettings.trc20QrCode} alt="TRC20 QR" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <PlusCircle size={14} />
                        QR Kod Yükle
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQrUpload(e, 'trc20QrCode')}
                        />
                      </label>
                      {formSettings.trc20QrCode && (
                        <button type="button" onClick={() => setFormSettings(prev => ({...prev, trc20QrCode: ''}))} className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-xl border border-white/10 transition-colors">
                           <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. KRİPTO CÜZDAN BİLGİLERİ (ERC-20) */}
              <div className={`rounded-2xl p-5 border transition-all ${
                formSettings.erc20Enabled !== false ? "border-white/10 bg-[#0d0d10]" : "border-white/5 bg-[#0a0a0d] opacity-80"
              } flex flex-col gap-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#627EEA]/10 border border-[#627EEA]/25">
                      <Bitcoin size={16} className="text-[#627EEA]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">USDT ERC-20 (Ethereum Ağı)</h4>
                      <p className="text-[11px] text-white/40">Ethereum blokzinciri üzerinden USDT yatırma cüzdanı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {formSettings.erc20Enabled !== false ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2.5 py-1 rounded-full">
                        <Eye size={11} /> Aktif / Görünür
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        <EyeOff size={11} /> Kapalı / Gizli
                      </span>
                    )}
                    <ToggleSwitch
                      checked={formSettings.erc20Enabled !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, erc20Enabled: v }))}
                    />
                  </div>
                </div>

                {formSettings.erc20Enabled === false && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Bu yöntem şu an kapalıdır. Kullanıcıların Para Yatır ekranında listelenmeyecektir.</span>
                  </div>
                )}

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                      USDT ERC-20 Cüzdan Adresi (Ethereum Ağı)
                    </label>
                    <input
                      type="text"
                      value={formSettings.erc20Address}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, erc20Address: e.target.value }))}
                      placeholder="0x..."
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#627EEA]/50 transition-colors mb-2"
                      required
                    />
                    <div className="flex items-center gap-3">
                      {formSettings.erc20QrCode && (
                        <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
                          <img src={formSettings.erc20QrCode} alt="ERC20 QR" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <PlusCircle size={14} />
                        QR Kod Yükle
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQrUpload(e, 'erc20QrCode')}
                        />
                      </label>
                      {formSettings.erc20QrCode && (
                        <button type="button" onClick={() => setFormSettings(prev => ({...prev, erc20QrCode: ''}))} className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-xl border border-white/10 transition-colors">
                           <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ÖZEL / FARKLI ÖDEME YÖNTEMLERİ (CUSTOM PAYMENT METHODS) */}
              <div className="rounded-2xl p-5 border border-white/10 bg-[#0d0d10] flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#9B51E0]/10 border border-[#9B51E0]/25">
                      <Wallet size={16} className="text-[#9B51E0]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Farklı / Özel Ödeme Yöntemleri</h4>
                      <p className="text-[11px] text-white/40">Papara, Payfix, Kredi Kartı veya dilediğiniz yöntemleri ekleyin</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewCustomMethod}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={14} className="text-[#0ecb81]" />
                    <span>Yeni Yöntem Ekle</span>
                  </button>
                </div>

                {(!formSettings.customMethods || formSettings.customMethods.length === 0) ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-black/20 gap-2">
                    <Wallet size={24} className="text-white/20" />
                    <p className="text-xs font-bold text-white/60">Henüz özel bir ödeme yöntemi eklenmedi</p>
                    <p className="text-[11px] text-white/30 max-w-sm">
                      Papara, Payfix, Kredi Kartı vb. özel ödeme yöntemi eklemek için yukarıdaki "Yeni Yöntem Ekle" butonuna tıklayabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {formSettings.customMethods.map((cm) => (
                      <div
                        key={cm.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                          cm.enabled !== false
                            ? "border-white/10 bg-black/40"
                            : "border-white/5 bg-black/20 opacity-60"
                        }`}
                        style={{ borderLeftColor: cm.color || "#9B51E0", borderLeftWidth: "3px" }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${cm.color || "#9B51E0"}15`,
                              borderColor: `${cm.color || "#9B51E0"}35`,
                              color: cm.color || "#9B51E0"
                            }}
                          >
                            <CustomPaymentIcon iconType={cm.iconType} size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white truncate">{cm.name}</span>
                              {cm.badge && (
                                <span
                                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase"
                                  style={{
                                    backgroundColor: `${cm.color || "#9B51E0"}20`,
                                    color: cm.color || "#9B51E0",
                                  }}
                                >
                                  {cm.badge}
                                </span>
                              )}
                              <span className="text-[10px] text-white/40 font-mono">
                                Min: {cm.minAmount || 100} {cm.currency || "TL"}
                              </span>
                            </div>
                            {cm.subtitle && (
                              <p className="text-[11px] text-white/40 truncate">{cm.subtitle}</p>
                            )}
                            {cm.accountNumber && (
                              <p className="text-[10px] font-mono text-white/60 truncate mt-0.5">
                                {cm.accountNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <ToggleSwitch
                            checked={cm.enabled !== false}
                            onChange={() => handleToggleCustomMethod(cm.id)}
                          />
                          <button
                            type="button"
                            onClick={() => handleEditCustomMethod(cm)}
                            className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomMethod(cm.id)}
                            className="p-2 rounded-xl text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-colors cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kaydet Butonu */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSavingSettings}
                className="w-full rounded-2xl py-4 text-xs sm:text-sm font-black text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #0ecb81, #05a660)",
                  boxShadow: "0 8px 25px rgba(14,203,129,0.3)"
                }}
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Değişiklikleri Kaydet & Canlıya Al</span>
                  </>
                )}
              </motion.button>

            </form>
          </div>
        )}

        {/* ── TELEGRAM BOT tab ────────────────────────────────────────── */}
        {tab === "telegram" && (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-[#2AABEE] shrink-0 shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                  <Send size={20} className="-rotate-12 translate-x-0.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Telegram Bot Bildirimleri</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] border border-[#2AABEE]/30">
                      Canlı Entegrasyon
                    </span>
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Para yatırma, para çekme ve yeni kayıt talepleri anında kişisel Telegram hesabınıza iletilir.
                  </p>
                </div>
              </div>
            </div>

            {/* Durum Banner'ı */}
            {(() => {
              const isConfigured = Boolean(formSettings.telegramBotToken?.trim() && formSettings.telegramChatId?.trim());
              const isMasterEnabled = formSettings.telegramEnabled !== false;

              if (isConfigured && isMasterEnabled) {
                return (
                  <div className="rounded-2xl p-4 border border-[#0ecb81]/30 bg-[#0ecb81]/[0.08] flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#0ecb81]/20 text-[#0ecb81] shrink-0 mt-0.5 border border-[#0ecb81]/30">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#0ecb81]">Telegram Botu Bağlı & Aktif</span>
                        <span className="h-2 w-2 rounded-full bg-[#0ecb81] animate-ping" />
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Sistemdeki tüm onay bekleyen işlemler ve yeni kayıtlar yapılandırılan Telegram hesabınıza anlık olarak gönderilecektir.
                      </p>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] font-mono text-white/50 flex-wrap">
                        <span className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                          Chat ID: <b className="text-white">{formSettings.telegramChatId}</b>
                        </span>
                        <span className="bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                          Token: <b className="text-white">{formSettings.telegramBotToken ? `${formSettings.telegramBotToken.slice(0, 7)}...` : ""}</b>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isConfigured && !isMasterEnabled) {
                return (
                  <div className="rounded-2xl p-4 border border-amber-500/30 bg-amber-500/[0.08] flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
                      <AlertCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-black text-amber-400">Telegram Bildirimleri Geçici Olarak Durduruldu</span>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Bot token ve Chat ID tanımlı ancak aşağıdaki ana şalter kapalı olduğu için şu an bildirim gitmemektedir.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="rounded-2xl p-4 border border-white/10 bg-[#121217] flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#2AABEE]/15 text-[#2AABEE] shrink-0 mt-0.5 border border-[#2AABEE]/30">
                    <Bot size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black text-white">Telegram Bot Yapılandırması Gerekli</span>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Sitedeki işlemlerden anında haberdar olmak için Telegram'dan bir bot oluşturup token ve chat ID bilginizi aşağıdaki alana kaydediniz.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Kayıt Başarı / Hata Bildirimi */}
            {telegramSaveMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold ${
                  telegramSaveMsg.includes("Hata")
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-[#0ecb81]/30 bg-[#0ecb81]/10 text-[#0ecb81]"
                }`}
              >
                {telegramSaveMsg.includes("Hata") ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{telegramSaveMsg}</span>
              </motion.div>
            )}

            {/* Test Sonuç Kutusu */}
            {telegramTestResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-4 border flex items-start gap-3 ${
                  telegramTestResult.ok
                    ? "border-[#0ecb81]/40 bg-[#0ecb81]/15 text-[#0ecb81]"
                    : "border-red-500/40 bg-red-500/15 text-red-300"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {telegramTestResult.ok ? (
                    <CheckCircle2 size={18} className="text-[#0ecb81]" />
                  ) : (
                    <AlertCircle size={18} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black">
                    {telegramTestResult.ok ? "Test Başarılı!" : "Test Gönderimi Başarısız Oldu"}
                  </p>
                  <p className="text-xs mt-1 text-white/80 leading-relaxed font-normal">
                    {telegramTestResult.message}
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSaveTelegramSettings} className="flex flex-col gap-6">

              {/* 1. KART: BOT BİLGİLERİ */}
              <div className="rounded-2xl p-5 border border-white/10 bg-[#0d0d10] flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#2AABEE]/15 border border-[#2AABEE]/25 text-[#2AABEE]">
                      <Key size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Bot API Kimlik Bilgileri</h4>
                      <p className="text-[11px] text-white/40">Telegram @BotFather ve Chat ID bilgileriniz</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      label="Genel Bildirimler"
                      checked={formSettings.telegramEnabled !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, telegramEnabled: v }))}
                    />
                  </div>
                </div>

                {/* Bot Token Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-white/60 flex items-center justify-between">
                    <span>TELEGRAM BOT TOKEN (API TOKEN) *</span>
                    <span className="text-[10px] text-white/30 font-normal">@BotFather tarafından verilir</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showBotToken ? "text" : "password"}
                      value={formSettings.telegramBotToken || ""}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                      placeholder="Örn: 7123456789:AAHq1234567890abcdefghijklmnop"
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-3 pr-20 text-xs font-mono text-white outline-none focus:border-[#2AABEE]/60 transition-colors"
                      required
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowBotToken(prev => !prev)}
                        className="px-2 py-1 text-[11px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title={showBotToken ? "Gizle" : "Göster"}
                      >
                        {showBotToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Telegram'da <b>@BotFather</b>'a <code>/newbot</code> komutu vererek aldığınız HTTP API token'dır.
                  </p>
                </div>

                {/* Chat ID Input */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[11px] font-bold text-white/60 flex items-center justify-between">
                    <span>TELEGRAM CHAT ID (ALICI SOHBET / KULLANICI ID) *</span>
                    <span className="text-[10px] text-white/30 font-normal">Kişisel veya Grup ID</span>
                  </label>
                  <input
                    type="text"
                    value={formSettings.telegramChatId || ""}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                    placeholder="Örn: 123456789 veya gruplar için -1001234567890"
                    className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-3 text-xs font-mono text-white outline-none focus:border-[#2AABEE]/60 transition-colors"
                    required
                  />
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Bildirimin gideceği Telegram ID'niz. Telegram'da <b>@userinfobot</b> veya <b>@GetMyIDBot</b> botuna <code>/start</code> yazarak öğrenebilirsiniz.
                  </p>
                </div>

              </div>

              {/* 2. KART: BİLDİRİM TERCİHLERİ */}
              <div className="rounded-2xl p-5 border border-white/10 bg-[#0d0d10] flex flex-col gap-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#FFB800]/15 border border-[#FFB800]/25 text-[#FFB800]">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Hangi Olaylarda Bildirim Gönderilsin?</h4>
                    <p className="text-[11px] text-white/40">Gereksiz mesajları önlemek için bildirim türlerini özelleştirin</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* 1. Para Yatırma */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#0ecb81]/15 text-[#0ecb81] flex items-center justify-center shrink-0 border border-[#0ecb81]/25">
                        <ArrowDownCircle size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Para Yatırma Talepleri</p>
                        <p className="text-[10px] text-white/40">Kullanıcı transfer veya dekont girdiğinde</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={formSettings.telegramNotifyDeposits !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, telegramNotifyDeposits: v }))}
                    />
                  </div>

                  {/* 2. Para Çekme */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0 border border-[#FF6B00]/25">
                        <ArrowUpCircle size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Para Çekme Talepleri</p>
                        <p className="text-[10px] text-white/40">Kullanıcı çekim talebi açtığında</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={formSettings.telegramNotifyWithdrawals !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, telegramNotifyWithdrawals: v }))}
                    />
                  </div>

                  {/* 3. Yeni Kayıt */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#627EEA]/15 text-[#627EEA] flex items-center justify-center shrink-0 border border-[#627EEA]/25">
                        <Users size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Yeni Kayıt Bildirimleri</p>
                        <p className="text-[10px] text-white/40">Platforma yeni bir üye kaydolduğunda</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={formSettings.telegramNotifyRegistrations !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, telegramNotifyRegistrations: v }))}
                    />
                  </div>

                  {/* 4. Kimlik Onay (KYC) */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#9B51E0]/15 text-[#9B51E0] flex items-center justify-center shrink-0 border border-[#9B51E0]/25">
                        <Shield size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Kimlik Doğrulama (KYC)</p>
                        <p className="text-[10px] text-white/40">Kullanıcı kimlik belgesi yüklediğinde</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={formSettings.telegramNotifyKyc !== false}
                      onChange={(v) => setFormSettings(prev => ({ ...prev, telegramNotifyKyc: v }))}
                    />
                  </div>

                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSavingSettings}
                  className="rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-black text-black flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #0ecb81, #05a660)",
                    boxShadow: "0 8px 25px rgba(14,203,129,0.3)"
                  }}
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Ayarları Kaydet & Etkinleştir</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSendTestTelegram}
                  disabled={isTestingTelegram}
                  className="rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 border border-[#2AABEE]/40"
                  style={{
                    background: "linear-gradient(135deg, #2AABEE, #188ec8)",
                    boxShadow: "0 8px 25px rgba(42,171,238,0.3)"
                  }}
                >
                  {isTestingTelegram ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Test Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Test Bildirimi Gönder</span>
                    </>
                  )}
                </motion.button>
              </div>

            </form>

            {/* 3. KART: ADIM ADIM KURULUM REHBERİ */}
            <div className="rounded-3xl p-5 sm:p-6 border border-white/10 bg-[#0d0d12] flex flex-col gap-5 mt-2">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#2AABEE]/15 border border-[#2AABEE]/25 text-[#2AABEE]">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Adım Adım Telegram Botu Kurulum Kılavuzu</h4>
                  <p className="text-[11px] text-white/40">2 dakikada botunuzu oluşturup admin panelinize bağlayın</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Adım 1 */}
                <div className="rounded-2xl border border-white/10 bg-black/50 p-4 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#2AABEE]">1. Adım: Bot Oluşturma</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40">@BotFather</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Telegram'da arama çubuğuna <b>@BotFather</b> yazıp sohbete girin. <code className="text-[#2AABEE]">/newbot</code> komutunu gönderin.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Botunuza bir isim ve ardından sonu <code>bot</code> ile biten bir kullanıcı adı verin (Örn: <code>obyo_bildirim_bot</code>).
                  </p>
                  <p className="text-[11px] text-white/50 bg-white/5 p-2 rounded-xl border border-white/5">
                    BotFather size <b>HTTP API token</b> verecektir. O token'ı yukarıdaki <b>Bot Token</b> alanına yapıştırın.
                  </p>
                </div>

                {/* Adım 2 */}
                <div className="rounded-2xl border border-white/10 bg-black/50 p-4 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#2AABEE]">2. Adım: Chat ID'nizi Alma</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40">@userinfobot</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Telegram'da arama çubuğuna <b>@userinfobot</b> veya <b>@GetMyIDBot</b> yazıp sohbete girin.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    <code className="text-[#2AABEE]">/start</code> komutunu gönderin. Bot size sayısal ID'nizi gönderecektir (Örn: <code>987654321</code>).
                  </p>
                  <p className="text-[11px] text-white/50 bg-white/5 p-2 rounded-xl border border-white/5">
                    Bu numarayı kopyalayıp yukarıdaki <b>Chat ID</b> alanına yapıştırın.
                  </p>
                </div>

                {/* Adım 3 */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">3. Adım: Bota /start Verme (ÖNEMLİ)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Kritik</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Telegram'ın güvenlik kuralları gereği, siz başlatmadan bir bot size doğrudan mesaj gönderemez.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Yeni oluşturduğunuz botun sohbetini Telegram'da açın ve alttaki <b>BAŞLAT</b> (<code className="text-amber-300">/start</code>) butonuna basın.
                  </p>
                </div>

                {/* Adım 4 */}
                <div className="rounded-2xl border border-[#0ecb81]/20 bg-[#0ecb81]/[0.04] p-4 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0ecb81]">4. Adım: Kaydet ve Test Et</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0ecb81]/15 text-[#0ecb81]">Tamamlandı</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Bilgileri yukarıdaki kutulara girdikten sonra <b>Ayarları Kaydet</b> butonuna basın.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Son olarak <b>Test Bildirimi Gönder</b> butonuna tıklayarak telefonunuza ilk test mesajının geldiğini onaylayın!
                  </p>
                </div>

              </div>

              {/* Grup Notu */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] flex items-center justify-center shrink-0 mt-0.5">
                  <Send size={11} />
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  <b>Birden fazla yönetici veya Telegram Grubu kullanmak isterseniz:</b> Botu kurduğunuz Telegram grubuna ekleyin, gruba yönetici yetkisi verin ve grubun Chat ID numarasını (genellikle <code>-100...</code> ile başlar) buraya yazın.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ── CUSTOM PAYMENT METHOD MODAL ────────────────────────── */}
        <AnimatePresence>
          {isCustomModalOpen && editingCustomMethod && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#121217] p-5 sm:p-6 text-white shadow-2xl flex flex-col gap-4 my-8"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${editingCustomMethod.color || "#9B51E0"}20`,
                        color: editingCustomMethod.color || "#9B51E0"
                      }}
                    >
                      <CustomPaymentIcon iconType={editingCustomMethod.iconType} size={16} />
                    </div>
                    <h3 className="text-sm font-black text-white">
                      {editingCustomMethod.name ? `Düzenle: ${editingCustomMethod.name}` : "Yeni Ödeme Yöntemi"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomModalOpen(false);
                      setEditingCustomMethod(null);
                    }}
                    className="p-2 rounded-xl text-white/40 hover:text-white bg-white/5 border border-white/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Real-time Preview in user's UI */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-white/40 uppercase">Kullanıcı Ekranı Önizlemesi</div>
                  <div
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{
                      background: "linear-gradient(135deg, rgba(20,20,24,0.7) 0%, rgba(12,12,16,0.9) 100%)",
                      borderColor: `${editingCustomMethod.color || "#9B51E0"}40`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${editingCustomMethod.color || "#9B51E0"}20`,
                          color: editingCustomMethod.color || "#9B51E0"
                        }}
                      >
                        <CustomPaymentIcon iconType={editingCustomMethod.iconType} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">
                            {editingCustomMethod.name || "Yöntem Adı"}
                          </span>
                          {editingCustomMethod.badge && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase"
                              style={{
                                backgroundColor: `${editingCustomMethod.color || "#9B51E0"}25`,
                                color: editingCustomMethod.color || "#9B51E0",
                              }}
                            >
                              {editingCustomMethod.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50">
                          {editingCustomMethod.subtitle || "Açıklama / alt bilgi"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/40 font-mono">
                      Min {editingCustomMethod.minAmount || 100} {editingCustomMethod.currency || "TL"}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveCustomMethodInModal} className="flex flex-col gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
                  
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Bu Yöntem Aktif mi?</span>
                      <span className="text-[10px] text-white/40">Kapatırsanız kullanıcıların Para Yatır ekranında gözükmez</span>
                    </div>
                    <ToggleSwitch
                      checked={editingCustomMethod.enabled !== false}
                      onChange={(v) => setEditingCustomMethod(prev => prev ? ({ ...prev, enabled: v }) : null)}
                    />
                  </div>

                  {/* Name & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Yöntem Adı *
                      </label>
                      <input
                        type="text"
                        value={editingCustomMethod.name}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                        placeholder="Örn: Papara, Payfix"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Rozet / Etiket (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={editingCustomMethod.badge || ""}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, badge: e.target.value }) : null)}
                        placeholder="Örn: Hızlı, 7/24, %0 Komisyon"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                      Alt Başlık / Bilgi Notu
                    </label>
                    <input
                      type="text"
                      value={editingCustomMethod.subtitle || ""}
                      onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, subtitle: e.target.value }) : null)}
                      placeholder="Örn: Papara hesabı ile anında transfer"
                      className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                    />
                  </div>

                  {/* Icon & Color Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        İkon Seçimi
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ICON_OPTIONS.map((ico) => {
                          const IconComp = ico.icon;
                          const isSel = (editingCustomMethod.iconType || "wallet") === ico.id;
                          return (
                            <button
                              key={ico.id}
                              type="button"
                              onClick={() => setEditingCustomMethod(prev => prev ? ({ ...prev, iconType: ico.id as any }) : null)}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold gap-1 transition-colors cursor-pointer ${
                                isSel ? "border-white/40 bg-white/15 text-white" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                              }`}
                            >
                              <IconComp size={16} />
                              <span className="text-[9px] truncate max-w-full">{ico.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Tema Rengi
                      </label>
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {COLOR_OPTIONS.map((c) => {
                          const isSel = (editingCustomMethod.color || "#9B51E0") === c.value;
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setEditingCustomMethod(prev => prev ? ({ ...prev, color: c.value }) : null)}
                              className={`h-8 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                                isSel ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-black" : "hover:scale-105"
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.label}
                            >
                              {isSel && <Check size={14} className="text-black stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Currency & Min Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Para Birimi
                      </label>
                      <select
                        value={editingCustomMethod.currency || "TL"}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, currency: e.target.value as any }) : null)}
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      >
                        <option value="TL">TL (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="USDT">USDT ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Minimum Tutar
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editingCustomMethod.minAmount || 100}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }) : null)}
                        placeholder="100"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Account details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Alıcı / Hesap Sahibi (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={editingCustomMethod.accountHolder || ""}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, accountHolder: e.target.value }) : null)}
                        placeholder="Örn: Şirket Adı veya İsim"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                        Transfer / Açıklama Kodu (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={editingCustomMethod.transferCode || ""}
                        onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, transferCode: e.target.value }) : null)}
                        placeholder="Örn: OBYO-KOD veya Kullanıcı ID"
                        className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                      Hesap No / Cüzdan Adresi / IBAN *
                    </label>
                    <input
                      type="text"
                      value={editingCustomMethod.accountNumber}
                      onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, accountNumber: e.target.value }) : null)}
                      placeholder="Kullanıcının para göndereceği ve kopyalayacağı adres ya da numara"
                      className="w-full rounded-xl bg-black border border-white/10 px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                      required
                    />
                  </div>

                  {/* QR Code Upload */}
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                      QR Kod Görseli (Opsiyonel)
                    </label>
                    <div className="flex items-center gap-3">
                      {editingCustomMethod.qrCode && (
                        <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
                          <img src={editingCustomMethod.qrCode} alt="Custom QR" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <PlusCircle size={14} />
                        QR Kod Seç
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCustomQrUpload}
                        />
                      </label>
                      {editingCustomMethod.qrCode && (
                        <button
                          type="button"
                          onClick={() => setEditingCustomMethod(prev => prev ? ({ ...prev, qrCode: "" }) : null)}
                          className="p-2 text-white/40 hover:text-red-400 bg-white/5 rounded-xl border border-white/10 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes / instructions */}
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">
                      Kullanıcıya Gösterilecek Talimat / Not (Opsiyonel)
                    </label>
                    <textarea
                      rows={2}
                      value={editingCustomMethod.notes || ""}
                      onChange={(e) => setEditingCustomMethod(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                      placeholder="Örn: Lütfen transfer açıklamasına adınızı ve kullanıcı numaranızı yazınız."
                      className="w-full rounded-xl bg-black border border-white/10 p-2.5 text-xs text-white outline-none focus:border-[#0ecb81]/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomModalOpen(false);
                        setEditingCustomMethod(null);
                      }}
                      className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl text-xs font-black text-black cursor-pointer shadow-lg transition-transform active:scale-98"
                      style={{ background: "linear-gradient(135deg, #0ecb81, #05a660)" }}
                    >
                      {editingCustomMethod.name ? "Yöntemi Kaydet" : "Listeye Ekle"}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Delete Request Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {reqToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-red-500/10 to-transparent">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <h3 className="text-base font-black text-white">Talebi Sil</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Bu talebi veritabanından kalıcı olarak silmek istediğinize emin misiniz? (Tüm dekontlar silinir)
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#111] flex items-center gap-2">
                <button
                  disabled={isDeletingReq}
                  onClick={() => setReqToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={isDeletingReq}
                  onClick={async () => {
                    setIsDeletingReq(true);
                    await deleteRequest(reqToDelete);
                    setIsDeletingReq(false);
                    setReqToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeletingReq ? <span className="animate-pulse">Siliniyor...</span> : <span>Evet, Sil</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Stats Reset Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showStatsResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-red-500/10 to-transparent">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <h3 className="text-base font-black text-white">İstatistiği Sıfırla</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Toplam Yatırım istatistiğini sıfırlamak için onaylanmış tüm yatırım taleplerini (geçmişi) silmek ister misiniz? <br/><br/>
                    <strong className="text-white/80">Not:</strong> Kullanıcı bakiyeleri etkilenmez.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#111] flex items-center gap-2">
                <button
                  disabled={isResettingStats}
                  onClick={() => setShowStatsResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  disabled={isResettingStats}
                  onClick={async () => {
                    setIsResettingStats(true);
                    const deposits = requests.filter(r => r.type === "deposit" && r.status === "accepted");
                    for (const d of deposits) {
                      await deleteRequest(d.id);
                    }
                    setIsResettingStats(false);
                    setShowStatsResetConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isResettingStats ? <span className="animate-pulse">Siliniyor...</span> : <span>Evet, Sıfırla</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── User Delete Confirmation Modal ──────────────────────────────── */}
        <AnimatePresence>
          {userToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md rounded-2xl bg-[#0d0d0d] border border-[#222] shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-[#f6465d]/10 to-transparent">
                  <div className="h-10 w-10 rounded-xl bg-[#f6465d]/20 border border-[#f6465d]/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-[#f6465d]" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white">Kullanıcıyı Sil</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Bu kullanıcının hesabı ve tüm verileri sistemden kalıcı olarak silinecektir.
                    </p>
                  </div>
                  <button
                    disabled={isDeletingUser}
                    onClick={() => setUserToDelete(null)}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 sm:p-5 flex flex-col gap-4">
                  {/* User Profile Overview */}
                  <div className="rounded-xl p-3.5 bg-[#141414] border border-[#222] flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-black overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                      {userToDelete.photoURL ? (
                        <img src={userToDelete.photoURL} alt={userToDelete.name} className="h-full w-full object-cover" />
                      ) : (
                        `${userToDelete.name.charAt(0)}${userToDelete.surname.charAt(0)}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white truncate">
                        {userToDelete.name} {userToDelete.surname}
                      </div>
                      <div className="text-xs text-white/40 truncate">{userToDelete.email}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-[#0ecb81]">${(userToDelete.realBalance ?? 0).toFixed(2)}</div>
                      <div className="text-[10px] text-white/30">Gerçek Bakiye</div>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="rounded-xl p-3.5 bg-[#f6465d]/10 border border-[#f6465d]/25 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-black text-[#f6465d]">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>BU İŞLEM GERİ ALINAMAZ</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Onayladığınız takdirde bu kullanıcıya ait aşağıdaki tüm bilgiler Firestore veritabanından kalıcı olarak silinecektir:
                    </p>
                    <ul className="text-xs text-white/60 space-y-1 pl-4 list-disc marker:text-[#f6465d]">
                      <li>Kullanıcı profili ve giriş yetkisi</li>
                      <li>Gerçek (${(userToDelete.realBalance ?? 0).toFixed(2)}) ve Demo (${(userToDelete.demoBalance ?? 0).toFixed(2)}) bakiyeleri</li>
                      <li>Tüm para yatırma ve para çekme talepleri</li>
                      <li>Açık ve geçmiş tüm ikili opsiyon işlemleri</li>
                      <li>Kimlik doğrulama (KYC) ve liderlik tablosu kayıtları</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={() => setUserToDelete(null)}
                      className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={handleDeleteUserPermanently}
                      className="flex-1 py-3 rounded-xl text-xs font-black text-white bg-[#f6465d] hover:bg-[#d63048] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#f6465d]/20 disabled:opacity-50"
                    >
                      {isDeletingUser ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Siliniyor...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={15} />
                          <span>Kalıcı Olarak Sil</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Request Rejection Modal ── */}
        <AnimatePresence>
          {rejectModalReq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRejectModalReq(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg rounded-3xl bg-[#111111] border border-white/10 shadow-2xl overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-start gap-3.5 bg-gradient-to-b from-[#f6465d]/12 to-transparent">
                  <div className="h-10 w-10 rounded-xl bg-[#f6465d]/20 border border-[#f6465d]/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="text-[#f6465d]" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white">İşlem Talebini Reddet</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Kullanıcıya iletilecek red gerekçesini belirleyin veya yazın.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectModalReq(null)}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {/* Request summary info */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider block">
                        {rejectModalReq.type === "withdraw" ? "Para Çekme Talebi" : "Para Yatırma Talebi"}
                      </span>
                      <p className="text-sm font-black text-white truncate mt-0.5">
                        {rejectModalReq.userName}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        {rejectModalReq.userEmail} · {rejectModalReq.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#FF6B00]">
                        {rejectModalReq.currency === "TL" || rejectModalReq.currency === "TRY" ? "₺" : "$"}
                        {rejectModalReq.amount} {rejectModalReq.currency}
                      </span>
                      {rejectModalReq.destination && (
                        <span className="text-[10px] font-mono text-white/30 block max-w-[140px] truncate">
                          {rejectModalReq.destination}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dekont Varsa Hızlı Önizleme */}
                  {rejectModalReq.receiptUrl && (
                    <div className="p-3 rounded-2xl bg-[#0ecb81]/[0.06] border border-[#0ecb81]/25 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          onClick={() => {
                            setViewingReceipt({
                              url: rejectModalReq.receiptUrl!,
                              name: rejectModalReq.receiptName || `${rejectModalReq.userName} - Dekont`,
                              reqId: rejectModalReq.id,
                              userName: rejectModalReq.userName,
                              amount: rejectModalReq.amount,
                              currency: rejectModalReq.currency,
                              status: rejectModalReq.status,
                            });
                            setReceiptZoom(1);
                            setReceiptRotation(0);
                          }}
                          className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 bg-black/60 shrink-0 cursor-pointer group relative"
                        >
                          <img
                            src={rejectModalReq.receiptUrl}
                            alt="Dekont"
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                            <Eye size={13} className="text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#0ecb81] uppercase block">Yüklenen Havale Dekontu</span>
                          <span className="text-xs text-white/80 font-medium truncate block max-w-[200px]">
                            {rejectModalReq.receiptName || "Dekont Belgesi"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReceipt({
                            url: rejectModalReq.receiptUrl!,
                            name: rejectModalReq.receiptName || `${rejectModalReq.userName} - Dekont`,
                            reqId: rejectModalReq.id,
                            userName: rejectModalReq.userName,
                            amount: rejectModalReq.amount,
                            currency: rejectModalReq.currency,
                            status: rejectModalReq.status,
                          });
                          setReceiptZoom(1);
                          setReceiptRotation(0);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
                      >
                        <Eye size={13} className="text-[#0ecb81]" />
                        <span>Dekontu Aç</span>
                      </button>
                    </div>
                  )}

                  {/* Quick template presets */}
                  <div>
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block mb-2">
                      Hızlı Sebep Şablonları (Tıklayarak Seçin)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ...(rejectModalReq.type === "withdraw"
                          ? [
                              "Lütfen para yatırımı oluşturup çekim talebi verin.",
                              "Hesap ve IBAN bilgileri uyuşmuyor, lütfen kontrol ediniz.",
                              "Kimlik doğrulaması (KYC) ve güvenlik teyidi gerekmektedir.",
                              "Minimum işlem hacmi ve çevrim şartı tamamlanmalıdır.",
                              "Güvenlik ve risk birimi incelemesi sonucu reddedildi.",
                              "Yetersiz serbest bakiye veya hatalı hesap numarası.",
                            ]
                          : [
                              "Yüklenen dekont geçersiz, okunamıyor veya sahte transfer bildirimi tespit edildi.",
                              "Dekonttaki tutar veya transfer açıklaması talep bilgisi ile eşleşmiyor.",
                              "Banka hesabımıza gelen transfer görünmüyor, lütfen dekontu kontrol ediniz.",
                              "Açıklama alanına referans kodu yazılmadığından transfer eşleştirilemedi.",
                              "Hatalı veya eksik bilgi nedeniyle yatırım onaylanamadı.",
                            ]),
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setRejectReason(tpl)}
                          className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            rejectReason === tpl
                              ? "bg-[#f6465d]/20 border-[#f6465d]/50 text-white font-bold"
                              : "bg-white/[0.03] border-white/8 text-white/60 hover:text-white hover:bg-white/[0.07]"
                          }`}
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason Textarea */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center justify-between">
                      <span>Reddetme Sebebi (Kullanıcının 'İşlemler' ekranında görünür) *</span>
                      <span className="text-[10px] text-white/30 font-normal">
                        {rejectReason.length} karakter
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Örn: Lütfen para yatırımı oluşturup çekim talebi verin..."
                      className="w-full rounded-xl bg-[#161616] border border-white/10 p-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#f6465d]/50 transition-colors resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-white/30">
                      Bu mesaj, kullanıcının cüzdanındaki "İşlemler" listesinde ilgili talebin altında doğrudan kırmızı uyarı kutusu olarak görünecektir.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      disabled={processingReq === rejectModalReq.id}
                      onClick={() => setRejectModalReq(null)}
                      className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      disabled={processingReq === rejectModalReq.id}
                      onClick={async () => {
                        const finalReason = rejectReason.trim() || "İşlem talebiniz onaylanamadı.";
                        setProcessingReq(rejectModalReq.id);
                        await processRequest(rejectModalReq.id, false, finalReason);
                        setProcessingReq(null);
                        setRejectModalReq(null);
                        setRejectReason("");
                      }}
                      className="flex-1 py-3 rounded-xl text-xs font-black text-white bg-[#f6465d] hover:bg-[#d63048] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#f6465d]/20 disabled:opacity-50"
                    >
                      {processingReq === rejectModalReq.id ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <X size={15} />
                          <span>Talebi Reddet ve Sebebi İlet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Dekont İnceleme Lightbox Modalı (Admin) ── */}
        <AnimatePresence>
          {viewingReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingReceipt(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-3xl rounded-3xl bg-[#0f0f12] border border-white/15 overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh]"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-[#0ecb81]/15 border border-[#0ecb81]/30 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#0ecb81]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate">
                          {viewingReceipt.name}
                        </h4>
                        {viewingReceipt.amount !== undefined && (
                          <span className="text-xs font-black text-[#0ecb81]">
                            ({viewingReceipt.currency === "TL" || viewingReceipt.currency === "TRY" ? "₺" : "$"}{viewingReceipt.amount} {viewingReceipt.currency})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 truncate">
                        {viewingReceipt.userName ? `Kullanıcı: ${viewingReceipt.userName}` : "Transfer dekontu önizleme"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={viewingReceipt.url}
                      download={viewingReceipt.name || "dekont.jpg"}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="İndir / Yeni Sekmede Aç"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setViewingReceipt(null)}
                      className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Kapat"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Canvas / Image Display */}
                <div className="relative p-4 overflow-auto flex items-center justify-center bg-black/70 min-h-[340px] max-h-[62vh]">
                  <img
                    src={viewingReceipt.url}
                    alt="Dekont Detayı"
                    style={{
                      transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                    }}
                    className="max-h-[58vh] max-w-full object-contain rounded-xl border border-white/10 shadow-2xl select-none pointer-events-auto"
                  />
                </div>

                {/* Toolbar & Actions */}
                <div className="p-3.5 border-t border-white/10 flex items-center justify-between gap-3 bg-white/[0.02] flex-wrap">
                  {/* Zoom and Rotate Controls */}
                  <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.max(0.5, prev - 0.25))}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Uzaklaştır"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptZoom(1);
                        setReceiptRotation(0);
                      }}
                      className="px-2 py-1 text-[11px] font-mono font-bold text-white/80 hover:text-white cursor-pointer"
                      title="Sıfırla"
                    >
                      {Math.round(receiptZoom * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.min(3, prev + 0.25))}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Yakınlaştır"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <div className="h-4 w-px bg-white/15 mx-1" />
                    <button
                      type="button"
                      onClick={() => setReceiptRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="90° Döndür"
                    >
                      <RotateCw size={15} />
                    </button>
                  </div>

                  {/* Direct Approve / Reject shortcuts if pending request */}
                  {viewingReceipt.reqId && viewingReceipt.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingReq === viewingReceipt.reqId}
                        onClick={async () => {
                          const reqId = viewingReceipt.reqId!;
                          setProcessingReq(reqId);
                          await processRequest(reqId, true);
                          setProcessingReq(null);
                          setViewingReceipt(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black text-black flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)" }}
                      >
                        <Check size={14} />
                        <span>{processingReq === viewingReceipt.reqId ? "İşleniyor..." : "Dekontu Onayla"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingReq === viewingReceipt.reqId}
                        onClick={() => {
                          const targetReq = requests.find(r => r.id === viewingReceipt.reqId);
                          setViewingReceipt(null);
                          if (targetReq) {
                            setRejectModalReq(targetReq);
                            setRejectReason(targetReq.type === "withdraw" ? "Lütfen para yatırımı oluşturup çekim talebi verin." : "");
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-black text-white hover:bg-[#f6465d]/25 transition-all cursor-pointer border border-[#f6465d]/30 bg-[#f6465d]/15"
                      >
                        <X size={14} className="text-[#f6465d]" />
                        <span>Reddet...</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewingReceipt(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Kapat
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
