import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth, type PaymentSettings, type CustomPaymentMethod, compressDataUrlIfNeeded } from "@/context/AuthContext";
import { useAccountMode } from "@/context/AccountModeContext";
import { useLanguage } from "@/context/LanguageContext";
import { UsdtTrc20Icon } from "@/components/usdt-trc20-icon";
import { UsdtErc20Icon } from "@/components/usdt-erc20-icon";
import { BankTransferIcon } from "@/components/bank-transfer-icon";
import { useIsTurkey } from "@/lib/use-country";
import {
  ArrowLeft, Copy, Check, Clock, AlertCircle, CheckCircle2,
  Landmark, Zap, Bitcoin, ArrowDownCircle, ArrowUpCircle,
  ChevronRight, Hash, LogIn, ArrowDownLeft, ArrowUpRight,
  ShieldCheck, RefreshCw, Wallet as WalletIcon, ExternalLink,
  CreditCard, QrCode, CircleDollarSign, Coins, FileText,
  UploadCloud, Eye, Trash2, X, Paperclip,
} from "lucide-react";

/* ─── Fake QR code (SVG grid) ────────────────────────────────────────────── */
function QRVisual({ data, imgSrc }: { data: string; imgSrc?: string }) {
  if (imgSrc) {
    return (
      <div className="bg-black/50 border border-white/10 rounded-2xl p-1 shadow-lg inline-block">
        <img src={imgSrc} alt="QR Code" style={{ width: 175, height: 175, objectFit: "contain", borderRadius: "12px" }} />
      </div>
    );
  }

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
    <div style={{ background: "#fff", padding: 12, borderRadius: 20, display: "inline-block", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
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
    const iv = setInterval(() => setRem(Math.max(0, 15 * 60 - Math.floor((Date.now() - startedAt) / 1000))), 500);
    return () => clearInterval(iv);
  }, [startedAt]);
  const mm = Math.floor(rem / 60).toString().padStart(2, "0");
  const ss = (rem % 60).toString().padStart(2, "0");
  const low = rem < 120;
  return (
    <div className="flex items-center gap-2 rounded-2xl px-4 py-3 border transition-colors"
      style={{
        background: low ? "rgba(246,70,93,0.08)" : "rgba(255,107,0,0.08)",
        borderColor: low ? "rgba(246,70,93,0.25)" : "rgba(255,107,0,0.25)"
      }}>
      <Clock size={15} style={{ color: low ? "#f6465d" : "#FF6B00" }} />
      <span className="text-sm font-black font-mono tracking-wider" style={{ color: low ? "#f6465d" : "#FF6B00" }}>{mm}:{ss}</span>
      <span className="text-xs text-white/50 flex-1">içinde transferi tamamlayın</span>
    </div>
  );
}

/* ─── Copy Button ────────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
      style={{
        background: copied ? "rgba(14,203,129,0.15)" : "rgba(255,255,255,0.06)",
        color: copied ? "#0ecb81" : "#ffffff90",
        border: copied ? "1px solid rgba(14,203,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

/* ─── Constants & Types ──────────────────────────────────────────────────── */
export type WalletTab = "deposit" | "withdraw" | "pending";
type DepositStep = "method" | "amount" | "details" | "success";
type WithdrawStep = "method" | "amount" | "success";

interface MethodConfig {
  id: string;
  icon: React.ElementType;
  label: string;
  sub: string;
  badge?: string;
  color: string;
  min: number;
  currency: string;
  customData?: CustomPaymentMethod;
}

