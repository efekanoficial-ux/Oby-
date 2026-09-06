import { WebSocket } from "ws";
import { ASSETS, ASSET_BY_SYMBOL, type AssetConfig } from "./assets";
import { logger } from "../lib/logger";

/** A 5-second OHLC candle. `time` is a Unix timestamp in SECONDS. */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const CANDLE_SECS = 5;
const CANDLE_MS = CANDLE_SECS * 1000;
const DAY_SECS = 86_400;
const DAY_MS = DAY_SECS * 1000;

type Listener = (candle: Candle) => void;

function bucketStart(ms: number): number {
  return Math.floor(ms / CANDLE_MS) * CANDLE_MS;
}

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * One independent market for a single asset. Generates ticks via a
 * mean-reverting random walk (or genuine Binance trades for crypto), folds
 * them into 5-second candles, and keeps a rolling 24h in-memory history that
 * is permanently pruned as time advances.
 */
class AssetMarket {
  readonly cfg: AssetConfig;
  private price: number;
  private history: Candle[] = [];
  private live: Candle | null = null;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private binanceWs: WebSocket | null = null;
  private usingRealData = false;
  private lastRealMs = 0;
  private binanceRetryMs = 2_000;
  private binanceReconnect: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(cfg: AssetConfig) {
    this.cfg = cfg;
    this.price = cfg.base;
    this.seedHistory();
    if (cfg.binance) this.connectBinance();
    this.scheduleTick();
  }

  /** Back-generate a full 24h of 5s candles so history exists immediately. */
  private seedHistory(): void {
    const now = Date.now();
    const start = bucketStart(now - DAY_MS);
    const count = Math.floor((bucketStart(now) - start) / CANDLE_MS);
    let p = this.cfg.base;
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      const t = (start + i * CANDLE_MS) / 1000;
      const open = p;
      let high = open;
      let low = open;
      // a handful of intra-candle steps shape the wick
      for (let s = 0; s < 6; s++) {
        p = this.step(p);
        if (p > high) high = p;
        if (p < low) low = p;
      }
      candles.push({
        time: t,
        open: roundTo(open, this.cfg.digits),
        high: roundTo(high, this.cfg.digits),
        low: roundTo(low, this.cfg.digits),
        close: roundTo(p, this.cfg.digits),
      });
    }
    this.history = candles;
    this.price = p;
  }

  /** One mean-reverting random-walk step. */
  private step(p: number): number {
    const shock = (Math.random() - 0.5) * 2 * this.cfg.vol * p;
    const pull = (this.cfg.base - p) * this.cfg.revert;
    return Math.max(p * 0.5, p + shock + pull);
  }

  private scheduleTick(): void {
    const delay = 100 + Math.random() * 100; // 100-200ms
    this.timer = setTimeout(() => {
      const now = Date.now();
      // If the real feed stalls (no trades for 10s) without a clean close,
      // fall back to OTC so the market never appears frozen.
      if (this.usingRealData && now - this.lastRealMs > 10_000) {
        this.usingRealData = false;
      }
      if (!this.usingRealData) {
        this.price = this.step(this.price);
        this.applyTick(this.price, now);
      }
      this.scheduleTick();
    }, delay);
  }

  /** Fold a tick into the live 5s candle, rolling + pruning at boundaries. */
  private applyTick(rawPrice: number, ms: number): void {
    const price = roundTo(rawPrice, this.cfg.digits);
    const time = bucketStart(ms) / 1000;

    if (!this.live || time > this.live.time) {
      if (this.live) {
        this.history.push(this.live);
        this.prune(ms);
      }
      this.live = { time, open: price, high: price, low: price, close: price };
    } else if (time === this.live.time) {
      this.live.high = Math.max(this.live.high, price);
      this.live.low = Math.min(this.live.low, price);
      this.live.close = price;
    } else {
      return; // stale tick older than the current bucket
    }

    const snapshot = this.live;
    for (const fn of this.listeners) fn(snapshot);
  }

  /** Permanently drop candles older than now - 24h. */
  private prune(nowMs: number): void {
    const cutoff = (nowMs - DAY_MS) / 1000;
    let drop = 0;
    while (drop < this.history.length && this.history[drop].time < cutoff) drop++;
    if (drop > 0) this.history.splice(0, drop);
  }

  /** Schedule a Binance reconnect with capped exponential backoff. */
  private scheduleBinanceReconnect(): void {
    if (this.stopped || this.binanceReconnect) return;
    this.binanceReconnect = setTimeout(() => {
      this.binanceReconnect = null;
      this.connectBinance();
    }, this.binanceRetryMs);
    this.binanceRetryMs = Math.min(this.binanceRetryMs * 2, 60_000);
  }

  /** Best-effort real Bitcoin Cash data; silently falls back to OTC. */
  private connectBinance(): void {
    const sym = this.cfg.binance;
    if (!sym || this.stopped) return;
    try {
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${sym.toLowerCase()}@trade`,
      );
      this.binanceWs = ws;
      ws.on("message", (data: Buffer) => {
        try {
          const t = JSON.parse(data.toString());
          const px = parseFloat(t.p);
          if (!Number.isFinite(px)) return;
          this.usingRealData = true;
          this.lastRealMs = Date.now();
          this.binanceRetryMs = 2_000; // healthy feed → reset backoff
          this.price = px;
          this.applyTick(px, this.lastRealMs);
        } catch {
          /* ignore malformed frame */
        }
      });
      ws.on("error", () => {
        this.usingRealData = false;
        this.binanceWs = null;
        this.scheduleBinanceReconnect();
      });
      ws.on("close", () => {
        this.usingRealData = false;
        this.binanceWs = null;
        this.scheduleBinanceReconnect();
      });
    } catch {
      this.usingRealData = false;
      this.scheduleBinanceReconnect();
    }
  }

  /** Snapshot of retained history plus the in-progress candle. */
  getHistory(): Candle[] {
    return this.live ? [...this.history, this.live] : [...this.history];
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.binanceReconnect) clearTimeout(this.binanceReconnect);
    this.binanceWs?.close();
    this.listeners.clear();
  }
}

const markets = new Map<string, AssetMarket>();

export function startEngine(): void {
  if (markets.size > 0) return;
  for (const cfg of ASSETS) markets.set(cfg.symbol, new AssetMarket(cfg));
  logger.info({ assets: ASSETS.length }, "Market engine started");
}

export function getHistory(symbol: string): Candle[] | null {
  return markets.get(symbol)?.getHistory() ?? null;
}

export function subscribe(symbol: string, fn: Listener): (() => void) | null {
  return markets.get(symbol)?.subscribe(fn) ?? null;
}

export function isKnownAsset(symbol: string): boolean {
  return ASSET_BY_SYMBOL.has(symbol);
}
