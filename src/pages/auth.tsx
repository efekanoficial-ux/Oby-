import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Tag } from "lucide-react";

type Mode = "login" | "register" | "complete-google";

interface AuthPageProps {
  initialMode?: "login" | "register";
  [key: string]: any;
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps = {}) {
  const [, navigate] = useLocation();
  const { login, loginWithGoogle, register, currentUser, isAdmin, ready } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>(() => {
    try {
      const searchMode = new URLSearchParams(window.location.search).get("mode");
      if (searchMode === "register") return "register";
      if (searchMode === "login") return "login";
    } catch {}
    return initialMode;
  });

  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "TL">("USD");
  const [showAppleToast, setShowAppleToast] = useState(false);
  const appleToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    referralCode: "",
  });

  useEffect(() => {
    if (!ready) return;
    if (isAdmin) {
      navigate("/admin");
    } else if (currentUser) {
      navigate("/");
    }
  }, [ready, currentUser, isAdmin, navigate]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErr("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (mode === "login") {
      const res = await login(form.email, form.password);
      if (!res.success) {
        setErr(res.error ?? t.loginFailed);
        setLoading(false);
        return;
      }
      const isAdm = form.email.trim().toLowerCase() === "admin@obyo.com";
      if (isAdm) {
        navigate("/admin");
      } else {
        navigate("/");
      }
      setLoading(false);
    } else {
      const parts = form.fullName.trim().split(/\s+/);
      const name = parts[0] || "";
      const surname = parts.slice(1).join(" ") || parts[0] || "";

      if (!name) {
        setErr(t.fullNameRequired || "Lütfen ad ve soyadınızı girin.");
        setLoading(false);
        return;
      }

      const res = await register({
        email: form.email,
        password: form.password,
        name,
        surname,
        birthDate: "2000-01-01",
        currency,
        referralCode: form.referralCode,
      }, mode === "complete-google");

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
      if (res.error === "registration_required" && res.googleUser) {
        setForm({
          email: res.googleUser.email || "",
          password: "",
          fullName: `${res.googleUser.name || ""} ${res.googleUser.surname || ""}`.trim(),
          referralCode: "",
        });
        setMode("complete-google");
        setLoading(false);
        return;
      }
      setErr(res.error || "Google ile giriş yapılırken bir hata oluştu.");
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/");
  };

  useEffect(() => {
    return () => {
      if (appleToastTimerRef.current) clearTimeout(appleToastTimerRef.current);
    };
  }, []);

  const handleAppleClick = () => {
    setShowAppleToast(true);
    if (appleToastTimerRef.current) {
      clearTimeout(appleToastTimerRef.current);
    }
    appleToastTimerRef.current = setTimeout(() => {
      setShowAppleToast(false);
    }, 3200);
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full h-full bg-black text-white overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
    >
      {/* ── Top Apple Notification Toast (Apple ile giriş çok yakında) ── */}
      <div
        className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 pointer-events-auto ${
          showAppleToast
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-5 scale-95 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <div
          onClick={() => setShowAppleToast(false)}
          className="flex items-center gap-3 px-8 sm:px-12 py-2 rounded-full bg-black text-white border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.95)] cursor-pointer select-none backdrop-blur-xl hover:border-white/40 transition-all active:scale-95"
        >
          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.57.66-1.06 1.72-.93 2.74 1 .08 2.02-.5 2.64-1.25z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-white tracking-wide whitespace-nowrap">
            {t.appleComingSoon || "Apple: Çok yakında"}
          </span>
          <span className="text-white/40 hover:text-white text-xs pl-1">✕</span>
        </div>
      </div>

      {/* ── Top-Left Minimalist Line Back Arrow (Sadece Giriş Yap modunda görünür) ── */}
      {mode === "login" && (
        <button
          type="button"
          onClick={() => {
            try {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate("/");
              }
            } catch {
              navigate("/");
            }
          }}
          aria-label="Geri Dön"
          className="fixed top-5 left-5 sm:top-8 sm:left-9 z-30 p-2 text-white/50 hover:text-white transition-colors cursor-pointer group flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 stroke-current transition-transform group-hover:-translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      {/* ── Animated Background: Pure Black + Darting/Jumping Orange Bursts (Disappearing & Re-emerging) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[#000000]" />
        
        {/* Dynamic Jumping Orange Flare 1 (Left to Right darting) */}
        <div 
          className="absolute top-[8%] left-[10%] w-[380px] sm:w-[560px] h-[380px] sm:h-[560px] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 110, 0, 0.70) 0%, rgba(255, 140, 0, 0.25) 45%, transparent 75%)",
            animation: "orange-jump-left 6s ease-in-out infinite",
          }}
        />

        {/* Dynamic Jumping Orange Flare 2 (Right to Left darting, opposite phase) */}
        <div 
          className="absolute top-[20%] right-[5%] w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] rounded-full blur-[85px] sm:blur-[125px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 85, 0, 0.65) 0%, rgba(255, 130, 0, 0.22) 50%, transparent 75%)",
            animation: "orange-jump-right 7s ease-in-out infinite",
          }}
        />

        {/* Center Sudden Burst Flare */}
        <div 
          className="absolute top-[40%] left-[30%] w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full blur-[75px] sm:blur-[115px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 125, 0, 0.60) 0%, rgba(255, 60, 0, 0.20) 50%, transparent 75%)",
            animation: "orange-jump-center 5s ease-in-out infinite",
          }}
        />

        {/* Bottom Jumping Orange Flare */}
        <div 
          className="absolute -bottom-[8%] left-[20%] w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] rounded-full blur-[90px] sm:blur-[130px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 95, 0, 0.65) 0%, rgba(230, 81, 0, 0.20) 55%, transparent 80%)",
            animation: "orange-jump-bottom 6.5s ease-in-out infinite",
          }}
        />

        {/* Frosted Glass Layer ("cam efektli") */}
        <div className="absolute inset-0 backdrop-blur-[45px] bg-black/55 pointer-events-none" />
      </div>

      {/* ── Vertically Centered & PC-Optimized Content Container ── */}
      <div className="relative z-10 w-full min-h-full flex flex-col justify-center items-center px-5 py-10 sm:py-16">
        
        <div className="w-full max-w-[420px] sm:max-w-[440px] my-auto flex flex-col gap-6">
          
          {/* ── Redesigned Line-Based Mode Switcher ("çizgi şeklinde" modern tabs) ── */}
          {mode !== "complete-google" && (
            <div className="flex items-center gap-7 border-b border-white/10 pb-0.5 mb-1">
              <button
                type="button"
                onClick={() => { setMode("login"); setErr(""); }}
                className={`pb-3 text-base sm:text-lg transition-all cursor-pointer relative ${
                  mode === "login" ? "text-white font-black" : "text-white/35 hover:text-white/60 font-medium"
                }`}
              >
                {t.signIn || "Giriş Yap"}
                {mode === "login" && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setErr(""); }}
                className={`pb-3 text-base sm:text-lg transition-all cursor-pointer relative ${
                  mode === "register" ? "text-white font-black" : "text-white/35 hover:text-white/60 font-medium"
                }`}
              >
                {t.signUp || "Kayıt Ol"}
                {mode === "register" && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            </div>
          )}

          {mode === "complete-google" && (
            <div className="text-center pb-1">
              <span className="text-xs font-bold text-white/80">Google Kaydını Tamamla</span>
            </div>
          )}

          {/* Form with White-Focus Underline Inputs */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Full Name (Sign Up only) — Underline turns White on focus */}
            {(mode === "register" || mode === "complete-google") && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {t.firstName && t.lastName ? `${t.firstName} & ${t.lastName}` : "Ad Soyad"}
                </label>
                <div className="relative flex items-center border-b border-white/20 focus-within:border-b-white transition-colors py-1 group">
                  <User size={16} className="text-white/30 group-focus-within:text-white transition-colors mr-2.5 shrink-0" />
                  <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    placeholder={t.firstName ? `${t.firstName} ${t.lastName}` : "Adınız ve Soyadınız"}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 py-1.5 focus:ring-0"
                  />
                </div>
              </div>
            )}

            {/* Email — Underline turns White on focus */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {t.email || "E-posta"}
              </label>
              <div className="relative flex items-center border-b border-white/20 focus-within:border-b-white transition-colors py-1 group">
                <Mail size={16} className="text-white/30 group-focus-within:text-white transition-colors mr-2.5 shrink-0" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="ornek@mail.com"
                  autoComplete="email"
                  disabled={mode === "complete-google"}
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 py-1.5 focus:ring-0 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password — Underline turns White on focus */}
            {mode !== "complete-google" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {t.password || "Şifre"}
                </label>
                <div className="relative flex items-center border-b border-white/20 focus-within:border-b-white transition-colors py-1 group">
                  <Lock size={16} className="text-white/30 group-focus-within:text-white transition-colors mr-2.5 shrink-0" />
                  <input
                    required
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder={mode === "login" ? "••••••••" : (t.min6Chars || "En az 6 karakter")}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 py-1.5 focus:ring-0 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Currency Choice (Sign Up only) — Borderless Style */}
            {(mode === "register" || mode === "complete-google") && (
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {t.accountCurrency || "Hesap Para Birimi"}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`flex-1 py-2.5 rounded-xl text-xs transition-all cursor-pointer border-0 ${
                      currency === "USD"
                        ? "bg-[#111218] text-white font-black shadow-md"
                        : "bg-white/[0.04] text-white/40 hover:text-white/70"
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("TL")}
                    className={`flex-1 py-2.5 rounded-xl text-xs transition-all cursor-pointer border-0 ${
                      currency === "TL"
                        ? "bg-[#111218] text-white font-black shadow-md"
                        : "bg-white/[0.04] text-white/40 hover:text-white/70"
                    }`}
                  >
                    TRY (₺)
                  </button>
                </div>
              </div>
            )}

            {/* Referral Code (Sign Up only) — Underline turns White on focus */}
            {(mode === "register" || mode === "complete-google") && (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {t.referralCode || "Referans Kodu"}
                  </label>
                  <span className="text-[10px] text-white/30 font-medium">{t.optional || "İsteğe Bağlı"}</span>
                </div>
                <div className="relative flex items-center border-b border-white/20 focus-within:border-b-white transition-colors py-1 group">
                  <Tag size={16} className="text-white/30 group-focus-within:text-white transition-colors mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={form.referralCode}
                    onChange={handleChange("referralCode")}
                    placeholder={t.referralCodePlaceholder || "Varsa referans kodunuz"}
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25 py-1.5 focus:ring-0"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {err && (
              <div className="rounded-xl px-3.5 py-2.5 bg-red-500/10 border-0 text-xs text-red-400 font-medium">
                {err}
              </div>
            )}

            {/* Submit Button — Borderless Pure Black Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full py-3.5 rounded-xl bg-[#09090b] hover:bg-[#141418] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(0,0,0,0.95)] border-0 outline-none transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "login"
                      ? (t.signIn || "Giriş Yap")
                      : mode === "complete-google"
                      ? "Kaydı Tamamla"
                      : (t.createAccount || "Hesap Oluştur")}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider & Social Sign-In Buttons */}
          {mode !== "complete-google" && (
            <>
              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">veya</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Social Buttons Container */}
              <div className="flex flex-col gap-2.5">
                {/* Google Button — Borderless Black Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#09090b]/90 hover:bg-[#141418] text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-md border-0 outline-none transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t.signInWithGoogle || "Google ile Devam Et"}</span>
                </button>

                {/* Apple Button — Borderless Black Button */}
                <button
                  type="button"
                  onClick={handleAppleClick}
                  className="w-full py-3 rounded-xl bg-[#09090b]/90 hover:bg-[#141418] text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-md border-0 outline-none transition-all cursor-pointer backdrop-blur-md active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.57.66-1.06 1.72-.93 2.74 1 .08 2.02-.5 2.64-1.25z" />
                  </svg>
                  <span>{t.signInWithApple || "Apple ile Devam Et"}</span>
                </button>
              </div>
            </>
          )}

          {/* Bottom Switcher */}
          {mode === "complete-google" ? (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                {t.cancelOrBack || "← Vazgeç ve Giriş Yap"}
              </button>
            </div>
          ) : (
            <div className="text-center pt-2 pb-6">
              <span className="text-xs text-white/40">
                {mode === "login" ? (t.noAccount || "Hesabınız yok mu?") : (t.alreadyMember || "Zaten hesabınız var mı?")}
              </span>{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
                className="text-xs font-bold text-white hover:underline cursor-pointer"
              >
                {mode === "login" ? (t.signUp || "Kayıt Ol") : (t.signIn || "Giriş Yap")}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
