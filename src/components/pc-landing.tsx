import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  BarChart3,
  Headphones,
  ArrowRight,
  ChevronDown,
  Activity,
  CheckCircle2,
  Lock,
  Wallet
} from "lucide-react";
import { DesktopAuthGate } from "@/components/desktop-auth-gate";

interface PCLandingProps {
  onStart: () => void;
  onOpenAuth?: () => void;
}

export function PCLanding({ onStart, onOpenAuth }: PCLandingProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tradingModeTab, setTradingModeTab] = useState<"fast" | "pro">("fast");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sadece ilk giriş/tanıtım ekranı açıkken kaydırmayı (scroll) aktif et, çıkışta kilitleri geri yükle
  useEffect(() => {
    const originalBodyPosition = document.body.style.position;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const rootEl = document.getElementById("root");
    const originalRootOverflow = rootEl?.style.overflow;
    const originalRootHeight = rootEl?.style.height;

    document.body.style.position = "static";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    if (rootEl) {
      rootEl.style.overflow = "visible";
      rootEl.style.height = "auto";
    }

    scrollContainerRef.current?.focus();

    return () => {
      document.body.style.position = originalBodyPosition;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (rootEl) {
        rootEl.style.overflow = originalRootOverflow || "";
        rootEl.style.height = originalRootHeight || "";
      }
    };
  }, []);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleStart = () => {
    try {
      localStorage.removeItem("hasSeenInteractiveTutorialv12");
      localStorage.removeItem("obyo_tutorial_done");
    } catch {}
    onStart();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("start-tutorial"));
    }, 400);
  };

  const handleAuthOpen = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      id="pc-landing-scroll-container"
      tabIndex={0}
      className="fixed inset-0 z-30 h-full w-full overflow-y-auto overflow-x-hidden bg-[#090D1A] text-slate-100 selection:bg-blue-600 selection:text-white font-sans scroll-smooth landing-scrollbar outline-none"
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
    >
      {/* Background Subtle Gradient Mesh (Professional & Non-Neon) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Soft Blue Gradient Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-blue-900/20 via-blue-950/5 to-transparent pointer-events-none" />
        {/* Soft Orange Gradient Accent on Corner */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-orange-600/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090D1A]/90 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-orange-500 p-0.5 flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-[#0A0E1C] rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-xl tracking-tight text-white">OBYO</span>
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                  OPTION
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider font-medium uppercase mt-1">Kurumsal Trading</p>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
            <button
              onClick={scrollToTop}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Ana Sayfa
            </button>
            <button
              onClick={() => scrollToSection("avantajlar")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Avantajlar
            </button>
            <button
              onClick={() => scrollToSection("modlar")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              İşlem Modları
            </button>
            <button
              onClick={() => scrollToSection("istatistikler")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              İstatistikler
            </button>
            <button
              onClick={() => scrollToSection("sss")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              SSS
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAuthOpen}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
            <button
              onClick={handleStart}
              className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* ================= HERO SECTION ================= */}
        <section id="hero" className="pt-20 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Big Display Headline with Blue and Orange Gradients (Rozetler kaldırıldı) */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] max-w-4xl text-white mb-6"
          >
            Finansal Piyasalarda Doğru Tahmin, <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-orange-400 bg-clip-text text-transparent">
              Yüksek Getiri Potansiyeli
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl font-normal leading-relaxed mb-10"
          >
            Forex ve OTC varlıklarında fiyat yönünü öngörün. Saniyeler içinde sonuçlanan mikro vadeli opsiyon işlemleri ile profesyonel piyasa hızını yakalayın.
          </motion.p>

          {/* Hero Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            {/* Blue Gradient CTA */}
            <button
              onClick={handleStart}
              className="h-13 px-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-950/40 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Orange Gradient Accent Button */}
            <button
              onClick={handleAuthOpen}
              className="h-13 px-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:text-orange-300 font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Zaten hesabınız var mı?</span>
              <span className="font-bold underline underline-offset-4 ml-1">Giriş Yap →</span>
            </button>
          </motion.div>

          {/* Hero Trade Terminal Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-5xl relative"
          >
            <div className="w-full bg-[#0C101E] border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
              {/* Terminal Top Bar */}
              <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="text-orange-400">OBYO</span>
                    <span>OPTION TERMINAL</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 ml-4 font-medium">
                    <span className="hover:text-white cursor-pointer transition-colors">Liderler</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Portföy</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Yardım</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
                    <Wallet className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-mono font-bold text-white">$29,192.00</span>
                  </div>
                  <div className="bg-blue-950/40 border border-blue-900/50 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-blue-400">
                    0xa9...f82
                  </div>
                </div>
              </div>

              {/* Terminal Main Grid */}
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
                {/* Left Column: Active Order Stream */}
                <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-medium">Aktif Emirler</span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        327 Canlı
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        { user: "0x7a8...c1", asset: "BTC", amount: "+$211.00" },
                        { user: "0x34b...9e", asset: "ETH", amount: "+$185.50" },
                        { user: "0x91d...7f", asset: "SOL", amount: "+$94.00" },
                        { user: "0x52c...3a", asset: "EUR", amount: "+$160.00" },
                        { user: "0x88e...12", asset: "BTC", amount: "+$420.00" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                              {item.asset}
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">{item.user}</span>
                          </div>
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Toplam Havuz</span>
                    <span className="font-mono font-bold text-white">$179,294</span>
                  </div>
                </div>

                {/* Center Column: Live Chart & Action Controls */}
                <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  {/* Pair Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-xs text-orange-400">
                        ₿
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          BTC / USDT
                          <span className="text-[10px] bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                            +2.48%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Gerçek Zamanlı Piyasa Fiyatı</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-mono font-black text-white">$67,482.50</div>
                      <div className="text-xs text-emerald-400 font-medium">Net Getiri: %95</div>
                    </div>
                  </div>

                  {/* Clean SVG Line Chart */}
                  <div className="h-40 w-full relative flex items-end my-2 overflow-hidden rounded-lg bg-[#070A14] border border-slate-800/80 p-2">
                    <div className="absolute inset-0 flex flex-col justify-between opacity-20 pointer-events-none p-2">
                      <div className="w-full h-px bg-slate-700" />
                      <div className="w-full h-px bg-slate-700" />
                      <div className="w-full h-px bg-slate-700" />
                      <div className="w-full h-px bg-slate-700" />
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartBlueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,90 Q40,85 80,60 T160,75 T240,40 T320,50 T400,20 L400,120 L0,120 Z"
                        fill="url(#chartBlueGrad)"
                      />
                      <path
                        d="M0,90 Q40,85 80,60 T160,75 T240,40 T320,50 T400,20"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="400" cy="20" r="3.5" fill="#3B82F6" />
                    </svg>

                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                      $67,482.50
                    </div>
                  </div>

                  {/* Trade Action Preview Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleStart}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>YUKARI (%95)</span>
                    </button>
                    <button
                      onClick={handleStart}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>AŞAĞI (%95)</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Pool & Stats Summary */}
                <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-medium mb-3">Havuz Dağılımı</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-emerald-400 font-semibold">Yukarı Havuzu</span>
                          <span className="text-white font-mono font-bold">58%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="w-[58%] h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-rose-400 font-semibold">Aşağı Havuzu</span>
                          <span className="text-white font-mono font-bold">42%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="w-[42%] h-full bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Min. Süre</span>
                        <span className="font-mono text-white font-medium">5 Saniye</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Anlık Payout</span>
                        <span className="font-mono text-emerald-400 font-bold">%95 Net</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStart}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    İşlem Panelini Aç →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ================= ADVANTAGES SECTION ================= */}
        <section id="avantajlar" className="py-24 px-6 border-t border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Title & Subtitle (Rozet kaldırıldı) */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Kurumsal Düzeyde Güven ve Hız
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mb-14">
              Yatırımcı odaklı altyapımız ile minimum gecikme süresi ve tam şeffaflık sunuyoruz.
            </p>

            {/* 3 Advantage Cards with Blue and Orange Gradient Touches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left mb-12">
              {/* Card 1: Fast Execution (Blue Gradient Accent) */}
              <div className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Ultra Hızlı Emir İletimi
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  5 saniyeden başlayan mikro vadelerle piyasa dalgalanmalarından anında getiri elde edin.
                </p>
              </div>

              {/* Card 2: Security */}
              <div className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 mb-5 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-slate-200 transition-colors">
                  Yüksek Düzey Güvenlik
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  2FA çift aşamalı kimlik doğrulama, SSL 256-bit şifreleme ve güvenli cüzdan protokolleri.
                </p>
              </div>

              {/* Card 3: Transparent Data (Orange Gradient Accent) */}
              <div className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-orange-500/50 transition-all duration-300 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white mb-5 shadow-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  Şeffaf Piyasa Verisi
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Küresel likidite sağlayıcılarından alınan canlı fiyatlar ile şeffaf ve manipülasyonsuz analiz.
                </p>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= TRADING MODES SECTION ================= */}
        <section id="modlar" className="py-24 px-6 border-t border-slate-800/80 relative bg-[#070A14]">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Title & Subtitle (Rozet kaldırıldı) */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              İşlem Modları ve Analiz Araçları
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mb-10">
              İster hızlı opsiyon vadeleriyle işlem yapın, ister teknik analiz göstergeleriyle piyasayı derinlemesine izleyin.
            </p>

            {/* Toggle Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl mb-12 shadow-sm">
              <button
                onClick={() => setTradingModeTab("fast")}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tradingModeTab === "fast"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Hızlı Opsiyon Modu
              </button>
              <button
                onClick={() => setTradingModeTab("pro")}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tradingModeTab === "pro"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Gelişmiş Grafik Modu
              </button>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl text-left mb-12">
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-900/50 flex items-center justify-center text-blue-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Yatırımcı Topluluğu</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Binlerce yatırımcıyla piyasa trendlerini anlık izleyin, liderler tablosundaki en başarılı stratejileri takip edin.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Bakiye ve Risk Yönetimi</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Demo hesap modu ile sıfır riskle pratik yapın, kademeli emir boyutlandırmasıyla sermayenizi güvenle yönetin.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-900/50 flex items-center justify-center text-blue-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Teknik Göstergeler</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    RSI, Hareketli Ortalamalar ve Bollinger bantları ile desteklenen gerçek zamanlı osilatör sinyalleri.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-950/50 border border-orange-900/50 flex items-center justify-center text-orange-400 shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Kesintisiz Canlı Destek</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Teknik ve finansal destek ekibimiz canlı sohbet ve e-posta kanalları üzerinden haftanın her günü hizmetinizdedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= STATISTICS SECTION ================= */}
        <section id="istatistikler" className="py-24 px-6 border-t border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Title (Rozet kaldırıldı) */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-14">
              Rakamlarla Obyo Option
            </h2>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-5xl text-left mb-12">
              {/* Left Big Card */}
              <div className="lg:col-span-6 relative p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
                <div className="mb-12 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-sm">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight mb-3">130+ Ülke</div>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Dünya genelinde 130'dan fazla ülkeden binlerce aktif yatırımcı güvenle Obyo Option platformunda işlem yapıyor.
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-blue-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Küresel Finansal Likidite</span>
                </div>
              </div>

              {/* Right 4 Bento Cards (2x2) */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 mb-4">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">84K+</div>
                    <div className="text-xs text-slate-400 font-medium">Saatlik İşlem Hacmi (USD)</div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/50 flex items-center justify-center text-blue-400 mb-4">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">85K+</div>
                    <div className="text-xs text-slate-400 font-medium">Aktif Yatırımcı Sayısı</div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 mb-4">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">129K+</div>
                    <div className="text-xs text-slate-400 font-medium">Günlük Başarılı İşlem</div>
                  </div>
                </div>

                {/* Orange Gradient Card for Top Metric */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 border border-orange-400/40 text-white shadow-md flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white mb-4">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">%95</div>
                    <div className="text-xs text-white/90 font-medium">Maksimum Anlık Getiri</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section id="sss" className="py-20 px-6 border-t border-slate-800/80 relative bg-[#070A14]">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 text-center">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-10 text-center">
              Platform ve işlemlerle ilgili merak edilen konular
            </p>

            <div className="w-full space-y-3">
              {[
                {
                  q: "Platformda nasıl işlem yapmaya başlayabilirim?",
                  a: "Hemen Başla butonuna tıklayarak etkileşimli tutorial ile alıştırma yapabilir, ardından ücretsiz hesabınızı oluşturarak gerçek veya demo bakiye ile işleme başlayabilirsiniz."
                },
                {
                  q: "İşlem süreleri ve getiri oranları nelerdir?",
                  a: "Obyo Option'da 5 saniyeden başlayan mikro vadelerden dakikalık sürelere kadar işlem yapabilirsiniz. Başarılı tahminlerde getiri oranı %95'e kadar ulaşmaktadır."
                },
                {
                  q: "Para yatırma ve çekme işlemleri ne kadar sürer?",
                  a: "Kripto para (USDT, BTC) ve banka transferi yöntemleriyle yapılan yatırma ve çekme talepleri güvenlik kontrollerinden sonra en hızlı şekilde sonuçlandırılır."
                },
                {
                  q: "Platform mobilde de çalışıyor mu?",
                  a: "Evet! Obyo Option tüm masaüstü tarayıcılar ve modern mobil cihazlar için optimize edilmiş PWA altyapısına sahiptir."
                }
              ].map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        openFaq === index ? "rotate-180 text-blue-400" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800 py-12 px-6 bg-[#060812] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm text-white">
                OBYO <span className="text-orange-400">OPTION</span>
              </div>
              <p className="text-[10px] text-slate-400">Güvenli İkili Opsiyon Ticaret Platformu</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <button onClick={() => scrollToSection("avantajlar")} className="hover:text-white transition-colors cursor-pointer">
              Avantajlar
            </button>
            <button onClick={() => scrollToSection("modlar")} className="hover:text-white transition-colors cursor-pointer">
              İşlem Modları
            </button>
            <button onClick={() => scrollToSection("istatistikler")} className="hover:text-white transition-colors cursor-pointer">
              İstatistikler
            </button>
            <button onClick={() => scrollToSection("sss")} className="hover:text-white transition-colors cursor-pointer">
              SSS
            </button>
            <a href="/privacy" className="hover:text-white transition-colors">
              Gizlilik Politikası
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-slate-400">
            © 2026 Obyo Option. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

      {/* Direct Auth Modal if user clicks 'Giriş Yap' */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-10 right-0 text-slate-300 hover:text-white text-xs font-semibold py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                ✕ Kapat
              </button>
              <DesktopAuthGate />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
