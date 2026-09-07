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

type Listener = (candle: Candle) => void;

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

/** 32-bit integer mixer (Murmur3/SplitMix style) */
function hash32(a: number, b: number): number {
  let h = ((a * 0x9e3779b9) ^ (b * 0x85ebca6b)) >>> 0;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  return ((h >>> 16) ^ h) >>> 0;
}

function hashToFloat(seed: number): number {
  let t = (seed ^ (seed >>> 15)) * 0x85ebca6b;
  t = (t ^ (t >>> 13)) * 0xc2b2ae35;
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
}

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Generates a pseudo-random 1D gradient in [-1.0, 1.0] for cell `cellIndex`.
 */
function gradient1D(seed: number, octaveIdx: number, cellIndex: number): number {
  const h = hash32(seed ^ (octaveIdx * 0x6a09e667), cellIndex);
  return ((h & 0xffff) / 32767.5) - 1.0;
}

/**
 * 1D Gradient (Perlin-style) Noise with quintic smoothstep interpolation.
 * Continuous (C2 smooth: zero 1st and 2nd derivatives at cell boundaries).
 * Because cellIndex = Math.floor(tSec / scaleSec) increments with Unix time,
 * the pattern NEVER repeats.
 */
function sampleOctave(seed: number, octaveIdx: number, tSec: number, scaleSec: number): number {
  const p = tSec / scaleSec;
  const i0 = Math.floor(p);
  const f = p - i0;
  // Quintic smoothstep: 6f^5 - 15f^4 + 10f^3
  const w = f * f * f * (f * (f * 6 - 15) + 10);
  const g0 = gradient1D(seed, octaveIdx, i0);
  const g1 = gradient1D(seed, octaveIdx, i0 + 1);
  return ((1 - w) * g0 * f + w * g1 * (f - 1)) * 3.5;
}

/**
 * Multi-scale fractal octaves spanning from multi-day macro trends down to
 * intra-minute swings. Scales are chosen non-harmonically so that timeframes
 * like 30m, 15m, 5m never see artificial periodicity or repeating cycles.
 */
const NOISE_OCTAVES = [
  { scale: 604800, weight: 0.0380 }, // ~7 days: multi-day macro regime
  { scale: 259200, weight: 0.0240 }, // ~3 days: multi-day trend
  { scale: 86400,  weight: 0.0170 }, // 24 hours: daily market cycle
  { scale: 32400,  weight: 0.0125 }, // 9 hours: major session trend
  { scale: 12600,  weight: 0.0085 }, // 3.5 hours: multi-candle swing on 30m chart
  { scale: 4500,   weight: 0.0055 }, // 75 mins: 2.5 candles on 30m chart
  { scale: 1620,   weight: 0.0035 }, // 27 mins: intra-candle momentum on 30m
  { scale: 540,    weight: 0.0022 }, // 9 mins: 5m/15m wave dynamics
  { scale: 180,    weight: 0.0014 }, // 3 mins: 1m/5m candle moves
  { scale: 60,     weight: 0.0009 }, // 1 min: 15s/30s swings
  { scale: 20,     weight: 0.0005 }, // 20s: 5s candle variance
];

/**
 * Calculates a 100% deterministic, continuous price at any millisecond `timeMs`
 * for a given asset. Uses multi-scale non-repeating continuous gradient noise
 * combined with smooth Hermite tick noise and micro-jitter.
 */
export function getDeterministicPrice(symbol: string, timeMs: number): number {
  const cfg = ASSET_BY_SYMBOL.get(symbol);
  if (!cfg) return 100;

  const base = cfg.base;
  const vol = cfg.vol;
  const digits = cfg.digits;
  const sSeed = stringToSeed(symbol);

  // Time in float seconds
  const tSec = timeMs / 1000;

  // 1. Multi-scale continuous fractal noise (NEVER repeats across days, hours, or minutes)
  let octaveSum = 0;
  for (let i = 0; i < NOISE_OCTAVES.length; i++) {
    const oct = NOISE_OCTAVES[i];
    octaveSum += sampleOctave(sSeed, i, tSec, oct.scale) * oct.weight;
  }

  // 2. Discrete 5-second continuous Hermite noise
  const b0 = Math.floor(tSec / 5);
  const frac = (tSec % 5) / 5;
  const smoothFrac = frac * frac * (3 - 2 * frac);

  const n0 = (hashToFloat(hash32(sSeed ^ 0x3c6ef372, b0)) - 0.5) * 0.0016;
  const n1 = (hashToFloat(hash32(sSeed ^ 0x3c6ef372, b0 + 1)) - 0.5) * 0.0016;
  const noiseInterp = n0 + (n1 - n0) * smoothFrac;

  // 3. Smooth micro tick jitter (moving every ~200ms)
  const subB = Math.floor(tSec / 0.2);
  const subFrac = (tSec % 0.2) / 0.2;
  const subSmooth = subFrac * subFrac * (3 - 2 * subFrac);
  const j0 = (hashToFloat(hash32(sSeed ^ 0xbb67ae85, subB)) - 0.5) * 0.0003;
  const j1 = (hashToFloat(hash32(sSeed ^ 0xbb67ae85, subB + 1)) - 0.5) * 0.0003;
  const jitter = j0 + (j1 - j0) * subSmooth;

  const volFactor = vol / 0.00010;
  const totalRelative = (octaveSum + noiseInterp + jitter) * volFactor;

  // Soft hyperbolic tangent compression to prevent extreme unbounded divergence
  const boundedRelative = Math.tanh(totalRelative * 6) / 6;

  return roundTo(base * (1 + boundedRelative), digits);
}

