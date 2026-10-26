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
  const upper = cleaned.toUpperCase();
  for (const [k, v] of Object.entries(ASSET_ICONS)) {
    if (k.toUpperCase() === upper) return v;
  }
  return "";
}

/* ─── Circular Flag Components for Currencies ────────────────────────────── */
const FlagCircle = React.memo(function FlagCircle({ code, size }: { code: string; size: number }) {
  const r = size / 2;
  const clipId = `flag-clip-${code.toUpperCase()}`;

  switch (code.toUpperCase()) {
    case "USD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#fff" />
            {[0, 4, 8, 12, 16, 20, 24, 28].map((y) => (
              <rect key={y} y={y} width="32" height="2.5" fill="#B22234" />
            ))}
            <rect width="15" height="15" fill="#3C3B6E" />
            <circle cx="5" cy="5" r="1.2" fill="#fff" />
            <circle cx="10" cy="5" r="1.2" fill="#fff" />
            <circle cx="7.5" cy="8" r="1.2" fill="#fff" />
            <circle cx="5" cy="11" r="1.2" fill="#fff" />
            <circle cx="10" cy="11" r="1.2" fill="#fff" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "EUR":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#003399" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 16 + 9.5 * Math.sin(rad);
            const cy = 16 - 9.5 * Math.cos(rad);
            return <circle key={deg} cx={cx} cy={cy} r="1.1" fill="#FFCC00" />;
          })}
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "GBP":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#012169" />
            <line x1="0" y1="0" x2="32" y2="32" stroke="#fff" strokeWidth="5.5" />
            <line x1="32" y1="0" x2="0" y2="32" stroke="#fff" strokeWidth="5.5" />
            <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2.2" />
            <line x1="32" y1="0" x2="0" y2="32" stroke="#C8102E" strokeWidth="2.2" />
            <rect x="12" y="0" width="8" height="32" fill="#fff" />
            <rect x="0" y="12" width="32" height="8" fill="#fff" />
            <rect x="13.5" y="0" width="5" height="32" fill="#C8102E" />
            <rect x="0" y="13.5" width="32" height="5" fill="#C8102E" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "JPY":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#ffffff" />
          <circle cx="16" cy="16" r="7" fill="#BC002D" />
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        </svg>
      );

    case "CHF":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#D52B1E" />
          <rect x="13.5" y="8" width="5" height="16" fill="#fff" rx="0.8" />
          <rect x="8" y="13.5" width="16" height="5" fill="#fff" rx="0.8" />
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "CAD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#ffffff" />
            <rect x="0" y="0" width="8" height="32" fill="#FF0000" />
            <rect x="24" y="0" width="8" height="32" fill="#FF0000" />
            {/* Maple leaf silhouette */}
            <path d="M16 8l1.6 3.8 3.5-.8-1.5 3.5 3.8 1.4-3.6 2.3.9 3.8-3.7-1.4-.7 3.4-.7-3.4-3.7 1.4.9-3.8-3.6-2.3 3.8-1.4-1.5-3.5 3.5.8z" fill="#FF0000" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "TRY":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#E30A17" />
          {/* Crescent */}
          <circle cx="14" cy="16" r="6.5" fill="#ffffff" />
          <circle cx="15.8" cy="16" r="5.2" fill="#E30A17" />
          {/* Star */}
          <polygon points="19.5,14 20.2,15.6 22,15.8 20.6,17 21,18.8 19.5,17.8 18,18.8 18.4,17 17,15.8 18.8,15.6" fill="#ffffff" />
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "AUD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#00008B" />
            {/* Mini Union Jack canton */}
            <rect width="14" height="12" fill="#012169" />
            <line x1="0" y1="0" x2="14" y2="12" stroke="#fff" strokeWidth="2.5" />
            <line x1="14" y1="0" x2="0" y2="12" stroke="#fff" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="14" y2="12" stroke="#C8102E" strokeWidth="1" />
            <line x1="14" y1="0" x2="0" y2="12" stroke="#C8102E" strokeWidth="1" />
            <rect x="5.5" y="0" width="3" height="12" fill="#fff" />
            <rect x="0" y="4.5" width="14" height="3" fill="#fff" />
            <rect x="6.3" y="0" width="1.4" height="12" fill="#C8102E" />
            <rect x="0" y="5.3" width="14" height="1.4" fill="#C8102E" />
            {/* Southern Cross stars */}
            <circle cx="23" cy="8" r="1" fill="#fff" />
            <circle cx="27" cy="14" r="1" fill="#fff" />
            <circle cx="23" cy="24" r="1.3" fill="#fff" />
            <circle cx="19" cy="17" r="1" fill="#fff" />
            <circle cx="8" cy="22" r="1.8" fill="#fff" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "NZD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#00247D" />
            <rect width="14" height="12" fill="#012169" />
            <line x1="0" y1="0" x2="14" y2="12" stroke="#fff" strokeWidth="2.5" />
            <line x1="14" y1="0" x2="0" y2="12" stroke="#fff" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="14" y2="12" stroke="#C8102E" strokeWidth="1" />
            <line x1="14" y1="0" x2="0" y2="12" stroke="#C8102E" strokeWidth="1" />
            <rect x="5.5" y="0" width="3" height="12" fill="#fff" />
            <rect x="0" y="4.5" width="14" height="3" fill="#fff" />
            <rect x="6.3" y="0" width="1.4" height="12" fill="#C8102E" />
            <rect x="0" y="5.3" width="14" height="1.4" fill="#C8102E" />
            <circle cx="23" cy="9" r="1.2" fill="#CC142B" stroke="#fff" strokeWidth="0.5" />
            <circle cx="27" cy="15" r="1.2" fill="#CC142B" stroke="#fff" strokeWidth="0.5" />
            <circle cx="23" cy="23" r="1.4" fill="#CC142B" stroke="#fff" strokeWidth="0.5" />
            <circle cx="19" cy="17" r="1" fill="#CC142B" stroke="#fff" strokeWidth="0.5" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "NOK":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#BA0C2F" />
            <rect x="9" y="0" width="6" height="32" fill="#fff" />
            <rect x="0" y="13" width="32" height="6" fill="#fff" />
            <rect x="10.5" y="0" width="3" height="32" fill="#00205B" />
            <rect x="0" y="14.5" width="32" height="3" fill="#00205B" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "SEK":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#006AA7" />
            <rect x="10" y="0" width="4" height="32" fill="#FECC00" />
            <rect x="0" y="14" width="32" height="4" fill="#FECC00" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "DKK":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#C8102E" />
            <rect x="10" y="0" width="4" height="32" fill="#fff" />
            <rect x="0" y="14" width="32" height="4" fill="#fff" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "PLN":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="32" height="16" fill="#ffffff" />
            <rect x="0" y="16" width="32" height="16" fill="#DC143C" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "HUF":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="32" height="10.6" fill="#CE2939" />
            <rect x="0" y="10.6" width="32" height="10.6" fill="#ffffff" />
            <rect x="0" y="21.2" width="32" height="10.8" fill="#477050" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "SGD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="32" height="16" fill="#ED2939" />
            <rect x="0" y="16" width="32" height="16" fill="#ffffff" />
            <circle cx="8" cy="8" r="4.5" fill="#ffffff" />
            <circle cx="9.5" cy="8" r="4" fill="#ED2939" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "ZAR":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="32" height="16" fill="#E03C31" />
            <rect x="0" y="16" width="32" height="16" fill="#001489" />
            <polygon points="0,0 16,16 0,32" fill="#007749" />
            <polygon points="0,4 12,16 0,28" fill="#000000" stroke="#FFB81C" strokeWidth="1.5" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "MXN":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="10.6" height="32" fill="#006847" />
            <rect x="10.6" y="0" width="10.6" height="32" fill="#ffffff" />
            <rect x="21.2" y="0" width="10.8" height="32" fill="#CE1126" />
            <circle cx="16" cy="16" r="2.5" fill="#8B4513" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "BRL":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect width="32" height="32" fill="#009739" />
            <polygon points="16,4 28,16 16,28 4,16" fill="#FEDF00" />
            <circle cx="16" cy="16" r="6" fill="#002776" />
            <path d="M10.5 16.5c3-1 8-1 11 .5" stroke="#fff" strokeWidth="1" fill="none" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "INR":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <clipPath id={clipId}>
              <circle cx="16" cy="16" r="15" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="32" height="10.6" fill="#FF9933" />
            <rect x="0" y="10.6" width="32" height="10.6" fill="#ffffff" />
            <rect x="0" y="21.2" width="32" height="10.8" fill="#138808" />
            <circle cx="16" cy="16" r="3.2" fill="none" stroke="#000080" strokeWidth="0.8" />
            <circle cx="16" cy="16" r="1" fill="#000080" />
          </g>
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    case "HKD":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#DE2910" />
          {/* Bauhinia flower silhouette */}
          <circle cx="16" cy="16" r="6" fill="#ffffff" />
          <circle cx="16" cy="16" r="3" fill="#DE2910" />
          <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="#1E2329" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <text x="16" y="20" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle">
            {code.slice(0, 3)}
          </text>
        </svg>
      );
  }
});

