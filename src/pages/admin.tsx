import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ObyoRequest, PaymentSettings } from "@/context/AuthContext";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Check, X, LogOut,
  Shield, Clock, ChevronDown, ChevronUp, Filter, TrendingUp,
  PlusCircle, Settings, Landmark, Zap, Bitcoin, Save, AlertCircle,
  RefreshCw, CheckCircle2
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

  // Keep local form in sync with remote payment settings when loaded
  useEffect(() => {
    setFormSettings(paymentSettings);
  }, [paymentSettings]);

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
              const pending = requests.filter(r => r.userId === u.id && r.status === "pending").length;
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
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">Yatırma Yöntemleri Hesap Bilgileri</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Kullanıcıların Cüzdan sayfasında gördüğü Havale IBAN ve Kripto cüzdan adreslerini buradan güncelleyin.
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
              <div className="rounded-2xl p-5 border border-white/8 bg-[#0d0d10] flex flex-col gap-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#0ecb81]/10 border border-[#0ecb81]/25">
                    <Landmark size={16} className="text-[#0ecb81]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Havale / EFT (Banka) Bilgileri</h4>
                    <p className="text-[11px] text-white/40">Kullanıcılara gösterilen TR IBAN ve banka detayları</p>
                  </div>
                </div>

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
                      SWIFT / BIC Kodu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={formSettings.ibanSwift}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, ibanSwift: e.target.value }))}
                      placeholder="TGBATRISXXX"
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono text-white outline-none focus:border-[#0ecb81]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. KRİPTO CÜZDAN BİLGİLERİ */}
              <div className="rounded-2xl p-5 border border-white/8 bg-[#0d0d10] flex flex-col gap-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#FF6B00]/10 border border-[#FF6B00]/25">
                    <Bitcoin size={16} className="text-[#FF6B00]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Kripto Cüzdan Adresleri</h4>
                    <p className="text-[11px] text-white/40">USDT yatırma talepleri için gösterilen cüzdanlar</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase">
                        USDT TRC-20 Cüzdan Adresi (Tron Ağı)
                      </label>
                      <span className="text-[10px] text-[#27AE60] font-black">En Çok Tercih Edilen</span>
                    </div>
                    <input
                      type="text"
                      value={formSettings.trc20Address}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, trc20Address: e.target.value }))}
                      placeholder="T..."
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#27AE60]/50 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase">
                        USDT ERC-20 Cüzdan Adresi (Ethereum Ağı)
                      </label>
                      <span className="text-[10px] text-[#627EEA] font-black">Ethereum / EVM</span>
                    </div>
                    <input
                      type="text"
                      value={formSettings.erc20Address}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, erc20Address: e.target.value }))}
                      placeholder="0x..."
                      className="w-full rounded-xl bg-black border border-white/10 px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-[#627EEA]/50 transition-colors"
                      required
                    />
                  </div>
                </div>
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

      </div>
    </div>
  );
}
