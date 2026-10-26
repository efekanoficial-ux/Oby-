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
}

/**
 * All assets defined in the platform.
 * Must match src/lib/assets.ts
 */
export const ASSETS: AssetConfig[] = [
  { symbol: "EUR/USD (OTC)", base: 1.0850, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "GBP/USD (OTC)", base: 1.2650, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "USD/JPY (OTC)", base: 150.20, vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "USD/CAD (OTC)", base: 1.3550, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "AUD/USD (OTC)", base: 0.6600, vol: 0.00010, revert: 0.0010, digits: 5 },
  { symbol: "USD/CHF (OTC)", base: 0.8850, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "NZD/USD (OTC)", base: 0.6050, vol: 0.00010, revert: 0.0010, digits: 5 },
  { symbol: "EUR/GBP (OTC)", base: 0.8580, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "EUR/JPY (OTC)", base: 163.00, vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "GBP/JPY (OTC)", base: 190.00, vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "AUD/CAD (OTC)", base: 0.9900, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "AUD/CHF (OTC)", base: 0.5520, vol: 0.00003, revert: 0.0010, digits: 5 },
  { symbol: "AUD/JPY (OTC)", base: 97.20,  vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "AUD/NZD (OTC)", base: 1.0820, vol: 0.00008, revert: 0.0012, digits: 5 },
  { symbol: "CAD/CHF (OTC)", base: 0.6080, vol: 0.00010, revert: 0.0010, digits: 5 },
];

export const ASSET_BY_SYMBOL: Map<string, AssetConfig> = new Map();
for (const a of ASSETS) {
  ASSET_BY_SYMBOL.set(a.symbol, a);
  const stripped = a.symbol.replace(/\s*\(OTC\)/i, "").trim();
  if (!ASSET_BY_SYMBOL.has(stripped)) {
    ASSET_BY_SYMBOL.set(stripped, a);
  }
}