/* ─── Company SVG Logos (Clean vector brand marks without background) ─────── */
function CompanyLogo({ name, size }: { name: string; size: number }) {
  const norm = name.toLowerCase();

  if (norm.includes("apple")) {
    return (
      <svg width={size} height={size} viewBox="0 0 170 170" fill="#FFFFFF" className="shrink-0">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.85-11.88-14.42-6.1-9.46-10.9-20.17-14.4-32.14-3.5-11.97-5.25-23.2-5.25-33.68 0-14.2 3.65-26.06 10.94-35.58 7.3-9.52 16.58-14.38 27.84-14.58 5.43 0 11.2 1.48 17.3 4.45 6.1 2.97 10.15 4.51 12.16 4.63 1.63 0 5.79-1.63 12.48-4.9 6.69-3.26 12.55-4.72 17.58-4.38 13.59.87 24.34 5.74 32.26 14.63-12.18 7.39-18.17 17.4-17.97 30.04.2 9.78 3.97 17.95 11.32 24.51 7.35 6.56 16.03 10.3 26.04 11.22-2.17 6.31-4.78 12.51-7.83 18.6zM119.22 33.64c0-7.28 2.66-14.18 7.99-20.7 5.33-6.52 11.85-10.87 19.57-13.04.22 1.3.33 2.45.33 3.44 0 7.28-2.77 14.32-8.31 21.11-5.54 6.79-12.3 11.16-20.28 13.11-.22-1.3-.33-2.61-.33-3.92z"/>
      </svg>
    );
  }

  if (norm.includes("nvidia")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#76B900" className="shrink-0">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.07 14.73c-2.3 0-4.17-1.87-4.17-4.17 0-1.84 1.2-3.4 2.87-3.94.31-.1.49-.44.41-.75-.08-.31-.4-.51-.72-.43-2.14.69-3.69 2.68-3.69 5.12 0 2.93 2.38 5.31 5.3 5.31 2.34 0 4.31-1.52 4.99-3.64.1-.31-.08-.63-.39-.72-.31-.1-.63.08-.72.39-.53 1.66-2.07 2.83-3.88 2.83zm3.89-6.41c-.28-.14-.62-.03-.76.25-.14.28-.03.62.25.76 1.48.74 2.39 2.22 2.39 3.84 0 2.42-1.97 4.39-4.39 4.39-2.01 0-3.73-1.37-4.22-3.32-.08-.3-.38-.49-.69-.41-.3.08-.49.38-.41.69.63 2.47 2.8 4.2 5.32 4.2 3.06 0 5.55-2.49 5.55-5.55 0-2.05-1.15-3.93-3.04-4.85z"/>
      </svg>
    );
  }

  if (norm.includes("microsoft")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" rx="1.5" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" rx="1.5" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" rx="1.5" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" rx="1.5" />
      </svg>
    );
  }

  if (norm.includes("tesla")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#E82127" className="shrink-0">
        <path d="M12 4.88c2.6 0 5.06.66 7.22 1.83.39-.6.73-1.22 1-1.88-2.5-1.12-5.28-1.75-8.22-1.75S6.28 3.71 3.78 4.83c.27.66.61 1.28 1 1.88C6.94 5.54 9.4 4.88 12 4.88zm8.68 3.65c-.21.05-.44.1-.67.14C17.38 9.17 14.88 9.5 12 9.5s-5.38-.33-8.01-.83c-.23-.04-.46-.09-.67-.14l-.19.46c-.23.63-.42 1.28-.56 1.94 3.01.62 6.16.97 9.43.97s6.42-.35 9.43-.97c-.14-.66-.33-1.31-.56-1.94l-.19-.46zM10.8 13.5v7.5h2.4v-7.5c1.67-.12 3.3-.35 4.88-.68-.22-.65-.49-1.28-.82-1.88-1.32.24-2.68.4-4.06.46v-1.1h-2.4v1.1c-1.38-.06-2.74-.22-4.06-.46-.33.6-.6 1.23-.82 1.88 1.58.33 3.21.56 4.88.68z"/>
      </svg>
    );
  }

  if (norm.includes("amazon")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M13.9 12.1c-.2-.7-.7-1.1-1.5-1.1-.9 0-1.5.6-1.7 1.6h3.2zm-4.7 1.3c0 2 1.2 3.2 3.1 3.2 1.3 0 2.2-.5 2.8-1.3l1.1 1c-.8 1-2.1 1.7-3.9 1.7-2.9 0-4.7-1.9-4.7-4.6s1.9-4.7 4.7-4.7c2.8 0 4.4 1.8 4.4 4.4v.3H9.2z" fill="#FFF"/>
        <path d="M2.5 18.5c4.7 3.5 11.2 3.5 16.3.3.4-.2.8.2.5.6-5.1 4.5-12.7 4.2-17.3-.2-.3-.3 0-.9.5-.7z" fill="#FF9900"/>
        <path d="M19.3 17.5c.3.5.7 1.2 1.2 1.6.2.2.4.1.3-.2-.3-.8-.7-1.8-.7-2.3 0-.2-.1-.3-.3-.2-.5.3-1.4.6-2.1.8-.3.1-.2.4.1.4.6 0 1.2-.1 1.5-.1z" fill="#FF9900"/>
      </svg>
    );
  }

  if (norm.includes("google") || norm.includes("alphabet")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
    );
  }

  if (norm.includes("meta")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0668E1" className="shrink-0">
        <path d="M12 6.5c-2.4 0-4.4 1.4-5.6 3.4C5 8 3.5 7 2 7c-1.1 0-2 .9-2 2 0 4.1 3.5 8.5 7.5 8.5 2.5 0 4.2-1.6 5.5-3.5 1.3 1.9 3 3.5 5.5 3.5 4 0 7.5-4.4 7.5-8.5 0-1.1-.9-2-2-2-1.5 0-3 1-4.4 2.9-1.2-2-3.2-3.4-5.6-3.4zm0 2.2c1.7 0 3.2 1.3 4.2 3.1-1.3 2.1-2.6 3.7-4.2 3.7s-2.9-1.6-4.2-3.7c1-1.8 2.5-3.1 4.2-3.1z"/>
      </svg>
    );
  }

  if (norm.includes("netflix")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#E50914" className="shrink-0">
        <path d="M4 2h4v18.5l-4 1.5V2zm12 0h4v20l-4-1.5V2zm-8 0h3.5l4.5 18.2-3.5 1.3L8 2z"/>
      </svg>
    );
  }

  if (norm.includes("amd")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#00873D" className="shrink-0">
        <path d="M2 3h14v4H6v10H2V3zm16 4h4v14H8v-4h10V7zm-2 2h-4v4h4V9z"/>
      </svg>
    );
  }

  if (norm.includes("intel")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0071C5" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#0071C5" strokeWidth="2"/>
        <path d="M7 9h2v6H7V9zm3.5 0h2v1.5c.3-.5.9-.8 1.5-.8 1.2 0 2 .9 2 2.2V15h-2v-2.8c0-.6-.4-1-.9-1-.5 0-.9.4-.9 1V15h-2V9zm-3.5-3h2v2H7V6z" fill="#0071C5"/>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" className="shrink-0">
      <circle cx="12" cy="12" r="10" fill="#222" />
      <text x="12" y="15" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">
        {name.slice(0, 3)}
      </text>
    </svg>
  );
}

