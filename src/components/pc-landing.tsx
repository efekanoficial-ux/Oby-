import { useState } from "react";
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
  Sparkles,
  ChevronDown,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  Award,
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

  const handleStart = () => {
    // Clear tutorial flag in case it was set previously so user gets fresh tutorial experience
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
    <div className="min-h-screen bg-[#060813] text-white selection:bg-[#0066FF] selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Glows and Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Top/Center Blue Spotlight */}
        <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#0055FF]/25 via-[#0038A8]/10 to-transparent blur-[130px] rounded-full" />

        {/* Subtle Orange Accent Glow on Left */}
        <div className="absolute top-[35%] -left-[150px] w-[500px] h-[500px] bg-[#FF6B00]/10 blur-[150px] rounded-full" />

        {/* Cyan Ambient Glow on Right */}
        <div className="absolute top-[55%] -right-[150px] w-[600px] h-[600px] bg-[#00D4FF]/10 blur-[160px] rounded-full" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#060813]/85 border-b border-white/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF8800] to-[#E05500] p-0.5 shadow-[0_0_20px_rgba(255,107,0,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#090C19] rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">OBYO</span>
                <span className="font-black text-xl tracking-tight text-[#FF6B00]">OPTION</span>
              </div>
              <p className="text-[10px] text-white/40 tracking-wider font-medium uppercase -mt-0.5">Next-Gen Trading</p>
            </div>
          </div>

          {/* Navigation Menu Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <a
              href="#hero"
              className="px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              Ana Sayfa
            </a>
            <a
              href="#avantajlar"
              className="px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              Avantajlar
            </a>
            <a
              href="#modlar"
              className="px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              İşlem Modları
            </a>
            <a
              href="#istatistikler"
              className="px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              İstatistikler
            </a>
            <a
              href="#sss"
              className="px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              SSS
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAuthOpen}
              className="px-4 py-2 text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
            <button
              onClick={handleStart}
              className="group relative px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white text-xs font-bold shadow-[0_0_24px_rgba(0,102,255,0.45)] hover:shadow-[0_0_32px_rgba(0,102,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
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
        <section id="hero" className="pt-16 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Top Feature Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 text-xs font-medium mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(0,102,255,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Yatırım yap, tahmin et, kazan</span>
          </motion.div>

          {/* Big Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl text-white mb-6"
          >
            Geleceği Tahmin Edin, <br />
            <span className="bg-gradient-to-r from-[#2E8BFF] via-[#5CB1FF] to-[#0066FF] bg-clip-text text-transparent">
              Kazancınızı Katlayın
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/60 text-base sm:text-lg max-w-2xl font-normal leading-relaxed mb-8"
          >
            Grafiğin yukarı mı yoksa aşağı mı gideceğini tahmin edin. Saniyeler içinde %95'e varan getiri ile anında kazanın.
          </motion.p>

          {/* Hero Action Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <button
              onClick={handleStart}
              className="h-13 px-9 rounded-full bg-gradient-to-r from-[#0066FF] via-[#1E78FF] to-[#0052cc] text-white font-bold text-sm tracking-wide shadow-[0_0_35px_rgba(0,102,255,0.55)] hover:shadow-[0_0_45px_rgba(0,102,255,0.8)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleAuthOpen}
              className="h-13 px-6 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Zaten bir hesabınız var mı? <span className="text-[#FF6B00] font-semibold underline underline-offset-4 ml-1">Giriş Yap →</span>
            </button>
          </motion.div>

          {/* Hero Trade Terminal Mockup Card (matching the video's preview card) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="w-full max-w-5xl relative"
          >
            {/* Ambient intense glow behind the card */}
            <div className="absolute -inset-1 bg-gradient-to-b from-[#0066FF]/35 to-[#0038A8]/0 rounded-2xl blur-2xl opacity-60 -z-10" />

            <div className="w-full bg-[#080B18]/90 border border-white/[0.09] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
              {/* Terminal Top Bar */}
              <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                    <span className="text-[#FF6B00]">OBYO</span>
                    <span>OPTION</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-white/40 ml-4 font-medium">
                    <span className="text-white/80 hover:text-white cursor-pointer">Liderlik Tablosu</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer">Referans</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer">Jackpot</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer">SSS</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
                    <Wallet className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span className="font-bold text-white">$29,192.02</span>
                  </div>
                  <div className="bg-[#0066FF]/20 border border-[#0066FF]/40 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-[#70B0FF]">
                    0xa9...f82
                  </div>
                </div>
              </div>

              {/* Terminal Main Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
                {/* Left Mini Column: Active Players */}
                <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] text-white/50 font-medium">Yatırımcılar</span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        327 Canlı
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        { user: "0x7a8...c1", asset: "BTC", amount: "+$211.00", up: true },
                        { user: "0x34b...9e", asset: "ETH", amount: "+$185.50", up: true },
                        { user: "0x91d...7f", asset: "SOL", amount: "+$94.00", up: false },
                        { user: "0x52c...3a", asset: "EUR", amount: "+$160.00", up: true },
                        { user: "0x88e...12", asset: "BTC", amount: "+$420.00", up: true },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-mono text-white/70">
                              {item.asset}
                            </div>
                            <span className="text-white/60 font-mono text-[11px]">{item.user}</span>
                          </div>
                          <span className="text-emerald-400 font-bold text-[11px]">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
                    <span>Toplam Havuz</span>
                    <span className="font-bold text-white">$179,294</span>
                  </div>
                </div>

                {/* Center Column: Live Chart & Action Controls */}
                <div className="lg:col-span-6 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between">
                  {/* Pair Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FF6B00]/20 flex items-center justify-center font-bold text-xs text-[#FF6B00]">
                        ₿
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          BTC / USDT
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-medium">+2.48%</span>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono">Gerçek Zamanlı Piyasa Verisi</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-black text-white">$67,482.50</div>
                      <div className="text-[10px] text-emerald-400 font-medium">Kazanç Oranı: %95</div>
                    </div>
                  </div>

                  {/* Simulated Neon Chart Graphic */}
                  <div className="h-36 w-full relative flex items-end my-2 overflow-hidden rounded-lg bg-[#04060E]/60 border border-white/[0.04] p-2">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none p-2">
                      <div className="w-full h-px bg-white/30" />
                      <div className="w-full h-px bg-white/30" />
                      <div className="w-full h-px bg-white/30" />
                      <div className="w-full h-px bg-white/30" />
                    </div>

                    {/* Chart SVG Line */}
                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,90 Q40,85 80,60 T160,75 T240,40 T320,50 T400,20 L400,120 L0,120 Z"
                        fill="url(#chartGrad)"
                      />
                      <path
                        d="M0,90 Q40,85 80,60 T160,75 T240,40 T320,50 T400,20"
                        fill="none"
                        stroke="#2B7FFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="400" cy="20" r="5" fill="#00D4FF" className="animate-ping" />
                      <circle cx="400" cy="20" r="4" fill="#FFFFFF" />
                    </svg>

                    {/* Current Price Line Badge */}
                    <div className="absolute top-4 right-3 bg-[#0066FF] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                      $67,482.50
                    </div>
                  </div>

                  {/* Trade Action Preview Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleStart}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>YUKARI (%95)</span>
                    </button>
                    <button
                      onClick={handleStart}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer"
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>AŞAĞI (%95)</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Pool & Stats Summary */}
                <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-white/50 font-medium mb-2">Havuz Oranları</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-emerald-400 font-semibold">Yukarı Havuzu</span>
                          <span className="text-white font-mono font-bold">58%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="w-[58%] h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-rose-400 font-semibold">Aşağı Havuzu</span>
                          <span className="text-white font-mono font-bold">42%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="w-[42%] h-full bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                      <div className="flex justify-between text-white/60">
                        <span>Min. Süre</span>
                        <span className="font-mono text-white font-medium">5 Saniye</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Anlık Payout</span>
                        <span className="font-mono text-[#00E5FF] font-bold">%95 Net</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStart}
                    className="w-full mt-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Hemen İşleme Başla →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ================= ADVANTAGES SECTION ================= */}
        <section id="avantajlar" className="py-24 px-6 border-t border-white/[0.05] relative">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Avantajlar</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Platformun Avantajları
            </h2>
            <p className="text-white/50 text-sm sm:text-base max-w-xl mb-14">
              Grafiğin yukarı mı aşağı mı gideceğini tahmin edin, güçlü altyapımızla saniyeler içinde kazanın.
            </p>

            {/* 3 Advantage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left mb-12">
              {/* Card 1: Fast Transaction */}
              <div className="group relative p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/40 hover:bg-[#0A0E22] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Hızlı İşlemler
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  5 saniyeden başlayan ultra hızlı işlem süreleri ile beklemeden anında sonuç ve anlık kazanç elde edin.
                </p>
              </div>

              {/* Card 2: Security */}
              <div className="group relative p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/40 hover:bg-[#0A0E22] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Yüksek Güvenlik
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  2FA çift aşamalı kimlik doğrulama, SSL 256-bit şifreleme ve güvenli cüzdan altyapısı ile paranız güvende.
                </p>
              </div>

              {/* Card 3: Transparent Market Data */}
              <div className="group relative p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/40 hover:bg-[#0A0E22] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Şeffaf Oranlar
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Binance ve TradingView global borsa veri akışları ile %100 manipülasyonsuz, şeffaf piyasa fiyatları.
                </p>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white text-xs font-bold shadow-[0_0_24px_rgba(0,102,255,0.4)] hover:shadow-[0_0_35px_rgba(0,102,255,0.7)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= TRADING MODES / FEATURES SECTION ================= */}
        <section id="modlar" className="py-24 px-6 border-t border-white/[0.05] relative bg-[#04060E]/50">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>İşlem Modları</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Tarzınıza Uygun İşlem Modunu Seçin
            </h2>
            <p className="text-white/50 text-sm sm:text-base max-w-xl mb-10">
              İster anlık hızlı opsiyon işlemleri yapın, ister gelişmiş teknik analiz göstergeleriyle derinlemesine piyasayı izleyin.
            </p>

            {/* Toggle Tabs (matching video) */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] p-1 rounded-full mb-12 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <button
                onClick={() => setTradingModeTab("fast")}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tradingModeTab === "fast"
                    ? "bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.5)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Hızlı Opsiyon
              </button>
              <button
                onClick={() => setTradingModeTab("pro")}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  tradingModeTab === "pro"
                    ? "bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.5)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Gelişmiş Grafikler
              </button>
            </div>

            {/* 4 Feature Cards (2x2 grid matching video) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left mb-12">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#080B1A]/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Yatırımcı Topluluğu</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Binlerce deneyimli yatırımcıyla stratejilerinizi paylaşın, liderlik tablosunu takip edin ve piyasa trendlerini birlikte yakalayın.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#080B1A]/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Risk Yönetimi & Bakiye Koruması</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Korumalı demo bakiye modu ve esnek emir boyutlandırması sayesinde bütçenizi ve riskinizi tam kontrol altında yönetin.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#080B1A]/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">Analiz & Piyasa Sinyalleri</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    RSI, MACD, Bollinger bantları ve akıllı osilatörlerle güçlendirilmiş gerçek zamanlı analizler ve işlem sinyalleri.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-[#080B1A]/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1.5">7/24 Kesintisiz Canlı Destek</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Her türlü soru ve talebiniz için profesyonel finans destek ekibimiz canlı chat ve e-posta ile haftanın her günü hizmetinizde.
                  </p>
                </div>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white text-xs font-bold shadow-[0_0_24px_rgba(0,102,255,0.4)] hover:shadow-[0_0_35px_rgba(0,102,255,0.7)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= STATISTICS SECTION ================= */}
        <section id="istatistikler" className="py-24 px-6 border-t border-white/[0.05] relative">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Activity className="w-3.5 h-3.5" />
              <span>İstatistikler</span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-14">
              Rakamlarla Obyo Option
            </h2>

            {/* Bento Grid layout (matching frames 00:15 - 00:20) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-5xl text-left mb-12">
              {/* Left Big Card (130+ Countries) */}
              <div className="lg:col-span-6 relative p-8 rounded-3xl bg-gradient-to-br from-[#080B1C] to-[#060814] border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between">
                {/* Ambient glow in bottom left */}
                <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

                {/* Dot Matrix World Map Pattern Simulation */}
                <div className="absolute top-4 right-4 w-52 h-44 opacity-20 pointer-events-none">
                  <svg className="w-full h-full text-blue-400" viewBox="0 0 200 150" fill="currentColor">
                    <circle cx="20" cy="30" r="2" />
                    <circle cx="35" cy="35" r="2" />
                    <circle cx="45" cy="25" r="2" />
                    <circle cx="55" cy="40" r="2" />
                    <circle cx="70" cy="35" r="2" />
                    <circle cx="85" cy="45" r="2" />
                    <circle cx="100" cy="40" r="2" />
                    <circle cx="115" cy="50" r="2" />
                    <circle cx="130" cy="45" r="2" />
                    <circle cx="145" cy="60" r="2" />
                    <circle cx="160" cy="55" r="2" />
                    <circle cx="175" cy="70" r="2" />
                    <circle cx="40" cy="60" r="2" />
                    <circle cx="60" cy="70" r="2" />
                    <circle cx="80" cy="65" r="2" />
                    <circle cx="110" cy="75" r="2" />
                    <circle cx="140" cy="85" r="2" />
                    <circle cx="70" cy="90" r="2" />
                    <circle cx="100" cy="95" r="2" />
                    <circle cx="130" cy="110" r="2" />
                    <circle cx="90" cy="120" r="2" />
                  </svg>
                </div>

                <div className="mb-12 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight mb-3">130+ Ülke</div>
                  <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                    Dünya genelinde 130'dan fazla ülkeden binlerce aktif yatırımcı güvenle Obyo Option platformunda işlem yapıyor.
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-blue-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Küresel Finansal Likidite</span>
                </div>
              </div>

              {/* Right 4 Bento Cards (2x2) */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                {/* Stat 1 */}
                <div className="p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/30 transition-all flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">84K+</div>
                    <div className="text-xs text-white/50 font-medium">Saatlik İşlem Hacmi (USD)</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/30 transition-all flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">85K+</div>
                    <div className="text-xs text-white/50 font-medium">Aktif Yatırımcı Sayısı</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="p-6 rounded-2xl bg-[#080B1A]/80 border border-white/[0.07] hover:border-blue-500/30 transition-all flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">129K+</div>
                    <div className="text-xs text-white/50 font-medium">Günlük Başarılı İşlem</div>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#0048B3] border border-blue-400/40 text-white shadow-[0_0_25px_rgba(0,102,255,0.35)] flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white mb-4">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">%95</div>
                    <div className="text-xs text-white/80 font-medium">Maksimum Anlık Getiri</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section CTA */}
            <button
              onClick={handleStart}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white text-xs font-bold shadow-[0_0_24px_rgba(0,102,255,0.4)] hover:shadow-[0_0_35px_rgba(0,102,255,0.7)] hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section id="sss" className="py-20 px-6 border-t border-white/[0.05] relative bg-[#04060E]/40">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 text-center">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mb-10 text-center">
              Aklınıza takılan tüm soruların cevaplarını burada bulabilirsiniz.
            </p>

            <div className="w-full space-y-3">
              {[
                {
                  q: "Platformda nasıl işlem yapmaya başlayabilirim?",
                  a: "Hemen Başla butonuna tıklayarak etkileşimli tutorial ile alıştırma yapabilir, ardından tamamen ücretsiz hesabınızı oluşturarak gerçek veya demo bakiye ile işleme başlayabilirsiniz."
                },
                {
                  q: "İşlem süreleri ve getiri oranları nelerdir?",
                  a: "Obyo Option'da 5 saniyeden başlayan ultra hızlı mikro vadelerden dakikalık sürelere kadar işlem yapabilirsiniz. Başarılı tahminlerde getiri oranı %95'e kadar ulaşmaktadır."
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
                  className="rounded-xl bg-[#080B1A]/80 border border-white/[0.06] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-semibold text-white/90 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/40 transition-transform ${
                        openFaq === index ? "rotate-180 text-blue-400" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 pt-1 text-xs text-white/50 leading-relaxed border-t border-white/[0.04]">
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
      <footer className="border-t border-white/[0.06] py-12 px-6 bg-[#04060E] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm text-white">
                OBYO <span className="text-[#FF6B00]">OPTION</span>
              </div>
              <p className="text-[10px] text-white/40">Güvenli İkili Opsiyon Ticaret Platformu</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 font-medium">
            <a href="#avantajlar" className="hover:text-white transition-colors">Avantajlar</a>
            <a href="#modlar" className="hover:text-white transition-colors">İşlem Modları</a>
            <a href="#istatistikler" className="hover:text-white transition-colors">İstatistikler</a>
            <a href="#sss" className="hover:text-white transition-colors">SSS</a>
            <a href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-white/40">
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
                className="absolute -top-10 right-0 text-white/60 hover:text-white text-xs font-semibold py-1 px-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
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
