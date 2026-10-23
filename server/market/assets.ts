export interface AssetConfig {
  /** Display symbol, also the WS subscription key, e.g. "AUD/CAD". */
  symbol: string;
  /** Realistic anchor price the random walk mean-reverts toward. */
  base: number;
  /** Per-tick relative volatility (fraction of price). */
  vol: number;
  /** Mean-reversion strength toward `base` per tick. */
  revert: number;
  /** Decimal places for rounding ticks/candles. */
  digits: number;
  /**
   * Binance trade stream symbol for best-effort real data anchoring.
   * Only set for assets that have a genuine live feed (crypto).
   */
  binance?: string;
  /** Whether this instrument tracks live real-world market feeds (forex/ticks) */
  isRealFeed?: boolean;
}

/**
 * The only 13 instruments the platform trades.
 */
export const ASSETS: AssetConfig[] = [
  { symbol: "Crypto IDX",         base: 6850.25, vol: 0.00030, revert: 0.0008, digits: 2 },
  { symbol: "AUD/CAD (OTC)",      base: 0.9900,  vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "AUD/CHF (OTC)",      base: 0.5520,  vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "AUD/DKK (OTC)",      base: 4.4200,  vol: 0.00009, revert: 0.0010, digits: 4 },
  { symbol: "AUD/HUF (OTC)",      base: 233.50,  vol: 0.00011, revert: 0.0010, digits: 3 },
  { symbol: "AUD/JPY (OTC)",      base: 97.20,   vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "AUD/NOK (OTC)",      base: 6.9300,  vol: 0.00012, revert: 0.0010, digits: 4 },
  { symbol: "AUD/NZD (OTC)",      base: 1.0820,  vol: 0.00008, revert: 0.0012, digits: 5 },
  { symbol: "AUD/SEK (OTC)",      base: 6.9100,  vol: 0.00012, revert: 0.0010, digits: 4 },
  { symbol: "AUD/SGD (OTC)",      base: 0.8650,  vol: 0.00009, revert: 0.0010, digits: 5 },
  { symbol: "AUD/USD (OTC)",      base: 0.6600,  vol: 0.00010, revert: 0.0010, digits: 5 },
  { symbol: "AUD/ZAR (OTC)",      base: 12.050,  vol: 0.00016, revert: 0.0009, digits: 4 },
  { symbol: "CAD/CHF (OTC)",      base: 0.6080,  vol: 0.00010, revert: 0.0010, digits: 5 },
];

export const ASSET_BY_SYMBOL: Map<string, AssetConfig> = new Map();
for (const a of ASSETS) {
  ASSET_BY_SYMBOL.set(a.symbol, a);
  const stripped = a.symbol.replace(/\s*\(OTC\)/i, "").trim();
  if (!ASSET_BY_SYMBOL.has(stripped)) {
    ASSET_BY_SYMBOL.set(stripped, a);
  }
}