/**
 * Calculates a 100% deterministic 5-second OHLC candle at `bucketSec`.
 * Samples the continuous price curve inside the 5s window.
 */
export function getDeterministicCandle(symbol: string, bucketSec: number): Candle {
  const cfg = ASSET_BY_SYMBOL.get(symbol);
  const base = cfg?.base ?? 100;
  const digits = cfg?.digits ?? 5;

  const tMs = bucketSec * 1000;
  const open = getDeterministicPrice(symbol, tMs);
  const close = getDeterministicPrice(symbol, tMs + 4900);

  let high = Math.max(open, close);
  let low = Math.min(open, close);

  // Sample 4 intermediate points across the 5s interval for exact wick formation
  for (let offset = 1000; offset <= 4000; offset += 1000) {
    const p = getDeterministicPrice(symbol, tMs + offset);
    if (p > high) high = p;
    if (p < low) low = p;
  }

  return {
    time: bucketSec,
    open: roundTo(open, digits),
    high: roundTo(high, digits),
    low: roundTo(low, digits),
    close: roundTo(close, digits),
  };
}

/** Fallback generator for 24h history */
function generateHistorySlow(symbol: string): Candle[] {
  const nowMs = Date.now();
  const currentBucketSec = Math.floor(nowMs / (CANDLE_SECS * 1000)) * CANDLE_SECS;
  const count = 17280; // 24 hours of 5s candles
  const startBucketSec = currentBucketSec - count * CANDLE_SECS;

  const candles: Candle[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const bucketSec = startBucketSec + i * CANDLE_SECS;
    candles[i] = getDeterministicCandle(symbol, bucketSec);
  }
  return candles;
}

/**
 * One market stream for an asset. Keeps a cached ring buffer of the last 24 hours
 * of candles so client connections and asset switching are sub-millisecond fast.
 */
class AssetMarket {
  readonly cfg: AssetConfig;
  private history: Candle[] = [];
  private live: Candle | null = null;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(cfg: AssetConfig) {
    this.cfg = cfg;
    this.initHistory();
    this.scheduleTick();
  }

  private initHistory(): void {
    this.history = generateHistorySlow(this.cfg.symbol);
  }

  private scheduleTick(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      const now = Date.now();
      this.applyTick(now);
      this.scheduleTick();
    }, 100);
  }

  /** Fold a tick into the live 5s candle and maintain the 24h history buffer. */
  private applyTick(ms: number): void {
    const bucketSec = Math.floor(ms / (CANDLE_SECS * 1000)) * CANDLE_SECS;
    const tMs = bucketSec * 1000;
    const currentPrice = getDeterministicPrice(this.cfg.symbol, ms);

    const open = getDeterministicPrice(this.cfg.symbol, tMs);
    let high = Math.max(open, currentPrice);
    let low = Math.min(open, currentPrice);

    // Sample from start of bucket up to current ms
    const elapsed = Math.min(ms - tMs, 4800);
    for (let offset = 1000; offset <= elapsed; offset += 1000) {
      const p = getDeterministicPrice(this.cfg.symbol, tMs + offset);
      if (p > high) high = p;
      if (p < low) low = p;
    }

    const digits = this.cfg.digits;
    const newCandle: Candle = {
      time: bucketSec,
      open: roundTo(open, digits),
      high: roundTo(high, digits),
      low: roundTo(low, digits),
      close: roundTo(currentPrice, digits),
    };

    // If bucket changed, archive the finalized previous candle to history
    if (this.live && this.live.time < bucketSec) {
      this.history.push(this.live);
      if (this.history.length > 17280) {
        this.history.shift();
      }
    }

    this.live = newCandle;
    const snapshot = this.live;
    for (const fn of this.listeners) fn(snapshot);
  }

  /** Instantaneous snapshot of 24h history plus current in-progress candle. */
  getHistory(): Candle[] {
    const candles = [...this.history];
    if (this.live && candles.length > 0) {
      const last = candles[candles.length - 1];
      if (last.time === this.live.time) {
        candles[candles.length - 1] = this.live;
      } else if (last.time < this.live.time) {
        candles.push(this.live);
      }
    }
    return candles;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.listeners.clear();
  }
}

const markets = new Map<string, AssetMarket>();

export function startEngine(): void {
  if (markets.size > 0) return;
  for (const cfg of ASSETS) {
    markets.set(cfg.symbol, new AssetMarket(cfg));
  }
  logger.info({ assets: ASSETS.length }, "Market engine started with fractal non-repeating noise & 24h cache");
}

export function getHistory(symbol: string): Candle[] {
  const market = markets.get(symbol);
  if (market) return market.getHistory();
  return generateHistorySlow(symbol);
}

export function subscribe(symbol: string, fn: Listener): (() => void) | null {
  return markets.get(symbol)?.subscribe(fn) ?? null;
}

export function isKnownAsset(symbol: string): boolean {
  return ASSET_BY_SYMBOL.has(symbol);
}
