import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ObyoRequest, PaymentSettings, CustomPaymentMethod } from "@/context/AuthContext";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Check, X, LogOut,
  Shield, Clock, ChevronDown, ChevronUp, Filter, TrendingUp,
  PlusCircle, Settings, Landmark, Zap, Bitcoin, Save, AlertCircle,
  RefreshCw, CheckCircle2, Plus, Trash2, Edit3, Wallet, CreditCard,
  QrCode, CircleDollarSign, Eye, EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type AdminTab  = "requests" | "users" | "settings";
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
  } = useAuth();

  useEffect(() => {
    if (ready && !isAdmin) navigate("/auth");
  }, [ready, isAdmin, navigate]);

  const [tab, setTab] = useState<AdminTab>("requests");
  const [filter, setFilter] = useState<ReqFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processingReq, setProcessingReq] = useState<string | null>(null);

  /* Payment Settings Form state */
  const [formSettings, setFormSettings] = useState<PaymentSettings>(paymentSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  /* Custom Payment Method modal and editing state */
  const [editingCustomMethod, setEditingCustomMethod] = useState<CustomPaymentMethod | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

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
          { label: "Toplam Yatırım",   value: `$${totalDeposited.toFixed(0)}`,  icon: TrendingUp, color: "#0ecb81" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex flex-col gap-1 rounded-2xl p-3"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color: s.color }} />
                <span className="text-[9px] font-bold text-white/30 uppercase">{s.label}</span>
              </div>
              <span className="text-lg font-black" style={{ color: s.color }}>{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#111] shrink-0">
        {([
          { id: "requests", label: "İstekler",     badge: pendingCount },
          { id: "users",    label: "Kullanıcılar"                      },
          { id: "settings", label: "Hesap & Cüzdan Ayarları"            },
        ] as { id: AdminTab; label: string; badge?: number }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
            className="flex items-center gap-2 flex-1 justify-center py-3 text-xs sm:text-sm font-black relative cursor-pointer select-none"
            style={{ color: tab === t.id ? "#FF6B00" : "#444" }}>
            {t.label}
            {t.badge ? (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-black"
                style={{ background: "#FFB800" }}>{t.badge}</span>
            ) : null}
            {tab === t.id && (
              <motion.div layoutId="admin-tab" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ background: "#FF6B00" }} />
            )}
          </button>
        ))}
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
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black" style={{ color }}>
                          {isDeposit ? "+" : "-"}${req.amount} {req.currency}
                        </span>
                        <span className="text-[10px] text-white/25">· {req.method}</span>
                      </div>
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
                                  onClick={async () => {
                                    setProcessingReq(req.id);
                                    await processRequest(req.id, false);
                                    setProcessingReq(null);
                                  }}
                                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-50 cursor-pointer"
                                  style={{ background: "rgba(246,70,93,0.15)", border: "1px solid rgba(246,70,93,0.25)" }}>
                                  <X size={13} className="text-[#f6465d]" /> {processingReq === req.id ? "İşleniyor..." : "Reddet"}
                                </motion.button>
                              </div>
                            </div>
                          )}
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
            {users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={28} className="text-white/10 mb-3" />
                <p className="text-sm text-white/20 font-bold">Henüz kayıtlı kullanıcı yok</p>
              </div>
            )}

            {users.map(u => {
              const isOpen  = expanded === u.id;
              const pending = requests.filter(r => (r.userId === u.id || r.userEmail?.toLowerCase() === u.email?.toLowerCase()) && r.status === "pending").length;
              const isAddingThis = adding === u.id;

              return (
                <motion.div key={u.id} layout
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                  <button onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="flex items-center gap-3 w-full p-4 text-left cursor-pointer">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-black overflow-hidden"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        `${u.name.charAt(0)}${u.surname.charAt(0)}`
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{u.name} {u.surname}</span>
                        {pending > 0 && (
                          <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-black"
                            style={{ background: "#FFB800" }}>{pending}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30">{u.email}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-black text-[#0ecb81]">${(u.realBalance ?? 0).toFixed(2)}</span>
                      <span className="text-[10px] text-white/25">Gerçek</span>
                    </div>
                    {isOpen ? <ChevronUp size={13} className="text-white/25 shrink-0" /> : <ChevronDown size={13} className="text-white/25 shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[#1a1a1a]">
                        <div className="p-4 flex flex-col gap-3">
                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Kullanıcı ID",   value: u.id,                                       full: true },
                              { label: "E-posta",        value: u.email,                                    full: true },
                              { label: "Doğum Tarihi",   value: u.birthDate                                            },
                              { label: "Kayıt Tarihi",   value: format(u.createdAt, "dd.MM.yyyy")                      },
                              { label: "Demo Bakiye",    value: `$${(u.demoBalance ?? 0).toFixed(2)}`                  },
                              { label: "Gerçek Bakiye",  value: `$${(u.realBalance ?? 0).toFixed(2)}`                  },
                              { label: "Toplam Yatırım", value: `$${(u.totalDeposited ?? 0).toFixed(2)}`               },
                              { label: "Toplam Çekim",   value: `$${(u.totalWithdrawn ?? 0).toFixed(2)}`               },
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
                                {u.kycStatus === "rejected" && u.kycDetails.rejectionReason && (
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
                            <p className="text-[10px] font-black text-[#0ecb81] uppercase">Doğrudan Bakiye Ekle</p>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                placeholder="Miktar ($)"
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── SETTINGS TAB (Hesap & Cüzdan Ayarları) ────────────────────────── */}
        {tab === "settings" && (
          <div className="p-4 max-w-2xl mx-auto flex flex-col gap-6">
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

      </div>
    </div>
  );
}
