import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, Copy, Check, ChevronRight,
  Landmark, Bitcoin, Zap, TrendingUp, Shield,
  Clock, AlertCircle, CheckCircle2, ChevronDown,
} from "lucide-react";

/* ─── Fake QR code (SVG grid) ────────────────────────────────────────────── */
function QRVisual({ data }: { data: string }) {
  const S = 25;
  const CS = 7;
  const cells: boolean[] = [];

  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= S - 7) || (r >= S - 7 && c < 7);

  for (let i = 0; i < S * S; i++) {
    const r = Math.floor(i / S), c = i % S;
    if (inFinder(r, c)) {
      const lr = r < 7 ? r : r - (S - 7);
      const lc = c < 7 ? c : c - (S - 7);
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
    <div style={{ background: "#fff", padding: 10, borderRadius: 16, display: "inline-block", boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }}>
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

/* ─── 15-min countdown ───────────────────────────────────────────────────── */
function Countdown({ startedAt }: { startedAt: number }) {
  const [rem, setRem] = useState(15 * 60 - Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const iv = setInterval(() => {
      const r = 15 * 60 - Math.floor((Date.now() - startedAt) / 1000);
      setRem(Math.max(0, r));
    }, 500);
    return () => clearInterval(iv);
  }, [startedAt]);
  const mm = Math.floor(rem / 60).toString().padStart(2, "0");
  const ss = (rem % 60).toString().padStart(2, "0");
  const isLow = rem < 120;
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
      style={{
        background: isLow ? "rgba(246,70,93,0.08)" : "rgba(255,107,0,0.08)",
        borderColor: isLow ? "#f6465d35" : "#FF6B0035",
      }}>
      <Clock size={13} style={{ color: isLow ? "#f6465d" : "#FF6B00" }} />
      <span className="text-sm font-black font-mono" style={{ color: isLow ? "#f6465d" : "#FF6B00" }}>
        {mm}:{ss}
      </span>
      <span className="text-xs text-white/40 flex-1">içinde gönderin</span>
      {rem === 0 && <span className="text-xs text-[#f6465d] font-bold">Süre Doldu!</span>}
    </div>
  );
}

/* ─── Copy button ────────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
      style={{
        background: copied ? "rgba(14,203,129,0.15)" : "rgba(255,255,255,0.06)",
        color: copied ? "#0ecb81" : "#ffffff80",
        border: copied ? "1px solid #0ecb8130" : "1px solid rgba(255,255,255,0.08)",
      }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

/* ─── PAYMENT METHODS ────────────────────────────────────────────────────── */
const METHODS = [
  {
    id: "iban",
    icon: Landmark,
    label: "Havale / EFT",
    sub: "TR IBAN ile banka transferi",
    color: "#0ecb81",
    minAmount: 100,
    currency: "TRY",
  },
  {
    id: "trc20",
    icon: Zap,
    label: "USDT (TRC20)",
    sub: "Tron ağı · Yaklaşık 1 dakika",
    color: "#27AE60",
    minAmount: 10,
    currency: "USDT",
  },
  {
    id: "crypto",
    icon: Bitcoin,
    label: "Kripto (ERC20)",
    sub: "Ethereum ağı · USDT / ETH",
    color: "#627EEA",
    minAmount: 10,
    currency: "USDT",
  },
];

const WALLETS: Record<string, { address: string; network: string; minDeposit: string; arrivalTime: string }> = {
  trc20: {
    address: "TKXVLatVmzivs3XAQ7WLcKLAGsyPtfxh6S",
    network: "Tron (TRC20)",
    minDeposit: "0.01 USDT",
    arrivalTime: "~1 dakika",
  },
  crypto: {
    address: "0x742d35Cc6634C0532925a3b844D28f32be0A5b5f",
    network: "Ethereum (ERC20)",
    minDeposit: "0.01 USDT",
    arrivalTime: "~3 dakika",
  },
};

const IBAN_INFO = {
  bank: "Garanti BBVA",
  iban: "TR88 0006 2000 8765 4321 0099 73",
  holder: "Obyo Financial Technologies Ltd.",
  swift: "TGBATRISXXX",
};

