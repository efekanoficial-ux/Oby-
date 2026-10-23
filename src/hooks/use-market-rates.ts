import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DEFAULT_USD_TRY,
  DEFAULT_CRYPTO_USD,
  calculateCryptoAmount,
  formatCryptoAmount,
  type CryptoCalculationResult,
} from "@/lib/market-rates";

interface MarketRatesState {
  usdTry: number;
  cryptoPrices: Record<string, number>;
  cryptoPricesTRY: Record<string, number>;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

let globalRatesCache: MarketRatesState = {
  usdTry: DEFAULT_USD_TRY,
  cryptoPrices: { ...DEFAULT_CRYPTO_USD },
  cryptoPricesTRY: Object.fromEntries(
    Object.entries(DEFAULT_CRYPTO_USD).map(([k, v]) => [k, v * DEFAULT_USD_TRY])
  ),
  lastUpdated: Date.now(),
  isLoading: false,
  error: null,
};

const listeners = new Set<(state: MarketRatesState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(globalRatesCache));
}

async function fetchRates() {
  try {
    const res = await fetch("/api/market/rates", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.usdTry === "number" && data.usdTry > 10) {
        globalRatesCache = {
          usdTry: data.usdTry,
          cryptoPrices: { ...DEFAULT_CRYPTO_USD, ...data.cryptoPrices },
          cryptoPricesTRY: data.cryptoPricesTRY || {},
          lastUpdated: data.timestamp || Date.now(),
          isLoading: false,
          error: null,
        };
        notifyListeners();
        return;
      }
    }
  } catch {
    // If backend proxy fails, try direct Binance public ticker as fallback
    try {
      const symbols = encodeURIComponent(
        JSON.stringify([
          "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
          "DOGEUSDT", "TONUSDT", "SHIBUSDT", "PEPEUSDT", "AVAXUSDT",
          "LTCUSDT", "TRXUSDT", "USDTTRY"
        ])
      );
      const directRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`);
      if (directRes.ok) {
        const arr = await directRes.json();
        let usdTry = globalRatesCache.usdTry || DEFAULT_USD_TRY;
        const prices: Record<string, number> = { ...globalRatesCache.cryptoPrices };

        const map: Record<string, string> = {
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

        for (const item of arr) {
          if (item.symbol === "USDTTRY") {
            const p = parseFloat(item.price);
            if (!isNaN(p) && p > 10) usdTry = p;
          } else if (map[item.symbol]) {
            const p = parseFloat(item.price);
            if (!isNaN(p) && p > 0) prices[map[item.symbol]] = p;
          }
        }

        prices["USDT"] = 1.0;
        prices["USDC"] = 1.0;

        const pricesTRY: Record<string, number> = {};
        for (const [coin, usd] of Object.entries(prices)) {
          pricesTRY[coin] = usd * usdTry;
        }

        globalRatesCache = {
          usdTry: Math.round(usdTry * 100) / 100,
          cryptoPrices: prices,
          cryptoPricesTRY: pricesTRY,
          lastUpdated: Date.now(),
          isLoading: false,
          error: null,
        };
        notifyListeners();
        return;
      }
    } catch {
      // ignore
    }
  }
}

// Global polling interval
let isPollingStarted = false;
function startGlobalPolling() {
  if (isPollingStarted || typeof window === "undefined") return;
  isPollingStarted = true;
  fetchRates();
  setInterval(fetchRates, 15_000); // Poll every 15 seconds
}

export function useMarketRates() {
  const [rates, setRates] = useState<MarketRatesState>(globalRatesCache);

  useEffect(() => {
    startGlobalPolling();
    listeners.add(setRates);
    // Initial fetch if cache is older than 10s
    if (Date.now() - globalRatesCache.lastUpdated > 10_000) {
      fetchRates();
    }
    return () => {
      listeners.delete(setRates);
    };
  }, []);

  const getCoinPriceUSD = useCallback(
    (coin: string): number => {
      const sym = (coin || "USDT").toUpperCase();
      return rates.cryptoPrices[sym] ?? DEFAULT_CRYPTO_USD[sym] ?? 1.0;
    },
    [rates.cryptoPrices]
  );

  const getCoinPriceTRY = useCallback(
    (coin: string): number => {
      const sym = (coin || "USDT").toUpperCase();
      return (rates.cryptoPricesTRY[sym] ?? getCoinPriceUSD(sym) * rates.usdTry);
    },
    [rates.cryptoPricesTRY, rates.usdTry, getCoinPriceUSD]
  );

  const getCalculatedCrypto = useCallback(
    (amountNum: number, coin: string, isTL: boolean): CryptoCalculationResult => {
      return calculateCryptoAmount({
        amount: amountNum,
        isTL,
        coin,
        usdTryRate: rates.usdTry,
        cryptoPrices: rates.cryptoPrices,
      });
    },
    [rates.usdTry, rates.cryptoPrices]
  );

  return {
    usdTryRate: rates.usdTry,
    cryptoPrices: rates.cryptoPrices,
    cryptoPricesTRY: rates.cryptoPricesTRY,
    lastUpdated: rates.lastUpdated,
    isLoading: rates.isLoading,
    refreshRates: fetchRates,
    getCoinPriceUSD,
    getCoinPriceTRY,
    getCalculatedCrypto,
    formatCryptoAmount,
  };
}