/* ─── Crypto Gold Icon ───────────────────────────────────────────────────── */
function CryptoIdxLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <defs>
        <linearGradient id="crypto-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#crypto-gold-grad)" />
      <path
        d="M20.2 13.4c.4-2.6-1.6-4-4.3-4.9l.9-3.5-2.1-.5-.9 3.4c-.6-.1-1.1-.3-1.7-.4l.9-3.5-2.1-.5-.9 3.5c-.5-.1-.9-.2-1.4-.3l-2.9-.7-.6 2.3s1.6.4 1.5.4c.9.2 1 .7.8 1.1l-2 8.1c-.1.3-.4.8-1 .6 0 0-1.5-.4-1.5-.4l-1 2.5 2.8.7c.5.1 1 .3 1.5.4l-.9 3.7 2.1.5.9-3.6c.6.2 1.2.3 1.7.4l-.9 3.6 2.1.5.9-3.6c3.6.7 6.3.4 7.4-2.9.9-2.6 0-4.1-1.9-5.1 1.4-.3 2.4-1.2 2.7-3.1zm-4.8 6.8c-.7 2.6-5.1 1.2-6.5.9l1.2-4.6c1.4.3 6 1 5.3 3.7zm.6-6.9c-.6 2.4-4.3 1.2-5.5.9l1-4.2c1.2.3 5.1.9 4.5 3.3z"
        fill="#ffffff"
      />
      <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  );
}

