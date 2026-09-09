import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Calendar, ChevronRight, CheckCircle2, RotateCw, ArrowLeft, ShieldCheck } from "lucide-react";
import { t } from "@/i18n";

type Mode = "login" | "register";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, currentUser, isAdmin, ready } = useAuth();
  const [mode, setMode]     = useState<Mode>("login");

  useEffect(() => {
    if (!ready) return;
    if (isAdmin)          navigate("/admin");
    else if (currentUser) navigate("/");
  }, [ready, currentUser, isAdmin, navigate]);

  const [err, setErr]       = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currency, setCurrency] = useState<"USD" | "TL">("USD");
  const [form, setForm] = useState({
    email: "", password: "", name: "", surname: "", birthDate: "",
  });

  /* ── Email Verification State ─────────────────────────────────────────── */
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeSuccessMsg, setCodeSuccessMsg] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErr("");
  };

  const generateAndSendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setCodeSuccessMsg(`Güvenlik doğrulama kodunuz (${code}) e-posta adresinize iletildi.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (mode === "login") {
      const res = await login(form.email, form.password);
      if (!res.success) { setErr(res.error ?? t.loginFailed); setLoading(false); return; }
      const isAdm = form.email.trim().toLowerCase() === "admin@obyo.com";
      navigate(isAdm ? "/admin" : "/");
      setLoading(false);
    } else {
      // If registering, trigger email verification first
      generateAndSendCode();
      setVerifyingEmail(true);
      setLoading(false);
    }
  };

  const handleVerifyEmailAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (enteredCode.trim() !== verificationCode) {
      setErr(t.invalidCode || "Geçersiz doğrulama kodu. Lütfen kontrol edin.");
      return;
    }

    setLoading(true);
    const res = await register({ ...form, currency, emailVerified: true });
    if (!res.success) {
      setErr(res.error ?? t.registerFailed);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr("");
    setVerifyingEmail(false);
  };

  const inputClass = "w-full rounded-xl bg-[#111] border border-[#1e1e1e] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/50 transition-colors";

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <img
          src="/logo.png"
          alt="Obyo Option"
          className="h-14 w-14 object-contain mb-2 drop-shadow-[0_4px_16px_rgba(255,107,0,0.3)]"
        />
        <p className="text-xl font-black text-white">Obyo <span className="text-[#FF6B00]">Option</span></p>
        <p className="text-xs text-white/50 font-medium mt-0.5">Profesyonel Opsiyon Trading</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
      >
        {!verifyingEmail ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-[#111]">
              {(["login", "register"] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 py-3.5 text-sm font-black transition-colors relative"
                  style={{ color: mode === m ? "#FF6B00" : "#444" }}>
                  {m === "login" ? t.signIn : t.signUp}
                  {mode === m && (
                    <motion.div layoutId="auth-tab" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ background: "#FF6B00" }} />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3">
              <AnimatePresence mode="wait">
                {mode === "register" && (
                  <motion.div key="reg-fields"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-3 overflow-hidden">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input required className={inputClass} style={{ paddingLeft: 36 }}
                          placeholder={t.firstName} value={form.name} onChange={set("name")} />
                      </div>
                      <div className="flex-1">
                        <input required className={inputClass}
                          placeholder={t.lastName} value={form.surname} onChange={set("surname")} />
                      </div>
                    </div>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input required type="date" className={inputClass} style={{ paddingLeft: 36 }}
                        value={form.birthDate} onChange={set("birthDate")} max={new Date(Date.now() - 18*365*864e5).toISOString().slice(0,10)} />
                    </div>
                    {/* Currency selector - Clean & Transparent when selected */}
                    <div>
                      <p className="text-[11px] text-white/30 mb-2 font-semibold">{t.accountCurrency}</p>
                      <div className="flex gap-2">
                        {(["USD", "TL"] as const).map(c => (
                          <button key={c} type="button" onClick={() => setCurrency(c)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: currency === c ? "rgba(255, 255, 255, 0.08)" : "transparent",
                              border: `1px solid ${currency === c ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.08)"}`,
                              color: currency === c ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
                              boxShadow: currency === c ? "0 2px 8px rgba(255, 255, 255, 0.04)" : "none",
                            }}>
                            {c === "USD" ? t.dollar : t.turkishLira}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input required type="email" className={inputClass} style={{ paddingLeft: 36 }}
                  placeholder={t.email} value={form.email} onChange={set("email")} autoComplete="email" />
              </div>

              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input required type={showPw ? "text" : "password"} className={inputClass} style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder={t.password} value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {err && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-3 py-2.5 text-xs font-semibold text-[#f6465d]"
                  style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.18)" }}>
                  {err}
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-black text-black transition-opacity disabled:opacity-60 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 6px 20px rgba(255,107,0,0.25)" }}
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? t.signIn : t.createAccount}
                    <ChevronRight size={15} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="px-6 pb-6 text-center">
              <p className="text-xs text-white/20">
                {mode === "login" ? t.noAccount : t.alreadyMember}
                <button onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="font-bold text-[#FF6B00] hover:text-[#FFB800] transition-colors ml-1 cursor-pointer">
                  {mode === "login" ? t.signUp : t.signIn}
                </button>
              </p>
            </div>
          </>
        ) : (
          /* Email Verification Step */
          <motion.form
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            onSubmit={handleVerifyEmailAndRegister}
            className="p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <button
                type="button"
                onClick={() => setVerifyingEmail(false)}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Geri
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00]">
                <ShieldCheck size={14} /> {t.emailVerification}
              </div>
            </div>

            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                <Mail size={22} />
              </div>
              <h3 className="text-base font-black text-white mb-1">{t.emailVerification}</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {t.emailCodeSent} <br />
                <span className="font-bold text-white/80">{form.email}</span>
              </p>
            </div>

            {/* Verification code hint box */}
            <div className="rounded-xl p-3 bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-center">
              <p className="text-[11px] font-semibold text-[#FFB800]">
                📩 Test / E-posta Güvenlik Kodunuz: <span className="font-black text-white tracking-widest text-sm bg-black/40 px-2 py-0.5 rounded ml-1">{verificationCode}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider text-center">
                {t.enterCode}
              </label>
              <input
                required
                maxLength={6}
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.replace(/\D/g, ""));
                  setErr("");
                }}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono font-black tracking-[0.5em] rounded-xl bg-[#111] border border-[#1e1e1e] py-3 text-[#FF6B00] placeholder:text-white/10 outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>

            {err && (
              <div className="rounded-xl px-3 py-2 text-xs font-semibold text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20 text-center">
                {err}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || enteredCode.length < 6}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-black text-black transition-all disabled:opacity-40 cursor-pointer"
              style={{ background: "linear-gradient(135deg,#FF6B00,#FFB800)", boxShadow: "0 6px 20px rgba(255,107,0,0.25)" }}
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {t.verifyAndComplete}
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                generateAndSendCode();
                setEnteredCode("");
                setErr("");
              }}
              className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors py-1 cursor-pointer"
            >
              <RotateCw size={12} /> {t.resendCode}
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
