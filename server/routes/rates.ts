import { Router, type Request, type Response } from "express";

const router = Router();

// In-memory cache for live rates
interface CachedRates {
  timestamp: number;
  usdTry: number;
  cryptoPrices: Record<string, number>;
  cryptoPricesTRY: Record<string, number>;
}

const FALLBACK_USD_TRY = 48.85;

const FALLBACK_CRYPTO_USD: Record<string, number> = {
  USDT: 1.0,
  USDC: 1.0,
  BTC: 81590,
  ETH: 2395,
  SOL: 104,
  BNB: 745,
  XRP: 1.32,
  DOGE: 0.08,
  TON: 1.60,
  SHIB: 0.00000505,
  PEPE: 0.00000492,
  AVAX: 9.18,
  LTC: 58.90,
  TRX: 0.33,
};

let cache: CachedRates | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

const SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
  XRPUSDT: "XRP",
  DOGEUSDT: "DOGE",
  TONUSDT: "TON",
  SHIBUSDT: "SHIB",
  PEPEUSDT: "PEPE",
  AVAXUSDT: "AVAX",
  LTCUSDT: "LTC",
  TRXUSDT: "TRX",
};

async function fetchLiveRates(): Promise<CachedRates> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache;
  }

  const cryptoPrices: Record<string, number> = { ...FALLBACK_CRYPTO_USD };
  let usdTry = cache?.usdTry || FALLBACK_USD_TRY;

  // 1. Fetch Binance live ticker prices
  try {
    const symbolsParam = encodeURIComponent(
      JSON.stringify([...Object.keys(SYMBOL_MAP), "USDTTRY"])
    );
    const resp = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(3500) }
    );

    if (resp.ok) {
      const data: Array<{ symbol: string; price: string }> = await resp.json();
      for (const item of data) {
        if (item.symbol === "USDTTRY") {
          const p = parseFloat(item.price);
          if (!isNaN(p) && p > 30) {
            usdTry = p;
          }
        } else if (SYMBOL_MAP[item.symbol]) {
          const coin = SYMBOL_MAP[item.symbol];
          const p = parseFloat(item.price);
          if (!isNaN(p) && p > 0) {
            cryptoPrices[coin] = p;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Rates] Binance fetch error, using fallbacks:", err);
  }

  // 2. Fallback check for fiat USD/TRY if Binance USDTTRY didn't respond
  if (usdTry === FALLBACK_USD_TRY) {
    try {
      const fiatResp = await fetch("https://open.er-api.com/v6/latest/USD", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      if (fiatResp.ok) {
        const fiatData = await fiatResp.json();
        const tryRate = fiatData?.rates?.TRY;
        if (typeof tryRate === "number" && tryRate > 30) {
          usdTry = tryRate;
        }
      }
    } catch {
      // ignore
    }
  }

  // Ensure USDT & USDC are pegged to 1 USD
  cryptoPrices["USDT"] = 1.0;
  cryptoPrices["USDC"] = 1.0;

  // Calculate TRY prices for all cryptos
  const cryptoPricesTRY: Record<string, number> = {};
  for (const [coin, priceUSD] of Object.entries(cryptoPrices)) {
    cryptoPricesTRY[coin] = priceUSD * usdTry;
  }

  const result: CachedRates = {
    timestamp: now,
    usdTry: Math.round(usdTry * 100) / 100,
    cryptoPrices,
    cryptoPricesTRY,
  };

  cache = result;
  return result;
}

router.get("/market/rates", async (_req: Request, res: Response) => {
  try {
    const rates = await fetchLiveRates();
    res.json({
      success: true,
      timestamp: rates.timestamp,
      usdTry: rates.usdTry,
      cryptoPrices: rates.cryptoPrices,
      cryptoPricesTRY: rates.cryptoPricesTRY,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to fetch live market rates",
      usdTry: FALLBACK_USD_TRY,
      cryptoPrices: FALLBACK_CRYPTO_USD,
    });
  }
});

export default router;