/* ─── Main AssetIcon Component ───────────────────────────────────────────── */
interface AssetIconProps {
  label: string;
  size?: number;
  className?: string;
  glow?: boolean;
}

export const AssetIcon = React.memo(function AssetIcon({ label, size = 22, className = "", glow = false }: AssetIconProps) {
  // 1. Crypto IDX
  if (label.includes("Crypto IDX")) {
    return <CryptoIdxLogo size={size} />;
  }

  // 2. Company Stocks (Apple, Nvidia, Microsoft, Tesla, Amazon, Google, Meta, Netflix, AMD, Intel)
  const norm = label.toLowerCase();
  const isCompany =
    norm.includes("apple") ||
    norm.includes("nvidia") ||
    norm.includes("microsoft") ||
    norm.includes("tesla") ||
    norm.includes("amazon") ||
    norm.includes("google") ||
    norm.includes("meta") ||
    norm.includes("netflix") ||
    norm.includes("amd") ||
    norm.includes("intel");

  if (isCompany) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <CompanyLogo name={label} size={size} />
      </span>
    );
  }

  // 3. Forex Pairs (e.g. "EUR/USD (OTC)", "USD/JPY (OTC)")
  const cleaned = label.replace(/\s*\(OTC\)/i, "").trim();
  const pairParts = cleaned.split("/");
  if (pairParts.length === 2) {
    const base = pairParts[0].trim().toUpperCase();
    const quote = pairParts[1].trim().toUpperCase();

    // Render clean overlapping dual-circle flags without any background badge or border
    const singleSize = Math.round(size * 0.78);
    const overlap = Math.round(singleSize * 0.42);

    return (
      <span
        className={`inline-flex items-center shrink-0 select-none relative ${className}`}
        style={{
          width: singleSize + (singleSize - overlap),
          height: size,
        }}
      >
        {/* Base Currency Flag (left, upper z-index) */}
        <span className="relative z-10 shrink-0">
          <FlagCircle code={base} size={singleSize} />
        </span>
        {/* Quote Currency Flag (right, slightly overlapping) */}
        <span
          className="relative z-0 shrink-0"
          style={{ marginLeft: -overlap }}
        >
          <FlagCircle code={quote} size={singleSize} />
        </span>
      </span>
    );
  }

  // 4. Fallback to existing image if mapped, without background badge
  const iconSrc = getAssetIcon(label);
  if (iconSrc) {
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
          className={`w-full h-full object-contain pointer-events-none ${
            glow ? "drop-shadow-[0_2px_6px_rgba(255,255,255,0.25)]" : ""
          }`}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  // Final fallback
  return <FlagCircle code={label.slice(0, 3)} size={size} />;
});
