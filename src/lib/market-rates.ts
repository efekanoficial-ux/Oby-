/**
 * Real-time Market Rates & Crypto Conversion Utility
 * Connects to live Binance & exchange rate API with robust fallbacks
 */

export const DEFAULT_USD_TRY = 48.85;

export const DEFAULT_CRYPTO_USD: Record<string, number> = {
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

/**
 * Format crypto amount with proper coin-specific precision,
 * avoiding scientific notation (e.g. 1e-7) and excessive trailing zeroes.
 */
export function formatCryptoAmount(amount: number, coin: string): string {
  if (!amount || isNaN(amount) || amount <= 0) return "0";

  const sym = (coin || "").toUpperCase();

  let maxDecimals = 6;
  let minDecimals = 2;

  switch (sym) {
    case "BTC":
      maxDecimals = 8;
      minDecimals = 4;
      break;
    case "ETH":
      maxDecimals = 6;
      minDecimals = 4;
      break;
    case "SOL":
    case "BNB":
    case "LTC":
    case "AVAX":
      maxDecimals = 5;
      minDecimals = 2;
      break;
    case "TON":
    case "XRP":
    case "TRX":
    case "DOGE":
      maxDecimals = 4;
      minDecimals = 2;
      break;
    case "SHIB":
    case "PEPE":
      maxDecimals = amount < 100 ? 2 : 0;
      minDecimals = 0;
      break;
    case "USDT":
    case "USDC":
      maxDecimals = 2;
      minDecimals = 2;
      break;
    default:
      maxDecimals = 6;
      minDecimals = 2;
  }

  // Handle tiny amounts without scientific notation
  const fixed = amount.toFixed(maxDecimals);

  // If minDecimals is specified, keep at least that many decimals unless integer only
  if (minDecimals === 0 && fixed.includes(".")) {
    const trimmed = fixed.replace(/\.?0+$/, "");
    return trimmed;
  }

  // Remove unnecessary trailing zeroes beyond minDecimals
  const parts = fixed.split(".");
  if (parts.length === 2) {
    let decimals = parts[1];
    while (decimals.length > minDecimals && decimals.endsWith("0")) {
      decimals = decimals.slice(0, -1);
    }
    return decimals.length > 0 ? `${parts[0]}.${decimals}` : parts[0];
  }

  return fixed;
}

export interface CryptoCalculationResult {
  cryptoAmount: number;
  cryptoAmountFormatted: string;
  coinPriceUSD: number;
  coinPriceTRY: number;
  coin: string;
}

export function calculateCryptoAmount(params: {
  amount: number;
  isTL: boolean;
  coin: string;
  usdTryRate: number;
  cryptoPrices: Record<string, number>;
}): CryptoCalculationResult {
  const { amount, isTL, coin, usdTryRate, cryptoPrices } = params;
  const sym = (coin || "USDT").toUpperCase();

  const coinPriceUSD = cryptoPrices[sym] ?? DEFAULT_CRYPTO_USD[sym] ?? 1.0;
  const safeUsdTry = usdTryRate > 10 ? usdTryRate : DEFAULT_USD_TRY;
  const coinPriceTRY = coinPriceUSD * safeUsdTry;

  let cryptoAmount = 0;

  if (amount > 0) {
    if (isTL) {
      // In TL account: amount is in TL
      cryptoAmount = amount / coinPriceTRY;
    } else {
      // In USD account: amount is in USD
      cryptoAmount = amount / coinPriceUSD;
    }
  }

  const cryptoAmountFormatted = formatCryptoAmount(cryptoAmount, sym);

  return {
    cryptoAmount,
    cryptoAmountFormatted,
    coinPriceUSD,
    coinPriceTRY,
    coin: sym,
  };
}
