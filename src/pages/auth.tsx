import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Calendar, ChevronRight } from "lucide-react";
import { t } from "@/i18n";

type Mode = "login" | "register";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, loginWithGoogle, register, currentUser, isAdmin, ready } = useAuth();
  const [mode, setMode]     = useState<Mode>("login");

  const [err, setErr]       = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currency, setCurrency] = useState<"USD" | "TL">("USD");
  const [form, setForm] = useState({
    email: "", password: "", name: "", surname: "", birthDate: "",
  });

  useEffect(() => {
    if (!ready) return;
    if (isAdmin) {
      navigate("/admin");
    } else if (currentUser) {
      navigate("/");
    }
  }, [ready, currentUser, isAdmin, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErr("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (mode === "login") {
      const res = await login(form.email, form.password);
      if (!res.success) { setErr(res.error ?? t.loginFailed); setLoading(false); return; }
      const isAdm = form.email.trim().toLowerCase() === "admin@obyo.com";
      if (isAdm) {
        navigate("/admin");
      } else {
        navigate("/");
      }
      setLoading(false);
    } else {
      const res = await register({ ...form, currency, emailVerified: true });
      if (!res.success) {
        setErr(res.error ?? t.registerFailed);
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErr("");

    const res = await loginWithGoogle();
    if (!res.success) {
      setErr(res.error || "Google ile giriş yapılırken bir hata oluştu.");
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr("");
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
        {/* Tabs */}
        <div className="flex border-b border-[#111]">
          {(["login", "register"] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className="flex-1 py-3.5 text-sm font-black transition-colors relative cursor-pointer"
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
                {/* Currency selector */}
                <div>
                  <p className="text-[11px] text-white/30 mb-2 font-semibold">{t.accountCurrency}</p>
                  <div className="flex gap-2">
                    {(["USD", "TL"] as const).map(c => (
                      <button key={c} type="button" onClick={() => setCurrency(c)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors cursor-pointer">
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">veya</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google Sign In Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full rounded-xl py-3 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.3s.7 2.6 1.9 5l3.7-2.5z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
            </svg>
            Google ile Giriş Yap
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
      </motion.div>
    </div>
  );
}