/* ─── STEP SLIDE VARIANTS ─────────────────────────────────────────────────── */
const slide = (dir: 1 | -1) => ({
  initial: { x: dir * 48, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit:    { x: -dir * 48, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 420, damping: 36 },
});

type Step = "home" | "method" | "amount" | "details" | "confirm";

interface DepositModalProps {
  show: boolean;
  onClose: () => void;
}

export function DepositModal({ show, onClose }: DepositModalProps) {
  const [step,        setStep]        = useState<Step>("home");
  const [dir,         setDir]         = useState<1 | -1>(1);
  const [method,      setMethod]      = useState<typeof METHODS[0] | null>(null);
  const [amount,      setAmount]      = useState("");
  const [countdownAt, setCountdownAt] = useState<number | null>(null);
  const [refCode]     = useState(`OBY-${Math.floor(100000 + Math.random() * 900000)}`);
  const inputRef      = useRef<HTMLInputElement>(null);

  const go = useCallback((next: Step, forward = true) => {
    setDir(forward ? 1 : -1);
    setStep(next);
  }, []);

  const back = useCallback(() => {
    if (step === "method")  go("home",   false);
    if (step === "amount")  go("method", false);
    if (step === "details") go("amount", false);
    if (step === "confirm") go("details", false);
  }, [step, go]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("home"); setMethod(null); setAmount(""); setCountdownAt(null);
    }, 350);
  };

  const selectMethod = (m: typeof METHODS[0]) => {
    setMethod(m);
    go("amount");
  };

  const goToDetails = () => {
    if (!amount || parseFloat(amount) < (method?.minAmount ?? 0)) return;
    if (method?.id === "iban") {
      go("details");
    } else {
      go("details");
      setCountdownAt(Date.now());
    }
  };

  const goConfirm = () => go("confirm");

  useEffect(() => {
    if (step === "amount") setTimeout(() => inputRef.current?.focus(), 200);
  }, [step]);

  const sV = slide(dir);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", maxHeight: "92vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0.5">
              <div className="w-9 h-1 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                {step !== "home" && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    onClick={back}
                    className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/8"
                  >
                    <ArrowLeft size={13} className="text-white/50" />
                  </motion.button>
                )}
                <div>
                  <h2 className="text-sm font-black text-white">
                    {step === "home"    && "Hesap Türü"}
                    {step === "method"  && "Ödeme Yöntemi"}
                    {step === "amount"  && "Yatırım Tutarı"}
                    {step === "details" && (method?.id === "iban" ? "Havale Bilgileri" : "Ödeme Adresi")}
                    {step === "confirm" && "Bildiriminiz Alındı"}
                  </h2>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {step === "home" && "Demo veya gerçek hesap"}
                    {step === "method" && "Para yatırma yöntemi seçin"}
                    {step === "amount" && `Min. ${method?.minAmount} ${method?.currency}`}
                    {step === "details" && "Ödemeyi aşağıdaki adrese yapın"}
                    {step === "confirm" && "En kısa sürede hesabınıza yansıyacak"}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                <X size={13} className="text-white/40" />
              </button>
            </div>

            {/* Step content */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 90px)" }}>
              <AnimatePresence mode="wait" custom={dir}>

                {/* ── HOME ──────────────────────────────────────────────── */}
                {step === "home" && (
                  <motion.div key="home" {...sV} className="p-5 flex flex-col gap-3">
                    {/* Demo card */}
                    <div className="rounded-2xl p-4 border border-[#FFB800]/20"
                      style={{ background: "linear-gradient(135deg,rgba(255,184,0,0.08),rgba(255,107,0,0.04))" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: "rgba(255,184,0,0.15)" }}>
                          <TrendingUp size={18} className="text-[#FFB800]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">Demo Hesap</p>
                          <p className="text-[11px] text-[#FFB800]">$10,000 sanal bakiye aktif</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black text-[#0ecb81]"
                          style={{ background: "rgba(14,203,129,0.12)", border: "1px solid rgba(14,203,129,0.2)" }}>
                          <div className="h-1.5 w-1.5 rounded-full bg-[#0ecb81] animate-pulse" /> AKTİF
                        </div>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Sanal bakiye ile tüm işlemleri risksiz deneyebilirsiniz. Gerçek para yatırımı gerekmez.
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/6" />
                      <span className="text-[10px] text-white/20 font-bold">VEYA</span>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>

                    {/* Real account CTA */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => go("method")}
                      className="flex items-center gap-4 rounded-2xl p-4 border border-[#FF6B00]/25 text-left transition-all active:opacity-90"
                      style={{ background: "linear-gradient(135deg,rgba(255,107,0,0.12),rgba(255,184,0,0.06))" }}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(255,107,0,0.18)" }}>
                        <Landmark size={20} className="text-[#FF6B00]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">Gerçek Hesaba Geç</p>
                        <p className="text-[11px] text-white/40 mt-0.5">IBAN · Kripto · USDT TRC20</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {["ISO 27001", "SSL", "IFMRRC"].map((b) => (
                            <span key={b} className="rounded px-1.5 py-0.5 text-[8px] font-black text-[#0ecb81]"
                              style={{ background: "rgba(14,203,129,0.10)" }}>{b}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-white/30 shrink-0" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ── METHOD ────────────────────────────────────────────── */}
                {step === "method" && (
                  <motion.div key="method" {...sV} className="p-5 flex flex-col gap-3">
                    {METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => selectMethod(m)}
                          className="flex items-center gap-4 rounded-2xl p-4 border text-left transition-all"
                          style={{ background: `${m.color}0a`, borderColor: `${m.color}22` }}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: `${m.color}1a` }}>
                            <Icon size={20} style={{ color: m.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-white">{m.label}</p>
                            <p className="text-[11px] text-white/40 mt-0.5">{m.sub}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold" style={{ color: m.color }}>
                              Min. {m.minAmount} {m.currency}
                            </span>
                            <ChevronRight size={14} className="text-white/25" />
                          </div>
                        </motion.button>
                      );
                    })}
                    <div className="rounded-xl p-3 border border-white/5 mt-1">
                      <div className="flex items-start gap-2">
                        <Shield size={12} className="text-[#0ecb81] mt-0.5 shrink-0" />
                        <p className="text-[10px] text-white/30 leading-relaxed">
                          Tüm ödemeler SSL 256-bit şifreleme ile korunmaktadır. Obyo Financial Technologies Ltd. IFMRRC lisanslıdır.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── AMOUNT ────────────────────────────────────────────── */}
                {step === "amount" && method && (
                  <motion.div key="amount" {...sV} className="p-5 flex flex-col gap-4">
                    {/* Selected method chip */}
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-white/8 bg-white/3 w-fit">
                      <div className="h-2 w-2 rounded-full" style={{ background: method.color }} />
                      <span className="text-xs font-bold text-white/60">{method.label}</span>
                    </div>

                    {/* Amount input */}
                    <div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Tutar ({method.currency})</p>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 focus-within:border-[#FF6B00]/40 transition-colors">
                        <span className="text-xl font-black text-white/20">
                          {method.currency === "TRY" ? "₺" : "$"}
                        </span>
                        <input
                          ref={inputRef}
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/15"
                        />
                        <span className="text-sm font-bold text-white/30">{method.currency}</span>
                      </div>
                      <p className="text-[10px] text-white/25 mt-1.5 px-1">
                        Minimum yatırma: {method.minAmount} {method.currency}
                      </p>
                    </div>

                    {/* Quick amounts */}
                    <div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Hızlı Seçim</p>
                      <div className="grid grid-cols-4 gap-2">
                        {(method.currency === "TRY"
                          ? [500, 1000, 2500, 5000]
                          : [50, 100, 250, 500]
                        ).map((v) => (
                          <button key={v}
                            onClick={() => setAmount(String(v))}
                            className="rounded-xl py-2.5 text-xs font-black transition-all"
                            style={{
                              background: amount === String(v) ? `${method.color}18` : "rgba(255,255,255,0.04)",
                              border: amount === String(v) ? `1px solid ${method.color}35` : "1px solid rgba(255,255,255,0.06)",
                              color: amount === String(v) ? method.color : "#ffffff60",
                            }}>
                            {method.currency === "TRY" ? `₺${v}` : `$${v}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={goToDetails}
                      disabled={!amount || parseFloat(amount) < method.minAmount}
                      className="w-full rounded-2xl py-4 text-sm font-black text-black transition-all disabled:opacity-30"
                      style={{ background: `linear-gradient(135deg,${method.color},${method.color}cc)`, boxShadow: `0 6px 20px ${method.color}30` }}
                    >
                      Devam Et →
                    </motion.button>
                  </motion.div>
                )}

                {/* ── DETAILS: IBAN ─────────────────────────────────────── */}
                {step === "details" && method?.id === "iban" && (
                  <motion.div key="details-iban" {...sV} className="p-5 flex flex-col gap-3">
                    <div className="rounded-2xl p-4 border border-[#0ecb81]/20" style={{ background: "rgba(14,203,129,0.06)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Landmark size={14} className="text-[#0ecb81]" />
                        <span className="text-xs font-black text-[#0ecb81]">Havale / EFT Bilgileri</span>
                      </div>
                      {[
                        { label: "Banka",         value: IBAN_INFO.bank },
                        { label: "Hesap Sahibi",  value: IBAN_INFO.holder },
                        { label: "IBAN",          value: IBAN_INFO.iban, copy: true },
                        { label: "SWIFT/BIC",     value: IBAN_INFO.swift, copy: true },
                        { label: "Açıklama",      value: refCode, copy: true, accent: "#FFB800" },
                        { label: "Tutar",         value: `₺${amount}` },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-xs text-white/35 shrink-0">{row.label}</span>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-xs font-bold text-right break-all"
                              style={{ color: row.accent ?? "#ffffff" }}>
                              {row.value}
                            </span>
                            {row.copy && <CopyBtn text={row.value} />}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 rounded-xl p-3 border border-[#FFB800]/20" style={{ background: "rgba(255,184,0,0.06)" }}>
                      <AlertCircle size={13} className="text-[#FFB800] mt-0.5 shrink-0" />
                      <p className="text-[11px] text-white/45 leading-relaxed">
                        Havaleyi yaptıktan sonra <span className="text-[#FFB800] font-bold">"{refCode}"</span> açıklamasını mutlaka ekleyin. Açıklama eksik transferlerde işlem gecikebilir.
                      </p>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={goConfirm}
                      className="w-full rounded-2xl py-4 text-sm font-black text-black"
                      style={{ background: "linear-gradient(135deg,#0ecb81,#05a660)", boxShadow: "0 6px 20px rgba(14,203,129,0.25)" }}>
                      ✓ Gönderdim
                    </motion.button>
                  </motion.div>
                )}

                {/* ── DETAILS: CRYPTO / TRC20 ───────────────────────────── */}
                {step === "details" && method && method.id !== "iban" && (
                  <motion.div key="details-crypto" {...sV} className="p-5 flex flex-col gap-3">
                    {/* Countdown */}
                    {countdownAt && <Countdown startedAt={countdownAt} />}

                    {/* QR */}
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
                      <p className="text-[10px] text-white/30">Yalnızca <span className="font-bold text-white/60">{WALLETS[method.id].network}</span> ağına gönderin</p>
                    </div>

                    {/* Address */}
                    <div className="rounded-2xl border border-white/8 bg-black p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Cüzdan Adresi</span>
                        <CopyBtn text={WALLETS[method.id].address} />
                      </div>
                      <p className="text-xs font-mono text-white/80 break-all leading-relaxed">
                        {WALLETS[method.id].address}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Ağ",    value: method.id === "trc20" ? "TRC20" : "ERC20" },
                        { label: "Min.",   value: WALLETS[method.id].minDeposit },
                        { label: "Varış",  value: WALLETS[method.id].arrivalTime },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl p-2.5 border border-white/6 bg-black text-center">
                          <p className="text-[9px] text-white/30 font-bold uppercase">{item.label}</p>
                          <p className="text-[11px] font-black text-white mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 rounded-xl p-3 border border-[#f6465d]/15" style={{ background: "rgba(246,70,93,0.06)" }}>
                      <AlertCircle size={12} className="text-[#f6465d] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        Yalnızca <span className="text-white/70 font-bold">USDT</span> gönderin. Farklı token göndermek kalıcı kayba yol açar. Minimum tutar: {WALLETS[method.id].minDeposit}.
                      </p>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={goConfirm}
                      className="w-full rounded-2xl py-4 text-sm font-black text-black"
                      style={{
                        background: `linear-gradient(135deg,${method.color},${method.color}bb)`,
                        boxShadow: `0 6px 20px ${method.color}28`,
                      }}>
                      ✓ Gönderdim
                    </motion.button>
                  </motion.div>
                )}

                {/* ── CONFIRM ───────────────────────────────────────────── */}
                {step === "confirm" && (
                  <motion.div key="confirm" {...sV} className="p-8 flex flex-col items-center gap-4 text-center">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ background: "rgba(14,203,129,0.12)", border: "2px solid rgba(14,203,129,0.25)" }}
                    >
                      <CheckCircle2 size={36} className="text-[#0ecb81]" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">Bildiriminiz Alındı</h3>
                      <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                        Ödemeniz doğrulandıktan sonra bakiyeniz <span className="text-white/70 font-bold">en geç 30 dakika</span> içinde hesabınıza yansıyacak.
                      </p>
                    </div>
                    <div className="w-full rounded-2xl p-4 border border-white/6 bg-black text-sm">
                      <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                        <span className="text-white/35">Yöntem</span>
                        <span className="font-bold text-white">{method?.label}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-white/35">Tutar</span>
                        <span className="font-bold text-[#0ecb81]">{method?.currency === "TRY" ? "₺" : "$"}{amount}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/25 leading-relaxed max-w-xs">
                      Destek için: <span className="text-[#FF6B00]">destek@obyo.io</span>
                    </p>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                      className="w-full rounded-2xl py-3.5 text-sm font-black text-black mt-2"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}>
                      Tamam
                    </motion.button>
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
