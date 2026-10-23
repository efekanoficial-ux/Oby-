import React from "react";

export const ASSET_ICONS: Record<string, string> = {
  "Crypto IDX": "/assets/crypto-idx.png",
  "AUD/CAD": "/assets/aud-cad.png",
  "AUD/CAD (OTC)": "/assets/aud-cad.png",
  "AUD/CHF": "/assets/aud-chf.png",
  "AUD/CHF (OTC)": "/assets/aud-chf.png",
  "AUD/DKK": "/assets/aud-dkk.png",
  "AUD/DKK (OTC)": "/assets/aud-dkk.png",
  "AUD/HUF": "/assets/aud-huf.png",
  "AUD/HUF (OTC)": "/assets/aud-huf.png",
  "AUD/JPY": "/assets/aud-jpy.png",
  "AUD/JPY (OTC)": "/assets/aud-jpy.png",
  "AUD/NOK": "/assets/aud-nok.png",
  "AUD/NOK (OTC)": "/assets/aud-nok.png",
  "AUD/NZD": "/assets/aud-nzd.png",
  "AUD/NZD (OTC)": "/assets/aud-nzd.png",
  "AUD/SEK": "/assets/aud-sek.png",
  "AUD/SEK (OTC)": "/assets/aud-sek.png",
  "AUD/SGD": "/assets/aud-sgd.png",
  "AUD/SGD (OTC)": "/assets/aud-sgd.png",
  "AUD/USD": "/assets/aud-usd.png",
  "AUD/USD (OTC)": "/assets/aud-usd.png",
  "AUD/ZAR": "/assets/aud-zar.png",
  "AUD/ZAR (OTC)": "/assets/aud-zar.png",
  "CAD/CHF": "/assets/cad-chf.png",
  "CAD/CHF (OTC)": "/assets/cad-chf.png",
};

export function getAssetIcon(label: string): string {
  if (ASSET_ICONS[label]) return ASSET_ICONS[label];
  const cleaned = label.replace(/\s*\(OTC\)/i, "").trim();
  if (ASSET_ICONS[cleaned]) return ASSET_ICONS[cleaned];
  // Normalized fallback (e.g. "aud/usd" -> "AUD/USD")
  const upper = cleaned.toUpperCase();
  for (const [k, v] of Object.entries(ASSET_ICONS)) {
    if (k.toUpperCase() === upper) return v;
  }
  return "/assets/crypto-idx.png";
}

interface AssetIconProps {
  label: string;
  size?: number;
  className?: string;
  glow?: boolean;
}

export function AssetIcon({ label, size = 20, className = "", glow = false }: AssetIconProps) {
  const iconSrc = getAssetIcon(label);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iconSrc}
        alt={label}
        width={size}
        height={size}
        className={`w-full h-full object-contain pointer-events-none transition-transform duration-150 ${
          glow
            ? "drop-shadow-[0_2px_6px_rgba(255,255,255,0.25)]"
            : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
        }`}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
