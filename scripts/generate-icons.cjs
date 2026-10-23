const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function renderSvgToPng(svgString, filename, size = 128) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: size,
    },
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(path.join(OUT_DIR, filename), pngBuffer);
  console.log(`Generated: ${filename} (${pngBuffer.length} bytes)`);
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. CRYPTO IDX: Clean, Matte Official Bitcoin Emblem (Solid, No Neon, No Glow)
   ───────────────────────────────────────────────────────────────────────────── */
function getCryptoIdxSvg() {
  return `
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid Matte Bitcoin Coin Face - Crisp, clean, no neon bloom, no outer glow -->
  <circle cx="64" cy="64" r="56" fill="#F7931A" />
  
  <!-- Subtle natural border rim -->
  <circle cx="64" cy="64" r="56" stroke="#DE7D07" stroke-width="2" />

  <!-- Classic Crisp White Bitcoin B Symbol (Tilted ~14deg Clockwise) -->
  <g transform="translate(64,64) rotate(14) scale(3.55) translate(-15.5,-16)">
    <!-- Vertical Serifs -->
    <path d="M14 6.5V8.5M17.5 6.5V8.5M14 23.5V25.5M17.5 23.5V25.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
    <!-- B Spine & Dual Lobes -->
    <path d="M11.5 8.5H16.2C17.8 8.5 19.1 9.6 19.1 11.1C19.1 12.2 18.3 13.1 17.2 13.5C18.6 13.9 19.5 15 19.5 16.5C19.5 18.2 18 19.5 16.2 19.5H11.5V8.5ZM13.8 10.4V12.8H15.8C16.5 12.8 17.1 12.3 17.1 11.6C17.1 10.9 16.5 10.4 15.8 10.4H13.8ZM13.8 15V17.6H16.1C16.8 17.6 17.4 17 17.4 16.3C17.4 15.6 16.8 15 16.1 15H13.8Z" fill="#FFFFFF" />
  </g>
</svg>
`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. FLAG DISCS DEFINITIONS FOR FOREX (Larger 39px radius discs)
   ───────────────────────────────────────────────────────────────────────────── */

function flagAustralia(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#00247D" />
    
    <!-- Stylized Union Jack Canton in top-left quarter -->
    <g transform="translate(${cx - r}, ${cy - r}) scale(${r/40})">
      <rect x="0" y="0" width="40" height="25" fill="#00247D" />
      <line x1="0" y1="0" x2="40" y2="25" stroke="#FFFFFF" stroke-width="5" />
      <line x1="40" y1="0" x2="0" y2="25" stroke="#FFFFFF" stroke-width="5" />
      <line x1="0" y1="0" x2="40" y2="25" stroke="#CC142B" stroke-width="2.5" />
      <line x1="40" y1="0" x2="0" y2="25" stroke="#CC142B" stroke-width="2.5" />
      <rect x="16" y="0" width="8" height="25" fill="#FFFFFF" />
      <rect x="0" y="8" width="40" height="9" fill="#FFFFFF" />
      <rect x="18" y="0" width="4" height="25" fill="#CC142B" />
      <rect x="0" y="10" width="40" height="5" fill="#CC142B" />
    </g>

    <!-- Southern Cross Stars -->
    <g fill="#FFFFFF">
      <circle cx="${cx + r*0.42}" cy="${cy - r*0.45}" r="${r*0.09}" />
      <circle cx="${cx + r*0.65}" cy="${cy - r*0.08}" r="${r*0.09}" />
      <circle cx="${cx + r*0.42}" cy="${cy + r*0.45}" r="${r*0.09}" />
      <circle cx="${cx + r*0.18}" cy="${cy - r*0.15}" r="${r*0.09}" />
      <circle cx="${cx + r*0.5}" cy="${cy + r*0.16}" r="${r*0.06}" />
      <!-- Commonwealth Star -->
      <circle cx="${cx - r*0.42}" cy="${cy + r*0.36}" r="${r*0.18}" />
    </g>
  </g>
  `;
}

function flagCanada(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" />
    <rect x="${cx - r}" y="${cy - r}" width="${r * 0.52}" height="${r * 2}" fill="#D52B1E" />
    <rect x="${cx + r * 0.48}" y="${cy - r}" width="${r * 0.52}" height="${r * 2}" fill="#D52B1E" />
    <!-- Maple Leaf in center -->
    <g transform="translate(${cx}, ${cy}) scale(${r/36})" fill="#D52B1E">
      <path d="M0,-24 L3,-15 L12,-17 L10,-10 L19,-7 L14,2 L18,7 L10,8 L8,18 L2,16 L2,24 L-2,24 L-2,16 L-8,18 L-10,8 L-18,7 L-14,2 L-19,-7 L-10,-10 L-12,-17 L-3,-15 Z" />
    </g>
  </g>
  `;
}

function flagSwitzerland(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#D52B1E" />
    <!-- Swiss White Cross -->
    <rect x="${cx - r*0.22}" y="${cy - r*0.62}" width="${r*0.44}" height="${r*1.24}" rx="${r*0.05}" fill="#FFFFFF" />
    <rect x="${cx - r*0.62}" y="${cy - r*0.22}" width="${r*1.24}" height="${r*0.44}" rx="${r*0.05}" fill="#FFFFFF" />
  </g>
  `;
}

function flagDenmark(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#C8102E" />
    <!-- Dannebrog White Cross -->
    <rect x="${cx - r*0.26}" y="${cy - r}" width="${r*0.32}" height="${r*2}" fill="#FFFFFF" />
    <rect x="${cx - r}" y="${cy - r*0.16}" width="${r*2}" height="${r*0.32}" fill="#FFFFFF" />
  </g>
  `;
}

function flagHungary(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <rect x="${cx - r}" y="${cy - r}" width="${r*2}" height="${r*0.67}" fill="#CE2939" />
    <rect x="${cx - r}" y="${cy - r*0.33}" width="${r*2}" height="${r*0.66}" fill="#FFFFFF" />
    <rect x="${cx - r}" y="${cy + r*0.33}" width="${r*2}" height="${r*0.67}" fill="#477050" />
  </g>
  `;
}

function flagJapan(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" />
    <circle cx="${cx}" cy="${cy}" r="${r * 0.54}" fill="#BC002D" />
  </g>
  `;
}

function flagNorway(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#EF2B2D" />
    <!-- White Border Cross -->
    <rect x="${cx - r*0.3}" y="${cy - r}" width="${r*0.46}" height="${r*2}" fill="#FFFFFF" />
    <rect x="${cx - r}" y="${cy - r*0.23}" width="${r*2}" height="${r*0.46}" fill="#FFFFFF" />
    <!-- Blue Inner Cross -->
    <rect x="${cx - r*0.2}" y="${cy - r}" width="${r*0.26}" height="${r*2}" fill="#00205B" />
    <rect x="${cx - r}" y="${cy - r*0.13}" width="${r*2}" height="${r*0.26}" fill="#00205B" />
  </g>
  `;
}

function flagNewZealand(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#00247D" />
    <!-- Stylized Union Jack in canton -->
    <g transform="translate(${cx - r}, ${cy - r}) scale(${r/40})">
      <rect x="0" y="0" width="40" height="25" fill="#00247D" />
      <line x1="0" y1="0" x2="40" y2="25" stroke="#FFFFFF" stroke-width="4.5" />
      <line x1="40" y1="0" x2="0" y2="25" stroke="#FFFFFF" stroke-width="4.5" />
      <line x1="0" y1="0" x2="40" y2="25" stroke="#CC142B" stroke-width="2.5" />
      <line x1="40" y1="0" x2="0" y2="25" stroke="#CC142B" stroke-width="2.5" />
      <rect x="16" y="0" width="8" height="25" fill="#FFFFFF" />
      <rect x="0" y="8" width="40" height="9" fill="#FFFFFF" />
      <rect x="18" y="0" width="4" height="25" fill="#CC142B" />
      <rect x="0" y="10" width="40" height="5" fill="#CC142B" />
    </g>
    <!-- 4 Red Stars with White Borders -->
    <g stroke="#FFFFFF" stroke-width="2" fill="#CC142B">
      <circle cx="${cx + r*0.42}" cy="${cy - r*0.42}" r="${r*0.11}" />
      <circle cx="${cx + r*0.64}" cy="${cy - r*0.05}" r="${r*0.1}" />
      <circle cx="${cx + r*0.42}" cy="${cy + r*0.45}" r="${r*0.12}" />
      <circle cx="${cx + r*0.18}" cy="${cy - r*0.08}" r="${r*0.1}" />
    </g>
  </g>
  `;
}

function flagSweden(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#006AA7" />
    <!-- Yellow Cross -->
    <rect x="${cx - r*0.28}" y="${cy - r}" width="${r*0.36}" height="${r*2}" fill="#FECC00" />
    <rect x="${cx - r}" y="${cy - r*0.18}" width="${r*2}" height="${r*0.36}" fill="#FECC00" />
  </g>
  `;
}

function flagSingapore(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <rect x="${cx - r}" y="${cy - r}" width="${r*2}" height="${r}" fill="#ED2939" />
    <rect x="${cx - r}" y="${cy}" width="${r*2}" height="${r}" fill="#FFFFFF" />
    <!-- Crescent & 5 Stars in canton -->
    <g transform="translate(${cx - r*0.35}, ${cy - r*0.5}) scale(${r/40})" fill="#FFFFFF">
      <path d="M-6,0 A8,8 0 1,0 6,0 A6.5,6.5 0 1,1 -6,0 Z" />
      <circle cx="5" cy="-4" r="1.4" />
      <circle cx="8" cy="-1" r="1.4" />
      <circle cx="7" cy="3" r="1.4" />
      <circle cx="3" cy="5" r="1.4" />
      <circle cx="2" cy="0" r="1.4" />
    </g>
  </g>
  `;
}

function flagUSA(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <rect x="${cx - r}" y="${cy - r}" width="${r*2}" height="${r*2}" fill="#FFFFFF" />
    ${[0, 2, 4, 6, 8, 10, 12].map(i => `
      <rect x="${cx - r}" y="${cy - r + (i * r*2 / 13)}" width="${r*2}" height="${r*2 / 13}" fill="#B22234" />
    `).join('')}
    <!-- Blue Canton -->
    <rect x="${cx - r}" y="${cy - r}" width="${r*1.1}" height="${r*1.05}" fill="#0A3161" />
    <!-- White Stars in Canton -->
    <g fill="#FFFFFF">
      <circle cx="${cx - r*0.75}" cy="${cy - r*0.75}" r="${r*0.06}" />
      <circle cx="${cx - r*0.45}" cy="${cy - r*0.75}" r="${r*0.06}" />
      <circle cx="${cx - r*0.15}" cy="${cy - r*0.75}" r="${r*0.06}" />
      <circle cx="${cx - r*0.60}" cy="${cy - r*0.50}" r="${r*0.06}" />
      <circle cx="${cx - r*0.30}" cy="${cy - r*0.50}" r="${r*0.06}" />
      <circle cx="${cx - r*0.75}" cy="${cy - r*0.25}" r="${r*0.06}" />
      <circle cx="${cx - r*0.45}" cy="${cy - r*0.25}" r="${r*0.06}" />
      <circle cx="${cx - r*0.15}" cy="${cy - r*0.25}" r="${r*0.06}" />
    </g>
  </g>
  `;
}

function flagSouthAfrica(cx, cy, r, id) {
  return `
  <g clip-path="url(#${id})">
    <rect x="${cx - r}" y="${cy - r}" width="${r*2}" height="${r}" fill="#DE3831" />
    <rect x="${cx - r}" y="${cy}" width="${r*2}" height="${r}" fill="#001489" />
    <polygon points="${cx - r},${cy - r} ${cx - r*0.2},${cy} ${cx - r},${cy + r}" fill="#000000" />
    <polygon points="${cx - r*0.8},${cy - r} ${cx},${cy} ${cx - r*0.8},${cy + r}" stroke="#FFB800" stroke-width="${r*0.14}" fill="none" />
    <polygon points="${cx - r},${cy - r*0.5} ${cx - r*0.1},${cy} ${cx + r},${cy} ${cx + r},${cy - r*0.3} ${cx},${cy - r*0.3}" fill="#007749" stroke="#FFFFFF" stroke-width="${r*0.1}" />
    <polygon points="${cx - r},${cy + r*0.5} ${cx - r*0.1},${cy} ${cx + r},${cy} ${cx + r},${cy + r*0.3} ${cx},${cy + r*0.3}" fill="#007749" stroke="#FFFFFF" stroke-width="${r*0.1}" />
  </g>
  `;
}

const FLAG_RENDERERS = {
  AUD: flagAustralia,
  CAD: flagCanada,
  CHF: flagSwitzerland,
  DKK: flagDenmark,
  HUF: flagHungary,
  JPY: flagJapan,
  NOK: flagNorway,
  NZD: flagNewZealand,
  SEK: flagSweden,
  SGD: flagSingapore,
  USD: flagUSA,
  ZAR: flagSouthAfrica,
};

/* ─────────────────────────────────────────────────────────────────────────────
   4. DUAL-COIN FOREX SVG BUILDER (Radius = 39, Perfectly Balanced)
   ───────────────────────────────────────────────────────────────────────────── */
function getDualCoinForexSvg(baseCode, quoteCode) {
  const baseFn = FLAG_RENDERERS[baseCode];
  const quoteFn = FLAG_RENDERERS[quoteCode];

  // Base disc on left/top: cx=44, cy=64, radius=38.5
  // Quote disc on right/bottom: cx=84, cy=64, radius=38.5
  return `
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="clipQuote">
      <circle cx="84" cy="64" r="38.5" />
    </clipPath>
    <clipPath id="clipBase">
      <circle cx="44" cy="64" r="38.5" />
    </clipPath>

    <!-- Metallic Rim Bevel Lighting -->
    <linearGradient id="coinBevel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
      <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
    </linearGradient>

    <!-- Specular Glass Curve Highlight -->
    <linearGradient id="glossGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>

    <!-- Radial Soft Shadow under Base Coin -->
    <radialGradient id="overlapShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
      <stop offset="65%" stopColor="#000000" stopOpacity="0.35" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
    </radialGradient>
  </defs>

  <!-- ── 1. QUOTE COIN (Right / Underneath) ── -->
  <!-- Base background shadow -->
  <circle cx="84" cy="64" r="41" fill="#000000" fill-opacity="0.45" />

  <!-- Outer metallic border -->
  <circle cx="84" cy="64" r="40" fill="#15171C" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" />

  <!-- Flag Content -->
  ${quoteFn(84, 64, 38.5, 'clipQuote')}

  <!-- Bevel Ring on Quote Coin -->
  <circle cx="84" cy="64" r="38.5" stroke="url(#coinBevel)" stroke-width="2.6" fill="none" />
  <!-- Gloss on Quote Coin -->
  <path d="M47,53 A38.5,38.5 0 0,1 121,53 A38.5,24 0 0,0 47,53 Z" fill="url(#glossGrad)" clip-path="url(#clipQuote)" />

  <!-- ── 2. SEPARATION SHADOW BETWEEN COINS ── -->
  <ellipse cx="64" cy="64" rx="16" ry="38.5" fill="url(#overlapShadow)" />

  <!-- ── 3. BASE COIN (Left / On Top) ── -->
  <!-- Drop Shadow behind Base Coin -->
  <circle cx="44" cy="64" r="41" fill="#000000" fill-opacity="0.55" />

  <!-- Outer metallic border -->
  <circle cx="44" cy="64" r="40" fill="#15171C" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />

  <!-- Flag Content -->
  ${baseFn(44, 64, 38.5, 'clipBase')}

  <!-- Bevel Ring on Base Coin -->
  <circle cx="44" cy="64" r="38.5" stroke="url(#coinBevel)" stroke-width="2.6" fill="none" />
  <!-- Gloss on Base Coin -->
  <path d="M7,53 A38.5,38.5 0 0,1 81,53 A38.5,24 0 0,0 7,53 Z" fill="url(#glossGrad)" clip-path="url(#clipBase)" />

  <!-- Micro Rim Ring separating both -->
  <circle cx="44" cy="64" r="39.2" stroke="rgba(0,0,0,0.5)" stroke-width="1.2" fill="none" />
</svg>
`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. BATCH GENERATION
   ───────────────────────────────────────────────────────────────────────────── */
function main() {
  console.log('Generating premium asset PNG icons...');

  // 1. Crypto IDX (Official Bitcoin Coin)
  renderSvgToPng(getCryptoIdxSvg(), 'crypto-idx.png', 128);

  // 2. Forex Pairs
  const FOREX_PAIRS = [
    { base: 'AUD', quote: 'CAD', file: 'aud-cad.png' },
    { base: 'AUD', quote: 'CHF', file: 'aud-chf.png' },
    { base: 'AUD', quote: 'DKK', file: 'aud-dkk.png' },
    { base: 'AUD', quote: 'HUF', file: 'aud-huf.png' },
    { base: 'AUD', quote: 'JPY', file: 'aud-jpy.png' },
    { base: 'AUD', quote: 'NOK', file: 'aud-nok.png' },
    { base: 'AUD', quote: 'NZD', file: 'aud-nzd.png' },
    { base: 'AUD', quote: 'SEK', file: 'aud-sek.png' },
    { base: 'AUD', quote: 'SGD', file: 'aud-sgd.png' },
    { base: 'AUD', quote: 'USD', file: 'aud-usd.png' },
    { base: 'AUD', quote: 'ZAR', file: 'aud-zar.png' },
    { base: 'CAD', quote: 'CHF', file: 'cad-chf.png' },
  ];

  for (const pair of FOREX_PAIRS) {
    const svg = getDualCoinForexSvg(pair.base, pair.quote);
    renderSvgToPng(svg, pair.file, 128);
  }

  console.log('All 14 asset icons generated successfully!');
}

main();
