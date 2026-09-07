import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  X, ArrowLeft, Copy, Check, Clock, AlertCircle, CheckCircle2,
  Landmark, Zap, Bitcoin, ArrowDownCircle, ArrowUpCircle,
  ChevronRight, Hash, LogIn,
} from "lucide-react";

/* ─── QR Visual ──────────────────────────────────────────────────────────── */
function QRVisual({ data }: { data: string }) {
  const S = 25, CS = 7;
  const cells: boolean[] = [];
  const inF = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= S - 7) || (r >= S - 7 && c < 7);
  for (let i = 0; i < S * S; i++) {
    const r = Math.floor(i / S), c = i % S;
    if (inF(r, c)) {
      const lr = r < 7 ? r : r - (S - 7), lc = c < 7 ? c : c - (S - 7);
      cells.push(lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4));
      continue;
    }
    if (r === 6 || c === 6) { cells.push((r + c) % 2 === 0); continue; }
    let h = 0;
    for (let j = 0; j < data.length; j++) h = ((h * 31) ^ (data.charCodeAt(j) + i * 7)) & 0xffff;
    cells.push((h ^ i * 0x9e37) % 3 !== 0);
  }
  const total = S * CS;
  return (
    <div style={{ background: "#fff", padding: 10, borderRadius: 16, display: "inline-block" }}>
      <svg width={total} height={total}>
        {cells.map((on, idx) => {
          if (!on) return null;
          const r = Math.floor(idx / S), c = idx % S;
          return <rect key={idx} x={c * CS} y={r * CS} width={CS} height={CS} fill="#000" rx={1} />;
        })}
      </svg>
    </div>
  );
}

/* ─── Countdown ──────────────────────────────────────────────────────────── */
function Countdown({ startedAt }: { startedAt: number }) {
  const [rem, setRem] = useState(15 * 60 - Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setRem(Math.max(0, 15 * 60 - Math.floor((Date.now() - startedAt) / 1000))), 500);
    return () => clearInterval(iv);
  }, [startedAt]);
  const mm = Math.floor(rem / 60).toString().padStart(2, "0");
  const ss = (rem % 60).toString().padStart(2, "0");
  const low = rem < 120;
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
      style={{ background: low ? "rgba(246,70,93,0.08)" : "rgba(255,107,0,0.08)", borderColor: low ? "#f6465d35" : "#FF6B0035" }}>
      <Clock size={13} style={{ color: low ? "#f6465d" : "#FF6B00" }} />
      <span className="text-sm font-black font-mono" style={{ color: low ? "#f6465d" : "#FF6B00" }}>{mm}:{ss}</span>
      <span className="text-xs text-white/40 flex-1">içinde gönderin</span>
    </div>
  );
}

