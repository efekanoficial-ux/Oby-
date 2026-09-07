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
}

/**
 * The only 13 instruments the platform trades. All pairs run on the OTC
 * random-walk engine anchored to realistic market rates and continuous history.
 */
export const ASSETS: AssetConfig[] = [
  { symbol: "Crypto IDX",         base: 6850.25, vol: 0.00030, revert: 0.0008, digits: 2 },
  { symbol: "AUD/CAD",            base: 0.9080,  vol: 0.00010, revert: 0.0010, digits: 5 },
  { symbol: "AUD/CHF",            base: 0.5520,  vol: 0.00011, revert: 0.0010, digits: 5 },
  { symbol: "AUD/DKK",            base: 4.4200,  vol: 0.00009, revert: 0.0010, digits: 4 },
  { symbol: "AUD/HUF",            base: 233.50,  vol: 0.00011, revert: 0.0010, digits: 3 },
  { symbol: "AUD/JPY",            base: 97.20,   vol: 0.00012, revert: 0.0010, digits: 3 },
  { symbol: "AUD/NOK",            base: 6.9300,  vol: 0.00012, revert: 0.0010, digits: 4 },
  { symbol: "AUD/NZD",            base: 1.0820,  vol: 0.00008, revert: 0.0012, digits: 5 },
  { symbol: "AUD/SEK",            base: 6.9100,  vol: 0.00012, revert: 0.0010, digits: 4 },
  { symbol: "AUD/SGD",            base: 0.8650,  vol: 0.00009, revert: 0.0010, digits: 5 },
  { symbol: "AUD/USD",            base: 0.6600,  vol: 0.00010, revert: 0.0010, digits: 5 },
  { symbol: "AUD/ZAR",            base: 12.050,  vol: 0.00016, revert: 0.0009, digits: 4 },
  { symbol: "Bitcoin Cash (OTC)", base: 450.00,  vol: 0.00035, revert: 0.0008, digits: 2 },
  { symbol: "CAD/CHF",            base: 0.6080,  vol: 0.00010, revert: 0.0010, digits: 5 },
];

export const ASSET_BY_SYMBOL: Map<string, AssetConfig> = new Map(
  ASSETS.map((a) => [a.symbol, a]),
);
