import React, { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { useIsPhoneLandscape, lockPortraitOrientation } from "@/hooks/use-mobile";

export function LandscapeBlockModal() {
  const isLandscape = useIsPhoneLandscape();

  useEffect(() => {
    if (isLandscape) {
      lockPortraitOrientation();
    }
  }, [isLandscape]);

  if (!isLandscape) return null;

  return (
    <div
      id="phone-landscape-lock-screen"
      className="fixed inset-0 z-[9999999] bg-white text-zinc-900 flex flex-col items-center justify-center p-6 sm:p-8 text-center select-none"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mb-5 shadow-sm">
        <RotateCw size={30} className="text-zinc-800 animate-spin" style={{ animationDuration: "3s" }} />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2 tracking-tight">
        Telefonunuzu dik tutun
      </h2>

      <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-[280px]">
        Obyo platformu telefonlarda yalnızca dikey modda çalışır. Devam etmek için cihazınızı çevirin.
      </p>
    </div>
  );
}