/* ─── Copy ───────────────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
      style={{ background: copied ? "rgba(14,203,129,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#0ecb81" : "#ffffff80", border: copied ? "1px solid #0ecb8130" : "1px solid rgba(255,255,255,0.08)" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const METHODS = [
  { id: "iban",   icon: Landmark, label: "Havale / EFT",   sub: "TR IBAN banka transferi",        color: "#0ecb81", min: 100,  currency: "TRY" },
  { id: "trc20",  icon: Zap,      label: "USDT (TRC20)",   sub: "Tron ağı · ~1 dakika",           color: "#27AE60", min: 10,   currency: "USDT" },
  { id: "crypto", icon: Bitcoin,  label: "Kripto (ERC20)", sub: "Ethereum ağı · ~3 dakika",       color: "#627EEA", min: 10,   currency: "USDT" },
];

const WALLETS: Record<string, { address: string; network: string; min: string; time: string }> = {
  trc20:  { address: "TKXVLatVmzivs3XAQ7WLcKLAGsyPtfxh6S", network: "Tron (TRC20)",     min: "0.01 USDT", time: "~1 dk" },
  crypto: { address: "0x742d35Cc6634C0532925a3b844D28f32be0A5b5f", network: "Ethereum (ERC20)", min: "0.01 USDT", time: "~3 dk" },
};

const IBAN_INFO = { bank: "Garanti BBVA", iban: "TR88 0006 2000 8765 4321 0099 73", holder: "Obyo Financial Technologies Ltd.", swift: "TGBATRISXXX" };

const slide = (dir: 1 | -1) => ({
  initial: { x: dir * 40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -dir * 40, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 36 },
});

type Tab = "deposit" | "withdraw" | "pending";
type DepositStep = "method" | "amount" | "details" | "success";
type WithdrawStep = "method" | "amount" | "success";

interface WalletModalProps { show: boolean; onClose: () => void; defaultTab?: Tab; }

export function WalletModal({ show, onClose, defaultTab = "deposit" }: WalletModalProps) {
  const [, navigate]  = useLocation();
  const { currentUser, requests, addRequest } = useAuth();

  const [tab, setTab]                   = useState<Tab>(defaultTab);
  const [dStep, setDStep]               = useState<DepositStep>("method");
  const [wStep, setWStep]               = useState<WithdrawStep>("method");
  const [dir, setDir]                   = useState<1 | -1>(1);
  const [method, setMethod]             = useState<typeof METHODS[0] | null>(null);
  const [amount, setAmount]             = useState("");
  const [destination, setDestination]   = useState("");
  const [countdownAt, setCountdownAt]   = useState<number | null>(null);
  const [refCode]                       = useState(`OBY-${Math.floor(100000 + Math.random() * 900000)}`);
  const inputRef                        = useRef<HTMLInputElement>(null);

  const userRequests = requests.filter(r => currentUser && r.userId === currentUser.id);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setDStep("method"); setWStep("method"); setMethod(null); setAmount(""); setDestination(""); setCountdownAt(null); }, 350);
  };

  const goD = useCallback((s: DepositStep, fwd = true) => { setDir(fwd ? 1 : -1); setDStep(s); }, []);
  const goW = useCallback((s: WithdrawStep, fwd = true) => { setDir(fwd ? 1 : -1); setWStep(s); }, []);

  useEffect(() => {
    if ((dStep === "amount" || wStep === "amount") && show) setTimeout(() => inputRef.current?.focus(), 200);
  }, [dStep, wStep, show]);

  const selectMethod = (m: typeof METHODS[0], isDeposit: boolean) => {
    setMethod(m); setDir(1);
    isDeposit ? setDStep("amount") : setWStep("amount");
  };

  const handleDepositDetails = () => {
    if (!method || !amount || parseFloat(amount) < method.min) return;
    setDir(1); setDStep("details");
    if (method.id !== "iban") setCountdownAt(Date.now());
  };

  const notifyTelegram = (payload: {
    type: "deposit" | "withdraw";
    userName: string; amount: number; currency: string; method: string;
  }) => {
    fetch("/api/notify/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {/* fire-and-forget */});
  };

  const handleSent = async () => {
    if (!currentUser || !method) return;
    const userName = `${currentUser.name} ${currentUser.surname}`;
    await addRequest({
      userId: currentUser.id, userEmail: currentUser.email, userName,
      type: "deposit", amount: parseFloat(amount),
      currency: method.currency, method: method.label, destination: "",
    });
    notifyTelegram({ type: "deposit", userName, amount: parseFloat(amount), currency: method.currency, method: method.label });
    setDir(1); setDStep("success");
  };

  const handleWithdraw = async () => {
    if (!currentUser || !method || !amount || !destination) return;
    const val = parseFloat(amount);
    if (val > currentUser.realBalance) return;
    const userName = `${currentUser.name} ${currentUser.surname}`;
    await addRequest({
      userId: currentUser.id, userEmail: currentUser.email, userName,
      type: "withdraw", amount: val,
      currency: method.currency, method: method.label, destination,
    });
    notifyTelegram({ type: "withdraw", userName, amount: val, currency: method.currency, method: method.label });
    setDir(1); setWStep("success");
  };

  const sV = slide(dir);

  const notLoggedIn = (
    <div className="p-8 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.2)" }}>
        <LogIn size={28} className="text-[#FF6B00]" />
      </div>
      <div>
        <p className="text-base font-black text-white mb-1">Giriş Gerekiyor</p>
        <p className="text-sm text-white/40">Bu özelliği kullanmak için hesabınıza giriş yapmanız gerekiyor.</p>
      </div>
      <button onClick={() => { handleClose(); navigate("/auth"); }}
        className="w-full rounded-2xl py-3.5 text-sm font-black text-black"
        style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
        Giriş Yap / Kayıt Ol
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={handleClose} />

          <motion.div
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", maxHeight: "92vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3"><div className="w-9 h-1 rounded-full bg-white/10" /></div>

            {/* Tab Bar */}
            <div className="flex border-b border-white/5 mx-5 mt-3">
              {([
                { id: "deposit",  label: "Para Yatır"   },
                { id: "withdraw", label: "Para Çek"      },
                { id: "pending",  label: "Bekleyen"       },
              ] as { id: Tab; label: string }[]).map(t => {
                const cnt = t.id === "pending" ? userRequests.filter(r => r.status === "pending").length : 0;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setDStep("method"); setWStep("method"); setMethod(null); setAmount(""); }}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-black relative"
                    style={{ color: tab === t.id ? "#FF6B00" : "#555" }}>
                    {t.label}
                    {cnt > 0 && <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black text-black" style={{ background: "#FFB800" }}>{cnt}</span>}
                    {tab === t.id && <motion.div layoutId="wallet-tab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: "#FF6B00" }} />}
                  </button>
                );
              })}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 100px)" }}>
              <AnimatePresence mode="wait">

                {/* ── DEPOSIT ─────────────────────────────────────────── */}
                {tab === "deposit" && (
                  <motion.div key={`deposit-${dStep}`} {...sV}>
                    {!currentUser && notLoggedIn}

                    {currentUser && dStep === "method" && (
                      <div className="p-5 flex flex-col gap-3">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">Yatırma Yöntemi</p>
                        {METHODS.map(m => {
                          const Icon = m.icon;
                          return (
                            <motion.button key={m.id} whileTap={{ scale: 0.97 }}
                              onClick={() => selectMethod(m, true)}
                              className="flex items-center gap-4 rounded-2xl p-4 border text-left"
                              style={{ background: `${m.color}0a`, borderColor: `${m.color}22` }}>
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${m.color}1a` }}>
                                <Icon size={20} style={{ color: m.color }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-black text-white">{m.label}</p>
                                <p className="text-[11px] text-white/40 mt-0.5">{m.sub}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold" style={{ color: m.color }}>Min. {m.min} {m.currency}</span>
                                <ChevronRight size={14} className="text-white/25" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {currentUser && dStep === "amount" && method && (
                      <div className="p-5 flex flex-col gap-4">
                        <button onClick={() => goD("method", false)} className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors w-fit">
                          <ArrowLeft size={13} /> {method.label}
                        </button>
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Tutar ({method.currency})</p>
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 focus-within:border-[#FF6B00]/40 transition-colors">
                            <span className="text-xl font-black text-white/20">{method.currency === "TRY" ? "₺" : "$"}</span>
                            <input ref={inputRef} type="number" inputMode="decimal" placeholder="0.00"
                              value={amount} onChange={e => setAmount(e.target.value)}
                              className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/15" />
                            <span className="text-sm font-bold text-white/30">{method.currency}</span>
                          </div>
                          <p className="text-[10px] text-white/25 mt-1.5 px-1">Minimum: {method.min} {method.currency}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(method.currency === "TRY" ? [500, 1000, 2500, 5000] : [50, 100, 250, 500]).map(v => (
                            <button key={v} onClick={() => setAmount(String(v))}
                              className="rounded-xl py-2.5 text-xs font-black transition-all"
                              style={{ background: amount === String(v) ? `${method.color}18` : "rgba(255,255,255,0.04)", border: amount === String(v) ? `1px solid ${method.color}35` : "1px solid rgba(255,255,255,0.06)", color: amount === String(v) ? method.color : "#ffffff60" }}>
                              {method.currency === "TRY" ? `₺${v}` : `$${v}`}
                            </button>
                          ))}
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDepositDetails}
                          disabled={!amount || parseFloat(amount) < method.min}
                          className="w-full rounded-2xl py-4 text-sm font-black text-black disabled:opacity-30"
                          style={{ background: `linear-gradient(135deg,${method.color},${method.color}cc)`, boxShadow: `0 6px 20px ${method.color}30` }}>
                          Devam Et →
                        </motion.button>
                      </div>
                    )}

                    {currentUser && dStep === "details" && method && method.id === "iban" && (
                      <div className="p-5 flex flex-col gap-3">
                        <button onClick={() => goD("amount", false)} className="flex items-center gap-2 text-xs text-white/40 w-fit"><ArrowLeft size={13} /> Geri</button>
                        <div className="rounded-2xl p-4 border border-[#0ecb81]/20" style={{ background: "rgba(14,203,129,0.06)" }}>
                          {[
                            { label: "Banka", value: IBAN_INFO.bank },
                            { label: "Hesap Sahibi", value: IBAN_INFO.holder },
                            { label: "IBAN", value: IBAN_INFO.iban, copy: true },
                            { label: "SWIFT/BIC", value: IBAN_INFO.swift, copy: true },
                            { label: "Açıklama (Zorunlu)", value: refCode, copy: true, accent: "#FFB800" },
                            { label: "Tutar", value: `₺${amount}` },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <span className="text-xs text-white/35 shrink-0">{row.label}</span>
                              <div className="flex items-center gap-2 ml-3">
                                <span className="text-xs font-bold text-right break-all" style={{ color: row.accent ?? "#ffffff" }}>{row.value}</span>
                                {row.copy && <CopyBtn text={row.value} />}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 rounded-xl p-3 border border-[#FFB800]/20" style={{ background: "rgba(255,184,0,0.06)" }}>
                          <AlertCircle size={13} className="text-[#FFB800] mt-0.5 shrink-0" />
                          <p className="text-[11px] text-white/45 leading-relaxed">Açıklama kısmına <span className="text-[#FFB800] font-bold">"{refCode}"</span> yazmayı unutmayın.</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSent}
                          className="w-full rounded-2xl py-4 text-sm font-black text-black"
                          style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)", boxShadow: "0 6px 20px rgba(14,203,129,0.25)" }}>
                          ✓ Gönderdim
                        </motion.button>
                      </div>
                    )}

                    {currentUser && dStep === "details" && method && method.id !== "iban" && (
                      <div className="p-5 flex flex-col gap-3">
                        <button onClick={() => goD("amount", false)} className="flex items-center gap-2 text-xs text-white/40 w-fit"><ArrowLeft size={13} /> Geri</button>
                        {countdownAt && <Countdown startedAt={countdownAt} />}
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-black p-5">
                          <p className="text-xs font-bold text-white/50">{method.label} — {WALLETS[method.id].network}</p>
                          <div className="relative">
                            <QRVisual data={WALLETS[method.id].address} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md">
                                <Zap size={14} className="text-[#27AE60]" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-black p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Cüzdan Adresi</span>
                            <CopyBtn text={WALLETS[method.id].address} />
                          </div>
                          <p className="text-xs font-mono text-white/80 break-all leading-relaxed">{WALLETS[method.id].address}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ l: "Ağ", v: method.id === "trc20" ? "TRC20" : "ERC20" }, { l: "Min.", v: WALLETS[method.id].min }, { l: "Varış", v: WALLETS[method.id].time }].map(i => (
                            <div key={i.l} className="rounded-xl p-2.5 border border-white/6 bg-black text-center">
                              <p className="text-[9px] text-white/30 font-bold uppercase">{i.l}</p>
                              <p className="text-[11px] font-black text-white mt-0.5">{i.v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 rounded-xl p-3 border border-[#f6465d]/15" style={{ background: "rgba(246,70,93,0.06)" }}>
                          <AlertCircle size={12} className="text-[#f6465d] mt-0.5 shrink-0" />
                          <p className="text-[10px] text-white/40 leading-relaxed">Yalnızca <span className="text-white/70 font-bold">USDT</span> gönderin. Min. {WALLETS[method.id].min}.</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSent}
                          className="w-full rounded-2xl py-4 text-sm font-black text-black"
                          style={{ background: `linear-gradient(135deg,${method.color},${method.color}bb)`, boxShadow: `0 6px 20px ${method.color}28` }}>
                          ✓ Gönderdim
                        </motion.button>
                      </div>
                    )}

                    {currentUser && dStep === "success" && (
                      <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                          className="flex h-20 w-20 items-center justify-center rounded-full"
                          style={{ background: "rgba(14,203,129,0.12)", border: "2px solid rgba(14,203,129,0.25)" }}>
                          <CheckCircle2 size={36} className="text-[#0ecb81]" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-black text-white mb-1">İşlem Gönderildi</h3>
                          <p className="text-sm text-white/40 leading-relaxed max-w-xs">İşleminiz onaylanmaya gönderildi. Para yatırma işlemleri <span className="text-white/70 font-bold">anında gerçekleşir.</span></p>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                          className="w-full rounded-2xl py-3.5 text-sm font-black text-black mt-2"
                          style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                          Tamam
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── WITHDRAW ─────────────────────────────────────────── */}
                {tab === "withdraw" && (
                  <motion.div key={`withdraw-${wStep}`} {...sV}>
                    {!currentUser && notLoggedIn}

                    {currentUser && wStep === "method" && (
                      <div className="p-5 flex flex-col gap-3">
                        <div className="rounded-2xl p-3 border border-white/5 bg-black mb-1 flex items-center justify-between">
                          <span className="text-xs text-white/40">Çekilebilir Bakiye</span>
                          <span className="text-sm font-black text-[#0ecb81]">${currentUser.realBalance.toFixed(2)}</span>
                        </div>
                        {currentUser.realBalance <= 0 && (
                          <div className="flex items-start gap-2 rounded-xl p-3 border border-[#FFB800]/20" style={{ background: "rgba(255,184,0,0.06)" }}>
                            <AlertCircle size={13} className="text-[#FFB800] mt-0.5 shrink-0" />
                            <p className="text-xs text-white/50">Para çekebilmek için önce gerçek hesabınıza para yatırmanız gerekiyor.</p>
                          </div>
                        )}
                        {METHODS.map(m => {
                          const Icon = m.icon;
                          return (
                            <motion.button key={m.id} whileTap={{ scale: 0.97 }}
                              onClick={() => selectMethod(m, false)}
                              disabled={currentUser.realBalance <= 0}
                              className="flex items-center gap-4 rounded-2xl p-4 border text-left disabled:opacity-40"
                              style={{ background: `${m.color}0a`, borderColor: `${m.color}22` }}>
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${m.color}1a` }}>
                                <Icon size={20} style={{ color: m.color }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-black text-white">{m.label}</p>
                                <p className="text-[11px] text-white/40 mt-0.5">{m.sub}</p>
                              </div>
                              <ChevronRight size={14} className="text-white/25" />
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {currentUser && wStep === "amount" && method && (
                      <div className="p-5 flex flex-col gap-4">
                        <button onClick={() => goW("method", false)} className="flex items-center gap-2 text-xs text-white/40 w-fit"><ArrowLeft size={13} /> Geri</button>
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Çekim Tutarı</p>
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 focus-within:border-[#FF6B00]/40 transition-colors">
                            <span className="text-xl font-black text-white/20">{method.currency === "TRY" ? "₺" : "$"}</span>
                            <input ref={inputRef} type="number" inputMode="decimal" placeholder="0.00"
                              value={amount} onChange={e => setAmount(e.target.value)}
                              className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/15" />
                            <span className="text-sm font-bold text-white/30">{method.currency}</span>
                          </div>
                          <p className="text-[10px] text-white/25 mt-1.5 px-1">Maks: {currentUser?.currency === "TL" ? "₺" : "$"}{currentUser.realBalance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                            {method.id === "iban" ? "IBAN Numaranız" : "Cüzdan Adresiniz"}
                          </p>
                          <input placeholder={method.id === "iban" ? "TR00 0000 0000 0000 0000 0000 00" : "0x... veya T..."}
                            value={destination} onChange={e => setDestination(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/40 font-mono transition-colors" />
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleWithdraw}
                          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentUser.realBalance || !destination}
                          className="w-full rounded-2xl py-4 text-sm font-black text-black disabled:opacity-30"
                          style={{ background: `linear-gradient(135deg,${method.color},${method.color}cc)`, boxShadow: `0 6px 20px ${method.color}30` }}>
                          Çekim Talebi Oluştur
                        </motion.button>
                      </div>
                    )}

                    {currentUser && wStep === "success" && (
                      <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                          className="flex h-20 w-20 items-center justify-center rounded-full"
                          style={{ background: "rgba(255,107,0,0.12)", border: "2px solid rgba(255,107,0,0.25)" }}>
                          <ArrowUpCircle size={36} className="text-[#FF6B00]" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-black text-white mb-1">Talep Gönderildi</h3>
                          <p className="text-sm text-white/40 leading-relaxed max-w-xs">İşleminiz onaylanmaya gönderildi. Çekim işleminiz <span className="text-white/70 font-bold">1 ile 3 saat içinde</span> sonuçlanacaktır.</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                          className="w-full rounded-2xl py-3.5 text-sm font-black text-black"
                          style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                          Tamam
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── PENDING ──────────────────────────────────────────── */}
                {tab === "pending" && (
                  <motion.div key="pending" {...sV}>
                    {!currentUser && notLoggedIn}
                    {currentUser && (
                      <div className="p-5 flex flex-col gap-3">
                        {userRequests.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Hash size={28} className="text-white/10 mb-3" />
                            <p className="text-sm text-white/20 font-bold">Henüz işlem isteği yok</p>
                            <p className="text-xs text-white/15 mt-1">Yatırma/çekme yaptığınızda burada görünür</p>
                          </div>
                        )}
                        {userRequests.map(req => {
                          const isD = req.type === "deposit";
                          const statusCfg = {
                            pending:  { color: "#FFB800", label: "Bekliyor" },
                            accepted: { color: "#0ecb81", label: "Onaylandı" },
                            rejected: { color: "#f6465d", label: "Reddedildi" },
                          }[req.status];
                          return (
                            <div key={req.id} className="rounded-2xl p-4" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isD ? <ArrowDownCircle size={14} className="text-[#0ecb81]" /> : <ArrowUpCircle size={14} className="text-[#FF6B00]" />}
                                  <span className="text-sm font-black text-white">{isD ? "Para Yatırma" : "Para Çekme"}</span>
                                </div>
                                <span className="text-sm font-black" style={{ color: isD ? "#0ecb81" : "#FF6B00" }}>
                                  {isD ? "+" : "-"}{currentUser?.currency === "TL" ? "₺" : "$"}{req.amount} {req.currency}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/30 font-mono">{req.id}</span>
                                <span className="rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: `${statusCfg.color}18`, color: statusCfg.color }}>
                                  {statusCfg.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/20 mt-1">{new Date(req.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
