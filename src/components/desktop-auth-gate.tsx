import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DesktopAuthGateProps {
  onEnterDemo: () => void;
}

export function DesktopAuthGate({ onEnterDemo }: DesktopAuthGateProps) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [currency, setCurrency] = useState<"USD" | "TL">("USD");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    birthDate: "",
    referralCode: "",
  });

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErr("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      if (mode === "login") {
        if (!form.email || !form.password) {
          setErr("Lütfen e-posta ve şifrenizi girin.");
          setLoading(false);
          return;
        }
        const res = await login(form.email, form.password);
        if (!res.success) {
          setErr(res.error || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
          setLoading(false);
          return;
        }
      } else {
        if (!form.email || !form.password || !form.name || !form.surname) {
          setErr("Lütfen tüm zorunlu alanları doldurun.");
          setLoading(false);
          return;
        }
        const res = await register({ ...form, currency });
        if (!res.success) {
          setErr(res.error || "Kayıt işlemi başarısız oldu.");
          setLoading(false);
          return;
        }
      }
    } catch (e: any) {
      setErr(e?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030407] text-white flex flex-col justify-between items-center px-4 py-8 relative selection:bg-white/20 selection:text-white font-sans overflow-y-auto">
      {/* ── Background: Pure Minimalist Matte Black Grid ─────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,255,255,0.03),transparent)]" />

      {/* ── Top Bar / Logo ──────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/[0.06] border border-white/[0.1] p-1.5 flex items-center justify-center">
            <img src="/logo.png" alt="Obyo Option" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-white">OBYO</span>
            <span className="text-base font-light tracking-tight text-white/70">OPTION</span>
          </div>
        </div>

        <button
          onClick={onEnterDemo}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
        >
          <span>Demo Olarak Gir</span>
          <ArrowRight size={13} className="text-white/40" />
        </button>
      </header>

      {/* ── Center Card ─────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-md my-auto py-4">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-3xl bg-[#0B0D13] border border-white/[0.09] p-7 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden"
        >
          {/* Subtle Top Border Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* Segmented Switcher */}
          <div className="flex p-1 rounded-2xl bg-[#040508] border border-white/[0.07] mb-6 relative">
            <button
              type="button"
              onClick={() => { setMode("register"); setErr(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative z-10 ${
                mode === "register" ? "text-black" : "text-white/40 hover:text-white/80"
              }`}
            >
              {mode === "register" && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-20">Kayıt Ol</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode("login"); setErr(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative z-10 ${
                mode === "login" ? "text-black" : "text-white/40 hover:text-white/80"
              }`}
            >
              {mode === "login" && (
                <motion.div
                  layoutId="activeAuthTab"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-20">Giriş Yap</span>
            </button>
          </div>

          {/* Title and description */}
          <div className="mb-5 text-left">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {mode === "register" ? "Hesap Oluşturun" : "Tekrar Hoş Geldiniz"}
            </h1>
            <p className="text-xs text-white/45 mt-1 font-normal">
              {mode === "register"
                ? "10.000$ sanal bakiye ve gerçek işlem portföyü anında hazır."
                : "Kayıtlı hesabınıza giriş yaparak işlemlerinize devam edin."}
            </p>
          </div>

          {/* Error Banner */}
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 text-left"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{err}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <AnimatePresence mode="popLayout">
              {mode === "register" && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3.5 overflow-hidden"
                >
                  {/* Name & Surname */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1">Ad</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Adınız"
                          value={form.name}
                          onChange={setField("name")}
                          className="w-full rounded-xl bg-[#05060A] border border-white/[0.08] focus:border-white/30 px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1">Soyad</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Soyadınız"
                          value={form.surname}
                          onChange={setField("surname")}
                          className="w-full rounded-xl bg-[#05060A] border border-white/[0.08] focus:border-white/30 px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 mb-1">
                      Hesap Para Birimi
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          currency === "USD"
                            ? "bg-white/[0.1] border-white/30 text-white"
                            : "bg-[#05060A] border-white/[0.07] text-white/40 hover:text-white/70"
                        }`}
                      >
                        <span className="font-bold text-emerald-400">$</span>
                        <span>USD (Dolar)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("TL")}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          currency === "TL"
                            ? "bg-white/[0.1] border-white/30 text-white"
                            : "bg-[#05060A] border-white/[0.07] text-white/40 hover:text-white/70"
                        }`}
                      >
                        <span className="font-bold text-emerald-400">₺</span>
                        <span>TL (Türk Lirası)</span>
                      </button>
                    </div>
                  </div>

                  {/* Referral Code (optional) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 mb-1">
                      Referans Kodu (opsiyonel)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Referans Kodu (opsiyonel)"
                        value={form.referralCode}
                        onChange={setField("referralCode")}
                        className="w-full rounded-xl bg-[#05060A] border border-white/[0.08] focus:border-white/30 px-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">E-Posta Adresi</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="ornek@mail.com"
                  value={form.email}
                  onChange={setField("email")}
                  className="w-full rounded-xl bg-[#05060A] border border-white/[0.08] focus:border-white/30 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/20 outline-none transition-colors"
                />
                <Mail size={14} className="absolute left-3 top-3 text-white/30" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">Şifre</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={setField("password")}
                  className="w-full rounded-xl bg-[#05060A] border border-white/[0.08] focus:border-white/30 pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-white/20 outline-none transition-colors"
                />
                <Lock size={14} className="absolute left-3 top-3 text-white/30" />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs text-black bg-white hover:bg-slate-200 transition-all cursor-pointer shadow-md shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "register" ? "Hesap Oluştur" : "Oturum Aç"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Direct Demo Entry Link */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
            <button
              type="button"
              onClick={onEnterDemo}
              className="text-xs text-white/45 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Kayıt olmadan platformu deneyin:</span>
              <span className="text-white font-semibold underline underline-offset-4 decoration-white/30">
                10.000$ Demo →
              </span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30 pt-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            256-Bit SSL Güvenli Altyapı
          </span>
          <span>·</span>
          <span>Sıfır Komisyon</span>
          <span>·</span>
          <span>Anlık Fiyat Akışı</span>
        </div>
        <div>© Obyo Option. Tüm hakları saklıdır.</div>
      </footer>
    </div>
  );
}
