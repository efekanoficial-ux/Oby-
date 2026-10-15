import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function EducationPlatformNotice() {
  const { t, langCode } = useLanguage();

  const title = t.educationPlatformNotice || (
    langCode === "tr"
      ? "Bu bir Eğitim platformudur"
      : (langCode === "de" ? "Dies ist eine Bildungsplattform" : "This is an Educational platform")
  );

  const sub = t.educationPlatformSub || (
    langCode === "tr"
      ? "Bu platform yalnızca eğitim ve simülasyon amaçlıdır. Gerçek para yatırma ve çekme işlemleri kapalıdır."
      : (langCode === "de"
        ? "Diese Plattform dient ausschließlich zu Bildungs- und Simulationszwecken. Echtgeldtransaktionen sind deaktiviert."
        : "This platform is for educational and simulation purposes only. Real money operations are disabled.")
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] h-full w-full px-6 py-12 select-none relative overflow-hidden bg-[#050608] text-center">
      {/* ── Gray Animated Ambient Glow ────────────────────────────────────────── */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.12, 0.28, 0.12],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute w-80 h-80 rounded-full bg-gradient-to-r from-zinc-500/20 via-zinc-400/20 to-zinc-600/20 blur-3xl"
      />

      {/* ── Gray Animated Center Card / Content ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-md mx-auto"
      >
        {/* Animated Icon with Gray Pulsing Ring */}
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-6"
        >
          {/* Subtle Outer Gray Pulse Ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.65, 0.25],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-2.5 rounded-3xl border border-zinc-500/30 bg-zinc-700/10"
          />

          {/* Icon Box */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-700/60 bg-gradient-to-b from-zinc-800/90 to-zinc-900/95 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <GraduationCap className="h-10 w-10 text-zinc-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" />
          </div>
        </motion.div>

        {/* Gray Animated Text: "Bu bir Eğitim platformudur" */}
        <motion.h1
          animate={{
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400 drop-shadow"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <p className="mt-3 text-xs sm:text-sm font-medium text-zinc-400/80 max-w-xs sm:max-w-sm leading-relaxed">
          {sub}
        </p>
      </motion.div>
    </div>
  );
}

export default EducationPlatformNotice;
