import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, ObyoRequest } from "@/context/AuthContext";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Check, X, LogOut,
  Shield, Clock, ChevronDown, ChevronUp, Filter, TrendingUp,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type AdminTab  = "requests" | "users";
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
  const { users, requests, processRequest, addBalanceDirect, logout, isAdmin, ready } = useAuth();

  useEffect(() => {
    if (ready && !isAdmin) navigate("/auth");
  }, [ready, isAdmin, navigate]);

  const [tab,      setTab]      = useState<AdminTab>("requests");
  const [filter,   setFilter]   = useState<ReqFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  /* Direct balance per-user input state */
  const [addAmounts, setAddAmounts]   = useState<Record<string, string>>({});
  const [adding,     setAdding]       = useState<string | null>(null);

  const handleLogout = async () => { await logout(); navigate("/auth"); };

  const filteredReqs = requests.filter(r => {
    if (filter === "deposit")  return r.type === "deposit";
    if (filter === "withdraw") return r.type === "withdraw";
    if (filter === "pending")  return r.status === "pending";
    return true;
  });

  const pendingCount    = requests.filter(r => r.status === "pending").length;
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

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 overflow-hidden">
            <img src="/logo.jpg" alt="Obyo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none">Admin Panel</p>
            <p className="text-[10px] text-[#FF6B00] font-bold">admin@obyo.io</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)" }}>
            <Shield size={10} className="text-[#0ecb81]" />
            <span className="text-[10px] font-black text-[#0ecb81]">Admin</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#f6465d] border border-[#f6465d]/20 hover:bg-[#f6465d]/5 transition-colors">
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
        ] as { id: AdminTab; label: string; badge?: number }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
            className="flex items-center gap-2 flex-1 justify-center py-3 text-sm font-black relative"
            style={{ color: tab === t.id ? "#FF6B00" : "#444" }}>
            {t.label}
            {t.badge ? (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-black"
                style={{ background: "#FFB800" }}>{t.badge}</span>
            ) : null}
            {tab === t.id && (
              <motion.div layoutId="admin-tab" className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full"
                style={{ background: "#FF6B00" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── REQUESTS tab ──────────────────────────────────────────────── */}
        {tab === "requests" && (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {([
                { id: "all",      label: "Tümü"    },
                { id: "pending",  label: "Bekleyen" },
                { id: "deposit",  label: "Yatırma"  },
                { id: "withdraw", label: "Çekme"    },
              ] as { id: ReqFilter; label: string }[]).map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="rounded-full px-3 py-1 text-xs font-bold transition-all"
                  style={{
                    background: filter === f.id ? "#FF6B00" : "#111",
                    color:      filter === f.id ? "#000"    : "#555",
                    border:     filter === f.id ? "1px solid #FF6B00" : "1px solid #1e1e1e",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredReqs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Filter size={28} className="text-white/10 mb-3" />
                <p className="text-sm text-white/20 font-bold">İstek bulunamadı</p>
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
                    className="flex items-center gap-3 w-full p-4 text-left">
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
                              <span className="text-xs font-mono text-white/60 truncate ml-4 max-w-[180px]">{row.value}</span>
                            </div>
                          ))}

                          {req.status === "pending" && (
                            <div className="flex gap-2 mt-1">
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => processRequest(req.id, true)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-black"
                                style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)" }}>
                                <Check size={13} /> Onayla
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => processRequest(req.id, false)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-white"
                                style={{ background: "rgba(246,70,93,0.15)", border: "1px solid rgba(246,70,93,0.25)" }}>
                                <X size={13} className="text-[#f6465d]" /> Reddet
                              </motion.button>
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
                    className="flex items-center gap-3 w-full p-4 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-black"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                      {u.name.charAt(0)}{u.surname.charAt(0)}
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
                                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-black disabled:opacity-40 transition-opacity"
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
      </div>
    </div>
  );
}