export default function WalletPage() {
  const [, navigate] = useLocation();
  const { currentUser, requests, addRequest, paymentSettings, isRejectionViewed, markRejectionsAsViewed } = useAuth();
  const { isReal, currency, currencySymbol } = useAccountMode();
  const { t } = useLanguage();

  const isTL = (currentUser?.currency || currency) === "TL";
  const userSym = isTL ? "₺" : "$";
  const userCurrCode = isTL ? "TL" : "USD";
  const USD_TRY_RATE = 38.0;
  const withdrawMin = isTL ? 150 : 5;

  const isTurkey = useIsTurkey();

  // Dynamic deposit methods based on admin settings (enabled / disabled & custom methods)
  const depositMethods: MethodConfig[] = [];

  // 1. Havale / EFT
  if (paymentSettings.ibanEnabled !== false && isTurkey) {
    depositMethods.push({
      id: "iban",
      icon: BankTransferIcon,
      label: isTL ? t.bankWire : t.wireTransfer,
      sub: isTL ? t.bankWireTr : t.bankWireTrSub,
      color: "#FFA800",
      min: isTL ? 350 : 5,
      currency: isTL ? "TL" : "USD",
    });
  }

  // 2. USDT TRC-20
  if (paymentSettings.trc20Enabled !== false) {
    depositMethods.push({
      id: "trc20",
      icon: UsdtTrc20Icon,
      label: "USDT (TRC-20)",
      sub: t.tronSub,
      color: "#27AE60",
      min: isTL ? 500 : 10,
      currency: isTL ? "TL" : "USDT",
    });
  }

  // 3. USDT ERC-20
  if (paymentSettings.erc20Enabled !== false) {
    depositMethods.push({
      id: "crypto",
      icon: UsdtErc20Icon,
      label: "USDT / Kripto (ERC-20)",
      sub: t.ethSub,
      color: "#627EEA",
      min: isTL ? 500 : 10,
      currency: isTL ? "TL" : "USDT",
    });
  }

  // 4. Custom Payment Methods added by Admin
  (paymentSettings.customMethods || []).forEach((cm) => {
    if (cm.enabled === false) return;

    let IconComp: React.ElementType = WalletIcon;
    if (cm.iconType === "bank") IconComp = Landmark;
    else if (cm.iconType === "crypto") IconComp = Bitcoin;
    else if (cm.iconType === "card") IconComp = CreditCard;
    else if (cm.iconType === "qr") IconComp = QrCode;
    else if (cm.iconType === "dollar") IconComp = CircleDollarSign;

    depositMethods.push({
      id: cm.id,
      icon: IconComp,
      label: cm.name,
      sub: cm.subtitle || `${cm.currency} ile transfer`,
      badge: cm.badge,
      color: cm.color || "#9B51E0",
      min: Number(cm.minAmount) || (isTL ? 100 : 5),
      currency: cm.currency || (isTL ? "TL" : "USD"),
      customData: cm,
    });
  });

  const withdrawMethods: MethodConfig[] = [
    ...(isTurkey ? [{
      id: "iban",
      icon: BankTransferIcon,
      label: isTL ? t.bankWire : t.wireTransfer,
      sub: isTL ? t.bankWireTr : t.bankWireTrSub,
      color: "#FFA800",
      min: withdrawMin,
      currency: isTL ? "TL" : "USD",
    }] : []),
    {
      id: "trc20",
      icon: UsdtTrc20Icon,
      label: "USDT (TRC-20)",
      sub: t.tronSub,
      color: "#27AE60",
      min: withdrawMin,
      currency: isTL ? "TL" : "USDT",
    },
    {
      id: "crypto",
      icon: UsdtErc20Icon,
      label: "USDT / Kripto (ERC-20)",
      sub: t.ethSub,
      color: "#627EEA",
      min: withdrawMin,
      currency: isTL ? "TL" : "USDT",
    },
  ];

  // Read tab parameter from URL search or default to "deposit"
  const getInitialTab = (): WalletTab => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const tParam = params.get("tab");
      if (tParam === "withdraw" || tParam === "pending" || tParam === "deposit") {
        return tParam;
      }
    } catch {
      // ignore
    }
    return "deposit";
  };

  const [tab, setTab] = useState<WalletTab>(getInitialTab);
  const [dStep, setDStep] = useState<DepositStep>("method");
  const [wStep, setWStep] = useState<WithdrawStep>("method");
  const [method, setMethod] = useState<MethodConfig | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [countdownAt, setCountdownAt] = useState<number | null>(null);
  const [refCode] = useState(() => `OBY-${Math.floor(100000 + Math.random() * 900000)}`);
  const transferCode = paymentSettings.ibanDescription?.trim() || refCode;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Receipt upload states for IBAN / Havale deposit
  const [receiptFile, setReceiptFile] = useState<{
    dataUrl: string;
    name: string;
    size: number;
  } | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
  const [previewReceiptModal, setPreviewReceiptModal] = useState<{ url: string; name?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleReceiptChange = async (file: File | null) => {
    if (!file) return;
    setReceiptError(null);

    // Check size limit: max 15MB
    if (file.size > 15 * 1024 * 1024) {
      setReceiptError("Dosya boyutu 15 MB'dan küçük olmalıdır.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setReceiptError("Lütfen geçerli bir resim formatı yükleyiniz (JPG, PNG, WEBP).");
      return;
    }

    setIsProcessingReceipt(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawData = ev.target?.result as string;
        if (!rawData) {
          setIsProcessingReceipt(false);
          setReceiptError("Dosya okunamadı, lütfen tekrar deneyiniz.");
          return;
        }

        try {
          const compressed = await compressDataUrlIfNeeded(rawData, 1200, 0.75);
          setReceiptFile({
            dataUrl: compressed,
            name: file.name,
            size: Math.round(compressed.length * 0.75),
          });
        } catch {
          setReceiptFile({
            dataUrl: rawData,
            name: file.name,
            size: file.size,
          });
        }
        setIsProcessingReceipt(false);
      };
      reader.onerror = () => {
        setIsProcessingReceipt(false);
        setReceiptError("Dosya yüklenirken bir hata oluştu.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsProcessingReceipt(false);
      setReceiptError(err?.message || "Dekont işlenirken hata oluştu.");
    }
  };

  // Focus input when moving to amount step
  useEffect(() => {
    if (dStep === "amount" || wStep === "amount") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [dStep, wStep]);

  // Active user requests
  const userRequests = requests.filter(r => currentUser && (
    r.userId === currentUser.id ||
    (r.userEmail && currentUser.email && r.userEmail.toLowerCase() === currentUser.email.toLowerCase())
  ));
  const pendingRequests = userRequests.filter(r => r.status === "pending");
  const unviewedRejections = userRequests.filter(r => r.status === "rejected" && !isRejectionViewed(r));

  // Sync tab with URL search if changed externally
  useEffect(() => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const tParam = params.get("tab");
      if (tParam === "withdraw" || tParam === "pending" || tParam === "deposit") {
        setTab(tParam as WalletTab);
      }
    } catch {}
  }, []);

  // When user enters transactions tab, clear rejected notifications immediately
  useEffect(() => {
    if (tab === "pending") {
      const unviewed = userRequests.filter(r => r.status === "rejected" && !isRejectionViewed(r));
      if (unviewed.length > 0) {
        markRejectionsAsViewed(unviewed.map(r => r.id));
      }
    }
  }, [tab, userRequests, isRejectionViewed, markRejectionsAsViewed]);

  const switchTab = (newTab: WalletTab) => {
    setTab(newTab);
    if (newTab === "deposit") resetDeposit();
    if (newTab === "withdraw") resetWithdraw();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  const selectDepositMethod = (m: MethodConfig) => {
    setMethod(m);
    setAmount("");
    setReceiptFile(null);
    setReceiptError(null);
    setDStep("amount");
  };

  const selectWithdrawMethod = (m: MethodConfig) => {
    setMethod(m);
    setAmount("");
    setDestination("");
    setWStep("amount");
  };

  const handleDepositDetails = () => {
    if (!method || !amount || parseFloat(amount) < method.min) return;
    setReceiptError(null);
    setDStep("details");
    if (method.id !== "iban") {
      setCountdownAt(Date.now());
    }
  };

  const notifyTelegram = (payload: {
    type: "deposit" | "withdraw";
    userName: string;
    amount: number;
    currency: string;
    method: string;
    hasReceipt?: boolean;
  }) => {
    fetch("/api/notify/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => { /* fire-and-forget */ });
  };

  const handleSentDeposit = async () => {
    if (!currentUser || !method) return;

    // Check if IBAN transfer requires receipt
    if (method.id === "iban" && !receiptFile?.dataUrl) {
      setReceiptError("Banka havale/EFT transferi için lütfen transfer dekontunu yükleyiniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userName = `${currentUser.name} ${currentUser.surname}`;
      const numAmt = parseFloat(amount);

      let methodLabelWithCode = method.label;
      if (method.customData) {
        const code = method.customData.transferCode?.trim();
        methodLabelWithCode = `${method.label}${code ? ` (${code})` : ""}`;
      } else if (method.id === "iban") {
        methodLabelWithCode = `${method.label} (${transferCode})`;
      }

      const dest = method.customData?.accountNumber || "";

      await addRequest({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        type: "deposit",
        amount: numAmt,
        currency: method.currency,
        method: methodLabelWithCode,
        destination: dest,
        receiptUrl: receiptFile?.dataUrl,
        receiptName: receiptFile?.name,
      });

      notifyTelegram({
        type: "deposit",
        userName,
        amount: numAmt,
        currency: method.currency,
        method: methodLabelWithCode,
        hasReceipt: Boolean(receiptFile?.dataUrl),
      });

      setReceiptFile(null);
      setReceiptError(null);
      setDStep("success");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser || !method || !amount || !destination) return;
    if (currentUser.kycStatus !== "verified") return;
    const val = parseFloat(amount);
    if (isNaN(val) || val < withdrawMin || val > currentUser.realBalance) return;
    setIsSubmitting(true);
    try {
      const userName = `${currentUser.name} ${currentUser.surname}`;
      await addRequest({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName,
        type: "withdraw",
        amount: val,
        currency: method.currency,
        method: method.label,
        destination,
      });
      notifyTelegram({
        type: "withdraw",
        userName,
        amount: val,
        currency: method.currency,
        method: method.label,
      });
      setWStep("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDeposit = () => {
    setDStep("method");
    setMethod(null);
    setAmount("");
    setCountdownAt(null);
  };

  const resetWithdraw = () => {
    setWStep("method");
    setMethod(null);
    setAmount("");
    setDestination("");
  };

  const handleBack = () => {
    if (tab === "deposit") {
      if (dStep === "details") { setDStep("amount"); return; }
      if (dStep === "amount") { setDStep("method"); return; }
    }
    if (tab === "withdraw") {
      if (wStep === "amount") { setWStep("method"); return; }
    }
    navigate("/");
  };

  /* Not logged in gate */
  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#050505] text-white overflow-y-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-20">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={16} /> {t.back}
          </button>
          <div className="w-16" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto my-auto">
          <h2 className="text-xl font-black text-white mb-2">{t.needLogin}</h2>
          <p className="text-sm text-white/45 leading-relaxed mb-6">
            {t.needLoginDesc}
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/auth")}
            className="w-full py-4 rounded-2xl text-sm font-black text-black cursor-pointer shadow-lg"
            style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
          >
            {t.loginRegister}
          </motion.button>
        </div>
      </div>
    );
  }

  const realBal = currentUser.realBalance ?? 0;
  const currencySym = currentUser.currency === "TL" ? "₺" : "$";

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-white overflow-hidden">
      {/* ── Modern Quick Overview Card ─────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1.5 shrink-0">
        <div className="relative rounded-3xl p-5 overflow-hidden border border-white/8"
          style={{
            background: "linear-gradient(135deg, #101014 0%, #0d0e12 60%, #08080a 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
          }}>
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,107,0,0.12), transparent 70%)" }} />

          <div className="relative flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              {t.realWalletBalance}
            </span>
          </div>

          <div className="relative flex items-baseline gap-2 mb-4">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {userSym}{realBal.toLocaleString(isTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-white/35">{userCurrCode}</span>
          </div>

          {/* Quick Segment Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/5">
            <button
              onClick={() => switchTab("deposit")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                tab === "deposit"
                  ? "bg-white/15 text-white shadow-md"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <ArrowDownLeft size={13} strokeWidth={2.6} />
              <span>{t.depositBtn}</span>
            </button>

            <button
              onClick={() => switchTab("withdraw")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                tab === "withdraw"
                  ? "bg-white/15 text-white shadow-md"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <ArrowUpRight size={13} strokeWidth={2.6} />
              <span>{t.withdrawBtn}</span>
            </button>

            <button
              onClick={() => switchTab("pending")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all relative cursor-pointer ${
                tab === "pending"
                  ? "bg-white/15 text-white shadow-md"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Clock size={13} strokeWidth={2.4} />
              <span>{t.transactionsTab}</span>
              {pendingRequests.length > 0 ? (
                <span className="h-2 w-2 rounded-full bg-[#FFB800] absolute top-1.5 right-1.5 animate-pulse" />
              ) : unviewedRejections.length > 0 ? (
                <span className="h-2 w-2 rounded-full bg-[#f6465d] absolute top-1.5 right-1.5" />
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Tab Content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
        <div className="max-w-xl mx-auto flex flex-col gap-4">

          {/* Rejection Notification Banner */}
          {tab !== "pending" && unviewedRejections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => switchTab("pending")}
              className="p-3 rounded-2xl bg-[#f6465d]/10 border border-[#f6465d]/25 flex items-center justify-between cursor-pointer hover:bg-[#f6465d]/15 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-xl bg-[#f6465d]/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} className="text-[#f6465d]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    İşlem Talebiniz Reddedildi
                  </span>
                  <span className="text-[11px] text-white/60 block truncate">
                    {unviewedRejections[0].rejectionReason || "Detayları görmek için işlemleri inceleyin."}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#f6465d] shrink-0 ml-2">
                İncele →
              </span>
            </motion.div>
          )}

          {/* ═════════════════ TAB: DEPOSIT ═════════════════ */}
          {tab === "deposit" && (
            <AnimatePresence mode="wait">
              {/* STEP 1: Select Method */}
              {dStep === "method" && (
                <motion.div
                  key="dep-method"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-black uppercase tracking-wider text-white/40">
                      {t.selectDepositMethod}
                    </p>
                    <span className="text-[11px] text-white/30">{t.zeroFee}</span>
                  </div>

                  {depositMethods.length === 0 ? (
                    <div className="rounded-2xl p-6 border border-white/10 bg-black/40 text-center flex flex-col items-center gap-3 my-2">
                      <AlertCircle size={28} className="text-[#FFB800]" />
                      <div>
                        <p className="text-sm font-bold text-white">Aktif Yatırma Yöntemi Bulunmuyor</p>
                        <p className="text-xs text-white/40 mt-1">
                          Ödeme yöntemleri şu anda sistem yöneticisi tarafından geçici olarak kapatılmıştır. Lütfen daha sonra tekrar deneyiniz.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {depositMethods.map((m) => {
                        const Icon = m.icon;
                        return (
                          <motion.button
                            key={m.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectDepositMethod(m)}
                            className="flex items-center gap-4 rounded-2xl p-4 border text-left transition-all hover:border-white/20 cursor-pointer"
                            style={{
                              background: "linear-gradient(135deg, rgba(20,20,24,0.7) 0%, rgba(12,12,16,0.9) 100%)",
                              borderColor: `${m.color}25`,
                            }}
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                              <Icon size={34} style={{ color: m.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{m.label}</span>
                                {m.badge && (
                                  <span
                                    className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `${m.color}20`,
                                      color: m.color,
                                      border: `1px solid ${m.color}40`,
                                    }}
                                  >
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/45 mt-0.5">{m.sub}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-bold text-white/35">
                                Min {isTL || m.currency === "TL" ? `₺${m.min}` : `$${m.min}`}
                              </span>
                              <ChevronRight size={16} className="text-white/25" />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Security Badge */}
                  <div className="flex items-center gap-2 rounded-2xl p-3.5 border border-white/5 bg-white/[0.02] mt-2">
                    <ShieldCheck size={16} className="text-[#0ecb81] shrink-0" />
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Tüm para transferleri 256-bit SSL ve blokzincir doğrulamasıyla güvenli bir şekilde işlenir.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Enter Amount */}
              {dStep === "amount" && method && (
                <motion.div
                  key="dep-amount"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <button
                    onClick={() => setDStep("method")}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white w-fit cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Farklı yöntem seç
                  </button>

                  <div className="rounded-2xl p-4 border border-white/10 bg-black/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        <method.icon size={28} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{method.label}</p>
                        <p className="text-[11px] text-white/40">
                          Minimum Tutar: {isTL ? `₺${method.min}` : `$${method.min}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                      Yatırılacak Tutar ({isTL ? "TL" : method.currency})
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 focus-within:border-[#0ecb81]/50 transition-colors">
                      <span className="text-2xl font-black text-white/30">
                        {isTL ? "₺" : "$"}
                      </span>
                      <input
                        ref={inputRef}
                        type="number"
                        inputMode="decimal"
                        placeholder={`${method.min}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-black text-white outline-none placeholder:text-white/15"
                      />
                      <span className="text-xs font-black text-white/40">{isTL ? "TL" : method.currency}</span>
                    </div>

                    {/* Quick amount presets */}
                    <div className="grid grid-cols-4 gap-2 mt-2.5">
                      {(() => {
                        const mCur = method.currency;
                        const isCurTL = isTL || mCur === "TL" || mCur === "TRY";
                        const baseMin = method.min || (isCurTL ? 100 : 10);
                        const presets = [baseMin, Math.round(baseMin * 2), Math.round(baseMin * 5), Math.round(baseMin * 10)];
                        return presets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset.toString())}
                            className="py-2 rounded-xl text-xs font-bold border border-white/5 bg-white/[0.03] hover:bg-white/10 text-white/70 transition-all cursor-pointer"
                          >
                            {isCurTL ? `₺${preset}` : `$${preset}`}
                          </button>
                        ));
                      })()}
                    </div>

                    {/* USD Havale TL conversion indicator */}
                    {!isTL && method.id === "iban" && (
                      <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Banka Transfer Karşılığı:</span>
                          <span className="font-black text-[#0ecb81] text-sm">
                            ₺{(parseFloat(amount || "0") * USD_TRY_RATE).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/35 mt-1.5 leading-relaxed">
                          * Dolar hesabınız için TR IBAN hesabına güncel kurdan (1 USD = 38.00 TL) TL transferi yapılacaktır.
                        </p>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDepositDetails}
                    disabled={!amount || parseFloat(amount) < method.min}
                    className="w-full rounded-2xl py-4 text-sm font-black text-black disabled:opacity-30 transition-opacity cursor-pointer shadow-lg"
                    style={{
                      background: `linear-gradient(135deg,${method.color},${method.color}dd)`,
                      boxShadow: `0 8px 24px ${method.color}35`,
                    }}
                  >
                    Devam Et →
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 3: Details - IBAN / Havale */}
              {dStep === "details" && method && method.id === "iban" && (
                <motion.div
                  key="dep-details-iban"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3.5"
                >
                  <button
                    onClick={() => setDStep("amount")}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white w-fit cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Tutarı Değiştir
                  </button>

                  <div className="rounded-2xl p-4 border border-[#0ecb81]/25"
                    style={{ background: "rgba(14,203,129,0.05)" }}>
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
                      <div>
                        <span className="text-xs font-bold text-white/50 block">Transfer Edilecek Tutar (TL)</span>
                        {!isTL && (
                          <span className="text-[10px] text-white/35">Dolar Hesabı İçin Kur: 1 USD = 38.00 TL</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#0ecb81] block">
                          ₺{isTL
                            ? parseFloat(amount || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : (parseFloat(amount || "0") * USD_TRY_RATE).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </span>
                        {!isTL && (
                          <span className="text-[10px] font-bold text-white/40">Hesabınıza +${amount} USD yatacaktır</span>
                        )}
                      </div>
                    </div>

                    {[
                      { label: "Banka", value: paymentSettings.ibanBank || "Garanti BBVA", copy: false },
                      { label: "Hesap Sahibi", value: paymentSettings.ibanHolder || "Obyo Financial Technologies Ltd.", copy: true },
                      { label: "IBAN", value: paymentSettings.ibanNumber || "TR88 0006 2000 8765 4321 0099 73", copy: true },
                      {
                        label: "Yatırılacak Tutar (TL)",
                        value: isTL
                          ? `₺${parseFloat(amount || "0").toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `₺${(parseFloat(amount || "0") * USD_TRY_RATE).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        copy: true,
                        accent: "#0ecb81"
                      },
                      ...(!isTL ? [{ label: "Hesaba Geçecek Tutar", value: `$${amount} USD`, copy: false }] : []),
                      { label: "Açıklama (Zorunlu)", value: transferCode, copy: true, accent: "#FFB800" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/40 shrink-0">{row.label}</span>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs font-mono font-bold text-right break-all" style={{ color: row.accent ?? "#ffffff" }}>
                            {row.value}
                          </span>
                          {row.copy && <CopyBtn text={row.value} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-2xl p-3.5 border border-[#FFB800]/25"
                    style={{ background: "rgba(255,184,0,0.06)" }}>
                    <AlertCircle size={16} className="text-[#FFB800] mt-0.5 shrink-0" />
                    <p className="text-xs text-white/60 leading-relaxed">
                      Lütfen bankanızın transfer açıklama kısmına kesinlikle <span className="text-[#FFB800] font-bold">"{transferCode}"</span> kodunu yazınız. Bu açıklama olmadan yapılan transferler eşleştirilemez.
                    </p>
                  </div>

                  {/* ── Havale / EFT Dekont Yükleme (Zorunlu) ── */}
                  <div className="rounded-2xl p-4 border border-white/10 bg-black/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#0ecb81]" />
                        <span className="text-xs font-black text-white">Transfer Dekontu</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/40">
                          Zorunlu
                        </span>
                      </div>
                      {receiptFile && (
                        <span className="text-[10px] font-bold text-[#0ecb81] flex items-center gap-1">
                          <CheckCircle2 size={12} /> Yüklendi
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Transferinizi bankanızdan gerçekleştirdikten sonra oluşan dekontun ekran görüntüsünü veya fotoğrafını yükleyiniz. Transferiniz admin tarafından dekont kontrol edilerek onaylanacaktır.
                    </p>

                    {/* Gizli Dosya Seçici */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleReceiptChange(file);
                        e.target.value = "";
                      }}
                    />

                    {receiptFile ? (
                      /* Yüklenen Dekont Kartı */
                      <div className="rounded-xl p-3 border border-[#0ecb81]/30 bg-[#0ecb81]/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewReceiptModal({ url: receiptFile.dataUrl, name: receiptFile.name })}
                            className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/15 bg-black/50 shrink-0 cursor-pointer group"
                            title="Büyütmek için tıklayın"
                          >
                            <img
                              src={receiptFile.dataUrl}
                              alt="Dekont Önizleme"
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye size={14} className="text-white" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate max-w-[190px]">
                              {receiptFile.name}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1.5">
                              <span>{formatBytes(receiptFile.size)}</span>
                              <span>·</span>
                              <span className="text-[#0ecb81] font-bold">Dekont hazır</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptModal({ url: receiptFile.dataUrl, name: receiptFile.name })}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Büyük Önizleme"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptFile(null);
                              setReceiptError(null);
                            }}
                            className="p-2 rounded-lg bg-[#f6465d]/10 hover:bg-[#f6465d]/20 text-[#f6465d] transition-colors cursor-pointer"
                            title="Dekontu Kaldır / Değiştir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Sürükle / Seç Alanı */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingReceipt(true);
                        }}
                        onDragLeave={() => setIsDraggingReceipt(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingReceipt(false);
                          const file = e.dataTransfer.files?.[0] || null;
                          handleReceiptChange(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDraggingReceipt
                            ? "border-[#0ecb81] bg-[#0ecb81]/10"
                            : "border-white/15 hover:border-[#0ecb81]/50 hover:bg-white/[0.02]"
                        }`}
                      >
                        {isProcessingReceipt ? (
                          <div className="flex items-center gap-2 text-xs text-white/70 py-2">
                            <RefreshCw size={16} className="animate-spin text-[#0ecb81]" />
                            <span>Dekont işleniyor ve sıkıştırılıyor...</span>
                          </div>
                        ) : (
                          <>
                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                              <UploadCloud size={20} className="text-[#0ecb81]" />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-bold text-white block">
                                Dekont Görselini Seçin veya Sürükleyin
                              </span>
                              <span className="text-[10px] text-white/40 mt-0.5 block">
                                JPG, PNG veya WEBP (Ekran görüntüsü / mobil fotoğraf)
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {receiptError && (
                      <div className="p-2.5 rounded-xl bg-[#f6465d]/10 border border-[#f6465d]/30 flex items-center gap-2 text-xs text-[#f6465d]">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{receiptError}</span>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: receiptFile ? 0.98 : 1 }}
                    onClick={handleSentDeposit}
                    disabled={isSubmitting || !receiptFile}
                    className={`w-full rounded-2xl py-4 text-sm font-black transition-all ${
                      receiptFile
                        ? "text-black cursor-pointer shadow-lg"
                        : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                    }`}
                    style={
                      receiptFile
                        ? {
                            background: "linear-gradient(135deg,#0ecb81,#05a660)",
                            boxShadow: "0 8px 24px rgba(14,203,129,0.3)",
                          }
                        : {}
                    }
                  >
                    {isSubmitting
                      ? "İşleniyor ve Dekont İletiliyor..."
                      : receiptFile
                      ? "✓ Transferi ve Dekontu Gönder"
                      : "⚠️ Lütfen Dekont Yükleyiniz (Zorunlu)"}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 3: Details - Crypto (TRC20 / ERC20) */}
              {dStep === "details" && method && (method.id === "trc20" || method.id === "crypto") && (
                <motion.div
                  key="dep-details-crypto"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3.5"
                >
                  <button
                    onClick={() => setDStep("amount")}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white w-fit cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Tutarı Değiştir
                  </button>

                  {countdownAt && <Countdown startedAt={countdownAt} />}

                  {/* QR Code container */}
                  {(() => {
                    const cryptoAddress = method.id === "trc20"
                      ? (paymentSettings.trc20Address || "TKXVLatVmzivs3XAQ7WLcKLAGsyPtfxh6S")
                      : (paymentSettings.erc20Address || "0x742d35Cc6634C0532925a3b844D28f32be0A5b5f");
                    const qrImgSrc = method.id === "trc20" ? paymentSettings.trc20QrCode : paymentSettings.erc20QrCode;
                    const networkLabel = method.id === "trc20" ? "Tron (TRC-20)" : "Ethereum (ERC-20)";

                    return (
                      <>
                        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/8 bg-black/60 p-5">
                          <p className="text-xs font-bold text-white/50">{method.label} — {networkLabel}</p>
                          <QRVisual data={cryptoAddress} imgSrc={qrImgSrc} />
                          <span className="text-[10px] text-white/30 font-medium">QR kodunu cüzdanınızla taratın</span>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-black/60 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                              Yatırma Cüzdan Adresi
                            </span>
                            <CopyBtn text={cryptoAddress} />
                          </div>
                          <p className="text-xs font-mono text-white/90 break-all select-all leading-relaxed p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                            {cryptoAddress}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl p-2.5 border border-white/6 bg-black/40 text-center">
                            <p className="text-[9px] text-white/30 font-bold uppercase">Ağ</p>
                            <p className="text-xs font-black text-white mt-0.5">{networkLabel}</p>
                          </div>
                          <div className="rounded-2xl p-2.5 border border-white/6 bg-black/40 text-center">
                            <p className="text-[9px] text-white/30 font-bold uppercase">Tutar</p>
                            <p className="text-xs font-black text-[#0ecb81] mt-0.5">
                              {isTL ? `₺${amount}` : `$${amount} USDT`}
                            </p>
                          </div>
                          <div className="rounded-2xl p-2.5 border border-white/6 bg-black/40 text-center">
                            <p className="text-[9px] text-white/30 font-bold uppercase">Onay Süresi</p>
                            <p className="text-xs font-black text-white mt-0.5">~1-3 Dakika</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-2xl p-3.5 border border-[#f6465d]/20 bg-[#f6465d]/[0.05]">
                          <AlertCircle size={15} className="text-[#f6465d] mt-0.5 shrink-0" />
                          <p className="text-xs text-white/50 leading-relaxed">
                            Yalnızca <span className="text-white font-bold">{networkLabel}</span> ağı üzerinden <span className="text-white font-bold">USDT</span> transferi yapınız. Farklı ağlardan gönderilen fonlar kurtarılamaz.
                          </p>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSentDeposit}
                          disabled={isSubmitting}
                          className="w-full rounded-2xl py-4 text-sm font-black text-black cursor-pointer shadow-lg"
                          style={{
                            background: `linear-gradient(135deg,${method.color},${method.color}cc)`,
                            boxShadow: `0 8px 24px ${method.color}30`,
                          }}
                        >
                          {isSubmitting ? "İşleniyor..." : "✓ Gönderimi Tamamladım"}
                        </motion.button>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {/* STEP 3: Details - Custom Payment Method */}
              {dStep === "details" && method && method.customData && (
                <motion.div
                  key={`dep-details-custom-${method.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3.5"
                >
                  <button
                    onClick={() => setDStep("amount")}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white w-fit cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Tutarı Değiştir
                  </button>

                  {countdownAt && <Countdown startedAt={countdownAt} />}

                  {/* QR Code container if available */}
                  {method.customData.qrCode && (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/8 bg-black/60 p-5">
                      <p className="text-xs font-bold text-white/50">{method.label} — Karekod ile Ödeme</p>
                      <QRVisual data={method.customData.accountNumber || method.customData.name} imgSrc={method.customData.qrCode} />
                      <span className="text-[10px] text-white/30 font-medium">QR kodu taratarak transfer yapabilirsiniz</span>
                    </div>
                  )}

                  {/* Account Information Card */}
                  <div
                    className="rounded-2xl p-4 border"
                    style={{
                      backgroundColor: "rgba(18,18,22,0.9)",
                      borderColor: `${method.color}35`,
                    }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
                      <div>
                        <span className="text-xs font-bold text-white/50 block">Yatırma Bilgileri</span>
                        <span className="text-[10px] text-white/35">{method.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black block" style={{ color: method.color }}>
                          {isTL || method.currency === "TL" ? `₺${amount}` : `$${amount} ${method.currency}`}
                        </span>
                      </div>
                    </div>

                    {[
                      ...(method.customData.accountHolder ? [{ label: "Alıcı / Hesap Sahibi", value: method.customData.accountHolder, copy: true }] : []),
                      ...(method.customData.accountNumber ? [{ label: "Hesap / Cüzdan No", value: method.customData.accountNumber, copy: true, accent: "#ffffff" }] : []),
                      {
                        label: "Yatırılacak Tutar",
                        value: isTL || method.currency === "TL" ? `₺${amount}` : `${amount} ${method.currency}`,
                        copy: true,
                        accent: "#0ecb81"
                      },
                      ...(method.customData.transferCode ? [{ label: "Açıklama / Referans Kodu", value: method.customData.transferCode, copy: true, accent: "#FFB800" }] : []),
                      ...(method.customData.customRows || []).map(r => ({ label: r.label, value: r.value, copy: r.copy !== false })),
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-white/40 shrink-0">{row.label}</span>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs font-mono font-bold text-right break-all" style={{ color: row.accent ?? "#ffffff" }}>
                            {row.value}
                          </span>
                          {row.copy && <CopyBtn text={row.value} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Notes or Standard Notice */}
                  {method.customData.notes ? (
                    <div
                      className="flex items-start gap-2.5 rounded-2xl p-3.5 border"
                      style={{
                        backgroundColor: "rgba(255,184,0,0.06)",
                        borderColor: "rgba(255,184,0,0.25)"
                      }}
                    >
                      <AlertCircle size={16} className="text-[#FFB800] mt-0.5 shrink-0" />
                      <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">
                        {method.customData.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-2xl p-3.5 border border-white/8 bg-white/[0.03]">
                      <AlertCircle size={16} className="text-white/40 mt-0.5 shrink-0" />
                      <p className="text-xs text-white/50 leading-relaxed">
                        Lütfen yukarıda belirtilen hesap bilgilerine transferinizi gönderdikten sonra aşağıdaki butona tıklayarak transfer bildirimini tamamlayınız.
                      </p>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSentDeposit}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl py-4 text-sm font-black text-black cursor-pointer shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${method.color}, ${method.color}cc)`,
                      boxShadow: `0 8px 24px ${method.color}30`,
                    }}
                  >
                    {isSubmitting ? "İşleniyor..." : "✓ Gönderimi Tamamladım"}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 4: Success */}
              {dStep === "success" && (
                <motion.div
                  key="dep-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: "rgba(14,203,129,0.15)", border: "2px solid rgba(14,203,129,0.3)" }}
                  >
                    <CheckCircle2 size={40} className="text-[#0ecb81]" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-black text-white mb-1.5">Yatırım Talebi Gönderildi</h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                      Transfer bildiriminiz sisteme ulaştı. Kontroller tamamlandıktan sonra bakiye hesabınıza <span className="text-[#0ecb81] font-bold">anında yansıtılacaktır.</span>
                    </p>
                  </div>

                  <div className="flex gap-2 w-full mt-3">
                    <button
                      onClick={() => setTab("pending")}
                      className="flex-1 rounded-2xl py-3.5 text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                    >
                      İşlemi Görüntüle
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="flex-1 rounded-2xl py-3.5 text-xs font-black text-black cursor-pointer"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
                    >
                      İşlemlere Başla
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* ═════════════════ TAB: WITHDRAW ═════════════════ */}
          {tab === "withdraw" && (
            <AnimatePresence mode="wait">
              {currentUser && currentUser.kycStatus !== "verified" ? (
                <motion.div
                  key="kyc-blocked"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center p-6 rounded-3xl border border-white/10 bg-transparent my-2"
                >
                  <h3 className="text-base font-black text-white mb-2">{t.kycRequiredWithdraw}</h3>
                  <p className="text-xs text-white/60 leading-relaxed max-w-sm mb-6">
                    {t.kycRequiredDesc}
                  </p>
                  <button
                    onClick={() => navigate("/profile?kyc=open")}
                    className="w-full max-w-xs py-3.5 rounded-2xl font-black text-xs text-black cursor-pointer shadow-lg transition-transform active:scale-95"
                    style={{ background: "linear-gradient(135deg, #FF6B00, #FFB800)", boxShadow: "0 6px 20px rgba(255,107,0,0.25)" }}
                  >
                    {t.verifyNow}
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* STEP 1: Method selection */}
              {wStep === "method" && (
                <motion.div
                  key="wit-method"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-white/8 bg-black/60">
                    <span className="text-xs text-white/40">Çekilebilir Bakiye</span>
                    <span className="text-lg font-black text-[#0ecb81]">
                      {userSym}{realBal.toLocaleString(isTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {realBal <= 0 && (
                    <div className="flex items-start gap-2.5 rounded-2xl p-3.5 border border-[#FFB800]/25 bg-[#FFB800]/[0.06]">
                      <AlertCircle size={15} className="text-[#FFB800] mt-0.5 shrink-0" />
                      <p className="text-xs text-white/60 leading-relaxed">
                        Para çekebilmek için gerçek bakiyenizde kullanılabilir bakiye olması gerekmektedir. Önce para yatırarak başlayabilirsiniz.
                      </p>
                    </div>
                  )}

                  <p className="text-xs font-black uppercase tracking-wider text-white/40 px-1 mt-1">
                    Çekim Yöntemi Seçin
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {withdrawMethods.map((m) => {
                      const Icon = m.icon;
                      return (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => selectWithdrawMethod(m)}
                          disabled={realBal <= 0}
                          className="flex items-center gap-4 rounded-2xl p-4 border text-left disabled:opacity-30 cursor-pointer"
                          style={{
                            background: "linear-gradient(135deg, rgba(20,20,24,0.7) 0%, rgba(12,12,16,0.9) 100%)",
                            borderColor: `${m.color}25`,
                          }}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                            <Icon size={34} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-black text-white">{m.label}</span>
                            <p className="text-xs text-white/45 mt-0.5">{m.sub}</p>
                          </div>

                          <ChevronRight size={16} className="text-white/25 shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Amount & Destination */}
              {wStep === "amount" && method && (
                <motion.div
                  key="wit-amount"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <button
                    onClick={() => setWStep("method")}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white w-fit cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Farklı yöntem seç
                  </button>

                  {/* Selected method card */}
                  <div className="rounded-2xl p-3.5 border border-white/8 bg-black/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        <method.icon size={28} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{method.label}</p>
                        <p className="text-[11px] text-white/40">Minimum Çekim Tutarı: {userSym}{withdrawMin}</p>
                      </div>
                    </div>
                  </div>

                  {/* Amount input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Çekim Tutarı
                      </label>
                      <button
                        type="button"
                        onClick={() => setAmount(realBal.toString())}
                        className="text-[11px] font-bold text-[#FF6B00] hover:underline cursor-pointer"
                      >
                        Tümünü Çek ({userSym}{realBal.toLocaleString(isTL ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </button>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 focus-within:border-[#FF6B00]/50 transition-colors">
                      <span className="text-2xl font-black text-white/30">
                        {userSym}
                      </span>
                      <input
                        ref={inputRef}
                        type="number"
                        inputMode="decimal"
                        placeholder={`${withdrawMin}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-black text-white outline-none placeholder:text-white/15"
                      />
                      <span className="text-xs font-black text-white/40">{isTL ? "TL" : method.currency}</span>
                    </div>

                    {/* Quick amount presets */}
                    <div className="grid grid-cols-4 gap-2 mt-2.5">
                      {(isTL ? [150, 300, 500, 1000] : [5, 10, 25, 50]).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset.toString())}
                          className="py-2 rounded-xl text-xs font-bold border border-white/5 bg-white/[0.03] hover:bg-white/10 text-white/70 transition-all cursor-pointer"
                        >
                          {userSym}{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination input */}
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                      {method.id === "iban" ? "IBAN Numaranız (TR...)" : "Cüzdan Adresiniz"}
                    </label>
                    <input
                      placeholder={method.id === "iban" ? "TR00 0000 0000 0000 0000 0000 00" : "0x... veya T..."}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/50 font-mono transition-colors"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWithdraw}
                    disabled={
                      !amount ||
                      parseFloat(amount) < withdrawMin ||
                      parseFloat(amount) > realBal ||
                      !destination.trim() ||
                      isSubmitting
                    }
                    className="w-full rounded-2xl py-4 text-sm font-black text-black disabled:opacity-30 transition-opacity cursor-pointer shadow-lg"
                    style={{
                      background: `linear-gradient(135deg,${method.color},${method.color}cc)`,
                      boxShadow: `0 8px 24px ${method.color}30`,
                    }}
                  >
                    {isSubmitting ? "Talep Alınıyor..." : "Çekim Talebi Oluştur"}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 3: Success */}
              {wStep === "success" && (
                <motion.div
                  key="wit-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: "rgba(255,107,0,0.15)", border: "2px solid rgba(255,107,0,0.3)" }}
                  >
                    <ArrowUpCircle size={40} className="text-[#FF6B00]" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-black text-white mb-1.5">Çekim Talebi Alındı</h3>
                    <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                      Çekim işleminiz sıraya alındı. Güvenlik teyidi sonrası <span className="text-white font-bold">1 ile 3 saat</span> içerisinde hesabınıza aktarılacaktır.
                    </p>
                  </div>

                  <div className="flex gap-2 w-full mt-3">
                    <button
                      onClick={() => setTab("pending")}
                      className="flex-1 rounded-2xl py-3.5 text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                    >
                      İşlemi Görüntüle
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="flex-1 rounded-2xl py-3.5 text-xs font-black text-black cursor-pointer"
                      style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)" }}
                    >
                      İşlemlere Başla
                    </button>
                  </div>
                </motion.div>
              )}
                </>
              )}
            </AnimatePresence>
          )}

          {/* ═════════════════ TAB: PENDING / TRANSACTIONS ═════════════════ */}
          {tab === "pending" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-wider text-white/40">
                  Transfer Talepleriniz
                </p>
                <span className="text-[11px] text-white/30">{userRequests.length} İşlem</span>
              </div>

              {userRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-3xl bg-black/40">
                  <Hash size={32} className="text-white/15 mb-3" />
                  <p className="text-sm text-white/40 font-bold">Henüz işlem talebiniz bulunmuyor</p>
                  <p className="text-xs text-white/20 mt-1 max-w-xs">
                    Para yatırma veya çekme yaptığınızda durumlarını buradan canlı olarak takip edebilirsiniz.
                  </p>
                </div>
              ) : (
                userRequests.map((req) => {
                  const isD = req.type === "deposit";
                  const statusCfg = {
                    pending:  { color: "#FFB800", label: "İncelemede / Bekliyor" },
                    accepted: { color: "#0ecb81", label: "Tamamlandı" },
                    rejected: { color: "#f6465d", label: "Reddedildi" },
                  }[req.status];

                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl p-4 border border-white/6"
                      style={{ background: "linear-gradient(135deg, #101013 0%, #0a0a0c 100%)" }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                            style={{
                              background: isD ? "rgba(14,203,129,0.12)" : "rgba(255,107,0,0.12)",
                              border: `1px solid ${isD ? "rgba(14,203,129,0.25)" : "rgba(255,107,0,0.25)"}`
                            }}>
                            {isD ? <ArrowDownCircle size={15} className="text-[#0ecb81]" /> : <ArrowUpCircle size={15} className="text-[#FF6B00]" />}
                          </div>
                          <div>
                            <span className="text-xs font-black text-white">{isD ? "Para Yatırma" : "Para Çekme"}</span>
                            <p className="text-[10px] text-white/30">{req.method}</p>
                          </div>
                        </div>

                        <span className="text-sm font-black" style={{ color: isD ? "#0ecb81" : "#FF6B00" }}>
                          {isD ? "+" : "-"}{req.currency === "TL" || req.currency === "TRY" ? "₺" : "$"}{req.amount} {req.currency}
                        </span>
                      </div>

                      {req.destination && (
                        <div className="mb-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="text-[9px] font-bold text-white/30 uppercase block">Hedef Adres</span>
                          <span className="text-[11px] font-mono text-white/70 break-all">{req.destination}</span>
                        </div>
                      )}

                      {/* Yüklenen Dekont Önizleme Butonu */}
                      {req.receiptUrl && (
                        <div className="mb-2.5 p-2.5 rounded-xl bg-[#0ecb81]/[0.05] border border-[#0ecb81]/25 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={15} className="text-[#0ecb81] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-white/35 uppercase block">Havale / EFT Dekontu</span>
                              <span className="text-xs text-white/80 font-medium truncate block max-w-[170px]">
                                {req.receiptName || "Dekont Belgesi"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptModal({ url: req.receiptUrl!, name: req.receiptName || "Havale Dekontu" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ecb81]/15 hover:bg-[#0ecb81]/25 text-[#0ecb81] text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            <Eye size={13} />
                            <span>Dekontu İncele</span>
                          </button>
                        </div>
                      )}

                      {/* Reddedilme Sebebi ve Açıklama Kutusu */}
                      {req.status === "rejected" && req.rejectionReason && (
                        <div className="mb-2.5 p-3 rounded-xl bg-[#f6465d]/10 border border-[#f6465d]/25 text-left">
                          <div className="flex items-center gap-1.5 text-[#f6465d] font-black text-xs mb-1">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>İşlem Reddedildi - Açıklama:</span>
                          </div>
                          <p className="text-xs text-white/90 leading-relaxed pl-5 font-medium">
                            {req.rejectionReason}
                          </p>

                          {/* Eğer çekim talebiyse ve yatırım yapması istenmişse hızlı yönlendirme */}
                          {req.type === "withdraw" && (
                            <div className="mt-2.5 pt-2 border-t border-[#f6465d]/15 flex justify-end">
                              <button
                                onClick={() => {
                                  setTab("deposit");
                                  setDStep("method");
                                  setMethod(null);
                                  setAmount("");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition-all cursor-pointer"
                              >
                                <ArrowDownLeft size={12} className="text-[#0ecb81]" />
                                <span>Para Yatırma Ekranına Git</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] font-mono text-white/25">{req.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30">
                            {new Date(req.createdAt).toLocaleDateString("tr-TR", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span className="rounded-full px-2.5 py-0.5 text-[9px] font-black"
                            style={{ background: `${statusCfg.color}15`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Dekont Önizleme Modal (Kullanıcı) ── */}
      <AnimatePresence>
        {previewReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewReceiptModal(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative max-w-lg w-full rounded-3xl bg-[#111114] border border-white/15 overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#0ecb81]/15 border border-[#0ecb81]/30 flex items-center justify-center">
                    <FileText size={16} className="text-[#0ecb81]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white truncate max-w-[240px]">
                      {previewReceiptModal.name || "Havale Dekontu"}
                    </h4>
                    <p className="text-[10px] text-white/40">Yüklenen transfer dekontu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptModal(null)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-auto flex items-center justify-center bg-black/60 min-h-[260px]">
                <img
                  src={previewReceiptModal.url}
                  alt="Dekont Detay"
                  className="max-h-[65vh] max-w-full object-contain rounded-xl border border-white/10 shadow-2xl"
                />
              </div>

              <div className="p-3.5 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setPreviewReceiptModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <a
                  href={previewReceiptModal.url}
                  download={previewReceiptModal.name || "dekont.jpg"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-black text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ExternalLink size={13} />
                  <span>İndir / Yeni Sekmede Aç</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
