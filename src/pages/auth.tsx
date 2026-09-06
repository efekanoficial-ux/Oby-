import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Calendar, ChevronRight } from "lucide-react";
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
      const isAdm = form.email.trim().toLowerCase() === "admin@gmail.com";
      navigate(isAdm ? "/admin" : "/");
    } else {
      const res = await register({ ...form, currency });
      if (!res.success) { setErr(res.error ?? t.registerFailed); setLoading(false); return; }
      navigate("/");
    }
    setLoading(false);
  };

  const switchMode = (m: Mode) => { setMode(m); setErr(""); };

  const inputClass = "w-full rounded-xl bg-[#111] border border-[#1e1e1e] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FF6B00]/50 transition-colors";

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 overflow-hidden mb-3">
          <img src="/logo.jpg" alt="Obyo" className="h-full w-full object-cover" />
        </div>
        <p className="text-xl font-black text-white">Obyo Option</p>
        <p className="text-xs text-[#FF6B00] font-bold mt-0.5">Profesyonel Opsiyon Trading</p>
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
                {/* Currency selector */}
                <div>
                  <p className="text-[11px] text-white/30 mb-2 font-semibold">{t.accountCurrency}</p>
                  <div className="flex gap-2">
                    {(["USD", "TL"] as const).map(c => (
                      <button key={c} type="button" onClick={() => setCurrency(c)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                        style={{
                          background: currency === c ? (c === "USD" ? "linear-gradient(135deg,#0084C7,#00b0ff)" : "linear-gradient(135deg,#c0392b,#e74c3c)") : "rgba(255,255,255,0.04)",
                          border: `1px solid ${currency === c ? "transparent" : "rgba(255,255,255,0.08)"}`,
                          color: currency === c ? "#fff" : "rgba(255,255,255,0.35)",
                          boxShadow: currency === c ? "0 4px 14px rgba(0,0,0,0.3)" : "none",
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
            className="mt-1 flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-black text-black transition-opacity disabled:opacity-60"
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
              className="font-bold text-[#FF6B00] hover:text-[#FFB800] transition-colors">
              {mode === "login" ? t.signUp : t.signIn}
            </button>
          </p>
        </div>
      </motion.div>

    </div>
  );
}
