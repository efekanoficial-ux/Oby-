import { useEffect, useRef, useState, useCallback } from "react";
import type { DrawingItem, DrawingType } from "@/types/drawing";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type Logical,
} from "lightweight-charts";

/* ── Public types ───────────────────────────────────────────────────────── */
export interface Candle {
  time: number;   // ms
  open: number; high: number; low: number; close: number;
}

export interface ActiveEntry {
  entryTime: number;
  entryPrice: number;
  expiryTime: number;
  direction: "UP" | "DOWN";
  amount?: number;
  symbol: string; // <-- Added this
}

interface Props {
  basePrice?: number;
  /** Asset symbol used as the market WebSocket subscription key, e.g. "AUD/CAD". */
  symbol?: string;
  digits?: number;
  chartInterval?: string;
  onPriceChange?: (price: number) => void;
  onPanChange?: (isPanned: boolean) => void;
  onZoomChange?: (dir: "in" | "out") => void;  // kept for compat, LW handles natively
  showBollinger?: boolean;
  showMA?: boolean;
  showSAR?: boolean;
  showFrac?: boolean;
  showAlig?: boolean;
  chartType?: "candle" | "line";
  onCandlesChange?: (candles: Candle[]) => void;
  onRealDataChange?: (isReal: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
  /** Currency symbol to display on trade bubbles (e.g. ₺ or $) */
  currencySymbol?: string;
  /** All open trade entries to overlay on the chart (lines + bubbles). */
  activeEntries?: (ActiveEntry & { amount?: number })[];
  /** Increment to trigger a scroll-to-live (recenter) from outside. */
  goLiveKey?: number;
  /** Active chart drawings (horizontal, vertical, trend) */
  drawings?: DrawingItem[];
  onDrawingsChange?: (drawings: DrawingItem[]) => void;
  onDeleteDrawing?: (id: string) => void;
}

const ASSET_DIGITS: Record<string, number> = {
  "Crypto IDX": 2,
  "AUD/CAD": 5,
  "AUD/CHF": 5,
  "AUD/DKK": 4,
  "AUD/HUF": 3,
  "AUD/JPY": 3,
  "AUD/NOK": 4,
  "AUD/NZD": 5,
  "AUD/SEK": 4,
  "AUD/SGD": 5,
  "AUD/USD": 5,
  "AUD/ZAR": 4,
  "CAD/CHF": 5,
};

/* ── Expiry countdown badge (rendered inside chart overlay) ─────────────── */
function ExpiryCountdownBadge({ expiryTime, x, color }: { expiryTime: number; x: number; color: string }) {
  const [rem, setRem] = useState(() => Math.max(0, (expiryTime - Date.now()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setRem(Math.max(0, (expiryTime - Date.now()) / 1000)), 500);
    return () => clearInterval(iv);
  }, [expiryTime]);
  const hh = Math.floor(rem / 3600);
  const mm = Math.floor((rem % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(rem % 60).toString().padStart(2, "0");
  const label = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  return (
    <div style={{
      position: "absolute",
      left: x - 6,
      top: 8,
      transform: "translateX(-100%)",
      background: "rgba(0,0,0,0.85)",
      borderRadius: 5,
      padding: "2px 6px",
      fontSize: 10,
      fontWeight: 800,
      color: "#f6465d",
      whiteSpace: "nowrap",
      letterSpacing: "0.03em",
      fontFamily: "monospace",
      pointerEvents: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
    }}>
      {label}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const BASE_MAX = 17_500;     // raw 5s candles kept client-side (~24h)
const INDICATOR_MAX = 1_500; // confirmed display bars kept for indicators
const REBUILD_EVERY = 120;   // finalized buckets before a full series rebuild

/**
 * The market server emits 5-second candles. Higher chart timeframes are built
 * by aggregating those base candles client-side into wider buckets.
 */
const BUCKET_SECS: Record<string, number> = {
  "5s": 5,
  "10s": 10,
  "15s": 15,
  "30s": 30,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
};

function bucketSecsFor(interval: string): number {
  return BUCKET_SECS[interval] ?? 5;
}

/** Build the market WebSocket URL relative to the current origin. */
function marketWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/market`;
}

/** Group base candles into fixed second-buckets (OHLC merge). `time` in sec. */
function aggregate(candles: Candle[], bucketSecs: number): Candle[] {
  if (!candles || candles.length === 0) return [];
  const bs = Math.max(1, bucketSecs);
  const map = new Map<number, Candle>();
  for (const c of candles) {
    if (!c || typeof c.time !== "number" || !Number.isFinite(c.time)) continue;
    const t = Math.floor(c.time / bs) * bs;
    const ex = map.get(t);
    if (!ex) {
      map.set(t, { time: t, open: c.open, high: c.high, low: c.low, close: c.close });
    } else {
      ex.high = Math.max(ex.high, c.high);
      ex.low  = Math.min(ex.low, c.low);
      ex.close = c.close;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/** lightweight-charts expects seconds; our candles already store seconds. */
function toSec(t: number): Time { return t as unknown as Time; }

/** EMA(period) for MA overlay. */
function calcEMA(candles: Candle[], period = 20): ({ time: number; value: number } | null)[] {
  const k = 2 / (period + 1);
  let ema: number | null = null;
  let seedSum = 0;
  return candles.map((c, i) => {
    if (i < period - 1) { seedSum += c.close; return null; }
    if (i === period - 1) { seedSum += c.close; ema = seedSum / period; }
    else ema = c.close * k + ema! * (1 - k);
    return { time: c.time, value: ema! };
  });
}

function calcBB(candles: Candle[], period = 20, mult = 2) {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const sl = candles.slice(i - period + 1, i + 1);
    const mean = sl.reduce((s, x) => s + x.close, 0) / period;
    const std  = Math.sqrt(sl.reduce((s, x) => s + (x.close - mean) ** 2, 0) / period);
    return { time: c.time, upper: mean + mult * std, middle: mean, lower: mean - mult * std };
  });
}

function calcSMMA(data: number[], period: number): (number | null)[] {
  const res: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return res;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  let prev = sum / period;
  res[period - 1] = prev;
  for (let i = period; i < data.length; i++) {
    prev = (prev * (period - 1) + data[i]) / period;
    res[i] = prev;
  }
  return res;
}

function calcAlligator(candles: Candle[]) {
  const median = candles.map(c => (c.high + c.low) / 2);
  const jawRaw = calcSMMA(median, 13);
  const teethRaw = calcSMMA(median, 8);
  const lipsRaw = calcSMMA(median, 5);

  const jaw: ({ time: number; value: number } | null)[] = new Array(candles.length).fill(null);
  const teeth: ({ time: number; value: number } | null)[] = new Array(candles.length).fill(null);
  const lips: ({ time: number; value: number } | null)[] = new Array(candles.length).fill(null);

  for (let i = 0; i < candles.length; i++) {
    if (i + 8 < candles.length && jawRaw[i] !== null) {
      jaw[i + 8] = { time: candles[i + 8].time, value: jawRaw[i]! };
    }
    if (i + 5 < candles.length && teethRaw[i] !== null) {
      teeth[i + 5] = { time: candles[i + 5].time, value: teethRaw[i]! };
    }
    if (i + 3 < candles.length && lipsRaw[i] !== null) {
      lips[i + 3] = { time: candles[i + 3].time, value: lipsRaw[i]! };
    }
  }
  return { jaw, teeth, lips };
}

function calcSAR(candles: Candle[]) {
  if (candles.length < 3) return [];
  const res: { time: number; value: number }[] = [];
  let af = 0.02;
  const maxAf = 0.2;
  let isLong = candles[1].close > candles[0].close;
  let sar = isLong ? candles[0].low : candles[0].high;
  let ep = isLong ? candles[0].high : candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    res.push({ time: candles[i].time, value: sar });
    const prevSar = sar;
    sar = prevSar + af * (ep - prevSar);
    if (isLong) {
      if (candles[i].low < sar) {
        isLong = false;
        sar = ep;
        ep = candles[i].low;
        af = 0.02;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(maxAf, af + 0.02);
        }
      }
      sar = Math.min(sar, candles[i - 1].low, i > 1 ? candles[i - 2].low : candles[i - 1].low);
    } else {
      if (candles[i].high > sar) {
        isLong = true;
        sar = ep;
        ep = candles[i].high;
        af = 0.02;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(maxAf, af + 0.02);
        }
      }
      sar = Math.max(sar, candles[i - 1].high, i > 1 ? candles[i - 2].high : candles[i - 1].high);
    }
  }
  return res;
}

function calcFractals(candles: Candle[]) {
  const res: { time: number; value: number }[] = [];
  for (let i = 2; i < candles.length - 2; i++) {
    const h = candles[i].high;
    if (h > candles[i-1].high && h > candles[i-2].high && h > candles[i+1].high && h > candles[i+2].high) {
      res.push({ time: candles[i].time, value: h * 1.001 });
    }
  }
  return res;
}

/* ── Component ──────────────────────────────────────────────────────────── */
export function CandleChart({
  symbol,
  digits,
  chartInterval = "5m",
  onPriceChange,
  activeEntries = [],
  currencySymbol = "$",
  onPanChange,
  onZoomChange,
  showBollinger,
  showMA,
  showSAR,
  showFrac,
  showAlig,
  chartType = "candle",
  onCandlesChange,
  onRealDataChange,
  onLoadingChange,
  goLiveKey,
  drawings = [],
  onDrawingsChange,
  onDeleteDrawing,
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  /* chart objects */
  const chartRef    = useRef<IChartApi | null>(null);
  const seriesRef   = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const areaRef     = useRef<ISeriesApi<"Area"> | null>(null);
  const maRef       = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpRef     = useRef<ISeriesApi<"Line"> | null>(null);
  const bbDnRef     = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMidRef    = useRef<ISeriesApi<"Line"> | null>(null);
  const aligJawRef   = useRef<ISeriesApi<"Line"> | null>(null);
  const aligTeethRef = useRef<ISeriesApi<"Line"> | null>(null);
  const aligLipsRef  = useRef<ISeriesApi<"Line"> | null>(null);
  const sarRef       = useRef<ISeriesApi<"Line"> | null>(null);
  const fracRef      = useRef<ISeriesApi<"Line"> | null>(null);
  const activeEntriesRef = useRef<(ActiveEntry & { amount?: number })[]>([]);
  const drawingsRef = useRef<DrawingItem[]>(drawings);
  const onDrawingsRef = useRef(onDrawingsChange);
  const rafPendingRef    = useRef(false);

  type EntryOverlay = {
    expiryX: number; entryX: number;
    entryY?: number; lineColor: string; amount?: number;
    isWinning?: boolean;
    expiryTime?: number;  // ms
    stableKey: number;    // entryTime ms — unique per trade, used as React key
  };

  type DrawingOverlay = {
    id: string;
    type: DrawingType;
    color: string;
    width: number;
    dashed?: boolean;
    y?: number | null;
    x?: number | null;
    p1?: { x: number; y: number } | null;
    p2?: { x: number; y: number } | null;
    priceLabel?: string;
    timeLabel?: string;
  };

  type OverlayState = {
    dotX: number;
    dotY: number;
    entries: EntryOverlay[];
    drawings: DrawingOverlay[];
  };
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);

  const dragRef = useRef<{
    id: string;
    handle: "line" | "p1" | "p2" | "mid";
    startX: number;
    startY: number;
    origPrice?: number;
    origTime?: number;
    origP1?: { time: number; price: number };
    origP2?: { time: number; price: number };
  } | null>(null);

  /* data */
  const baseCandlesRef    = useRef<Candle[]>([]);  // raw 5s candles from server
  const candlesRef        = useRef<Candle[]>([]);  // aggregated confirmed (indicators)
  const liveBucketRef     = useRef<Candle | null>(null);  // in-progress (aggregated) candle
  const chartBarsRef      = useRef(0);             // total bars currently in the series
  const finalizedRef      = useRef(0);             // buckets finalized since last full rebuild
  const hasRealDataRef    = useRef(false);
  const wsRef             = useRef<WebSocket | null>(null);
  const reconnectRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNotifyRef     = useRef(0);
  const bucketSecsRef     = useRef(bucketSecsFor(chartInterval));

  /* zoom-driven timeframe switching */

  /* stable callback refs */
  const onPriceRef      = useRef(onPriceChange);
  const onPanRef        = useRef(onPanChange);
  const onCandlesRef    = useRef(onCandlesChange);
  const onRealDataRef   = useRef(onRealDataChange);
  const onLoadingRef    = useRef(onLoadingChange);
  const showBBRef       = useRef(showBollinger);
  const showMARef       = useRef(showMA);
  const chartTypeRef    = useRef(chartType);

  useEffect(() => { onPriceRef.current    = onPriceChange;    }, [onPriceChange]);
  useEffect(() => { onPanRef.current      = onPanChange;      }, [onPanChange]);
  useEffect(() => { onCandlesRef.current  = onCandlesChange;  }, [onCandlesChange]);
  useEffect(() => { onRealDataRef.current = onRealDataChange; }, [onRealDataChange]);
  useEffect(() => { onLoadingRef.current  = onLoadingChange;  }, [onLoadingChange]);
  useEffect(() => { showBBRef.current     = showBollinger;    }, [showBollinger]);
  useEffect(() => { showMARef.current     = showMA;           }, [showMA]);
  useEffect(() => { chartTypeRef.current  = chartType;        }, [chartType]);

  const notifyLoading = (v: boolean) => { setIsLoading(v); onLoadingRef.current?.(v); };

  /* ── Overlay (dot + trade lines) ────────────────────────────────────── */
  const scheduleOverlayUpdate = () => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      const chart = chartRef.current;
      const live  = liveBucketRef.current;
      if (!chart || !live) return;

      const isCandle     = chartTypeRef.current === "candle";
      const activeSeries = isCandle ? seriesRef.current : areaRef.current;
      if (!activeSeries) return;

      const dotY_c = activeSeries.priceToCoordinate(live.close);
      if (dotY_c === null) return;

      const ts        = chart.timeScale();
      const totalBars = chartBarsRef.current;
      if (totalBars < 2) return;

      /* logicalToCoordinate works reliably for any bar index in the visible
         range. timeToCoordinate is NOT used here because it returns null for
         future times that have no bar data yet. */
      const liveLogical  = (totalBars - 1) as Logical;
      const dotX_raw     = ts.logicalToCoordinate(liveLogical);
      const prevX_raw    = ts.logicalToCoordinate((liveLogical - 1) as Logical);
      const pprevX_raw   = ts.logicalToCoordinate((liveLogical - 2) as Logical);

      const prevX  = prevX_raw  !== null ? (prevX_raw  as unknown as number) : null;
      const pprevX = pprevX_raw !== null ? (pprevX_raw as unknown as number) : null;

      /* pixels-per-SECOND from two confirmed bars — used to extrapolate future positions.
         live.time is in SECONDS (Unix timestamp as sent by the server).
         ae.entryTime / ae.expiryTime are Date.now() ms values — divide by 1000. */
      const bucketSec = bucketSecsRef.current;
      const barPx     = prevX !== null && pprevX !== null
        ? prevX - pprevX
        : 8; // fallback: 8 px per bar
      const pxPerSec  = barPx / bucketSec;

      /* When a new bar is just added via series.update(), the chart may not have
         computed its coordinate yet (dotX_raw === null). Extrapolate from prevX. */
      let dotX: number;
      if (dotX_raw !== null) {
        dotX = dotX_raw as unknown as number;
      } else if (prevX !== null) {
        dotX = prevX + barPx;
      } else {
        return; // not enough data
      }

      const dotY = dotY_c as unknown as number;

      const isCandle2    = chartTypeRef.current === "candle";
      const activeSeries2 = isCandle2 ? seriesRef.current : areaRef.current;

      /* Render all entries still in activeEntriesRef — expired ones stay visible
         as historical markers until chartEntries cleanup removes them at settlement.
         expiryX / entryX naturally fall into the past region of the chart, which
         is correct: they show exactly where the trade opened and where it expired. */
      const entries: EntryOverlay[] = activeEntriesRef.current
        .map(ae => {
          const entryY_c = activeSeries2?.priceToCoordinate(ae.entryPrice) ?? null;
          const currentPrice = live.close;
          const isWinning = ae.direction === "UP" 
            ? currentPrice >= ae.entryPrice 
            : currentPrice <= ae.entryPrice;
          
          // Green (#0ecb81) if winning, Pale Gray (rgba(255, 255, 255, 0.40)) if not winning / losing (no red)
          const statusColor = isWinning ? "#0ecb81" : "rgba(255, 255, 255, 0.40)";

          return {
            expiryX:    dotX + (ae.expiryTime / 1000 - live.time) * pxPerSec,
            entryX:     dotX + (ae.entryTime  / 1000 - live.time) * pxPerSec,
            entryY:     entryY_c !== null ? (entryY_c as unknown as number) : undefined,
            lineColor:  statusColor,
            isWinning,
            amount:     ae.amount,
            expiryTime: ae.expiryTime,
            stableKey:  ae.entryTime,  // ms — unique per trade, stable across re-renders
          };
        });

      const calcX = (tSec: number): number | null => {
        const coord = ts.timeToCoordinate(tSec as unknown as Time);
        if (coord !== null) return coord as unknown as number;
        return dotX + (tSec - live.time) * pxPerSec;
      };

      const initDigits = digits ?? (symbol ? ASSET_DIGITS[symbol] : undefined) ?? 5;
      const currentDrawings = drawingsRef.current || [];
      const dOverlays: DrawingOverlay[] = currentDrawings.map((d) => {
        const item: DrawingOverlay = {
          id: d.id,
          type: d.type,
          color: d.color,
          width: d.width,
          dashed: d.dashed,
          y: null,
          x: null,
          p1: null,
          p2: null,
        };
        if (d.type === "horizontal" && d.price !== undefined) {
          const y = activeSeries2?.priceToCoordinate(d.price) ?? null;
          if (y !== null) {
            item.y = y as unknown as number;
            item.priceLabel = d.price >= 100 ? d.price.toFixed(2) : d.price.toFixed(initDigits);
          }
        } else if (d.type === "vertical" && d.time !== undefined) {
          const x = calcX(d.time);
          if (x !== null) {
            item.x = x;
            const dt = new Date(d.time * 1000);
            item.timeLabel = `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}:${dt.getSeconds().toString().padStart(2, "0")}`;
          }
        } else if (d.type === "trend" && d.p1 && d.p2) {
          const x1 = calcX(d.p1.time);
          const y1 = activeSeries2?.priceToCoordinate(d.p1.price) ?? null;
          const x2 = calcX(d.p2.time);
          const y2 = activeSeries2?.priceToCoordinate(d.p2.price) ?? null;
          if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            item.p1 = { x: x1, y: y1 as unknown as number };
            item.p2 = { x: x2, y: y2 as unknown as number };
          }
        }
        return item;
      });

      setOverlay({ dotX, dotY, entries, drawings: dOverlays });
    });
  };

  /* ── setReal helper ──────────────────────────────────────────────────── */
  const setReal = (v: boolean) => {
    if (hasRealDataRef.current === v) return;
    hasRealDataRef.current = v;
    onRealDataRef.current?.(v);
  };

  /* ── MA series update ────────────────────────────────────────────────── */
  const updateMA = () => {
    if (!maRef.current) return;
    try {
      const pts = calcEMA(candlesRef.current)
        .filter((x): x is { time: number; value: number } => x !== null)
        .map(x => ({ time: toSec(x.time), value: x.value }));
      maRef.current.setData(pts);
    } catch { /* noop */ }
  };

  const updateSAR = () => {
    if (!sarRef.current) return;
    try {
      const pts = calcSAR(candlesRef.current).map(x => ({ time: toSec(x.time), value: x.value }));
      sarRef.current.setData(pts);
    } catch { /* noop */ }
  };

  const updateFractals = () => {
    if (!fracRef.current) return;
    try {
      const pts = calcFractals(candlesRef.current).map(x => ({ time: toSec(x.time), value: x.value }));
      fracRef.current.setData(pts);
    } catch { /* noop */ }
  };

  const updateAlligator = () => {
    if (!aligJawRef.current || !aligTeethRef.current || !aligLipsRef.current) return;
    try {
      const { jaw, teeth, lips } = calcAlligator(candlesRef.current);
      aligJawRef.current.setData(jaw.filter((x): x is { time: number; value: number } => x !== null).map(x => ({ time: toSec(x.time), value: x.value })));
      aligTeethRef.current.setData(teeth.filter((x): x is { time: number; value: number } => x !== null).map(x => ({ time: toSec(x.time), value: x.value })));
      aligLipsRef.current.setData(lips.filter((x): x is { time: number; value: number } => x !== null).map(x => ({ time: toSec(x.time), value: x.value })));
    } catch { /* noop */ }
  };
  const updateBB = () => {
    if (!bbUpRef.current || !bbDnRef.current || !bbMidRef.current) return;
    try {
      const bb = calcBB(candlesRef.current);
      const up: { time: Time; value: number }[] = [];
      const dn: { time: Time; value: number }[] = [];
      const mid: { time: Time; value: number }[] = [];
      bb.forEach(b => {
        if (!b) return;
        const t = toSec(b.time);
        up.push({ time: t, value: b.upper });
        dn.push({ time: t, value: b.lower });
        mid.push({ time: t, value: b.middle });
      });
      bbUpRef.current.setData(up);
      bbDnRef.current.setData(dn);
      bbMidRef.current.setData(mid);
    } catch { /* noop */ }
  };

  /* ── Display helpers ─────────────────────────────────────────────────── */
  const toBar  = (c: Candle) => ({ time: toSec(c.time), open: c.open, high: c.high, low: c.low, close: c.close });
  const toLine = (c: Candle) => ({ time: toSec(c.time), value: c.close });

  /** Re-center on a comfortable ~60-bar live window. */
  const recenter = () => {
    const total = chartBarsRef.current;
    const ts = chartRef.current?.timeScale();
    if (!ts || total < 2) return;
    ts.setVisibleLogicalRange({ from: Math.max(0, total - 60), to: total + 3 });
  };

  /** Rebuild the visible series from raw 5s candles at the current bucket. */
  const rebuildDisplay = (resetView: boolean) => {
    const rawAgg = aggregate(baseCandlesRef.current, bucketSecsRef.current);
    if (rawAgg.length === 0) return;
    // Guarantee strictly monotonic times without duplicates
    const agg: Candle[] = [];
    for (const c of rawAgg) {
      const prev = agg[agg.length - 1];
      if (!prev || c.time > prev.time) {
        agg.push(c);
      } else if (c.time === prev.time) {
        prev.high = Math.max(prev.high, c.high);
        prev.low = Math.min(prev.low, c.low);
        prev.close = c.close;
      }
    }
    if (agg.length === 0) return;
    const confirmed = agg.slice(0, -1);
    const live = agg[agg.length - 1];
    candlesRef.current = confirmed.slice(-INDICATOR_MAX);
    liveBucketRef.current = { ...live };
    chartBarsRef.current = agg.length;
    finalizedRef.current = 0;
    try {
      seriesRef.current?.setData(agg.map(toBar));
      areaRef.current?.setData(agg.map(toLine));
    } catch {
      // Safe fallback if series was detached or reinitializing
    }
    if (showBBRef.current) updateBB();
    if (showMARef.current) updateMA();
    if (showSARRef.current) updateSAR();
    if (showFracRef.current) updateFractals();
    if (showAligRef.current) updateAlligator();
    onCandlesRef.current?.([...candlesRef.current]);
    onPriceRef.current?.(live.close);
    if (resetView) recenter();
    scheduleOverlayUpdate();
  };

  /** Fold one server 5s candle into the raw store + current display bucket. */
  const ingest = (c: Candle) => {
    if (!c || typeof c.time !== "number" || !Number.isFinite(c.time)) return;
    const base = baseCandlesRef.current;
    const lastB = base[base.length - 1];
    if (lastB && c.time === lastB.time) base[base.length - 1] = c;
    else if (!lastB || c.time > lastB.time) {
      base.push(c);
      if (base.length > BASE_MAX) base.shift();
    } else return;  // stale tick

    const bs = bucketSecsRef.current;
    const bucketTime = Math.floor(c.time / bs) * bs;
    let live = liveBucketRef.current;
    if (!live || bucketTime > live.time) {
      if (live) {                                   // previous display bucket final
        candlesRef.current.push({ ...live });
        if (candlesRef.current.length > INDICATOR_MAX) candlesRef.current.shift();
        chartBarsRef.current += 1;
        finalizedRef.current += 1;
        onCandlesRef.current?.([...candlesRef.current]);
        if (showBBRef.current) updateBB();
        if (showSARRef.current) updateSAR();
        if (showFracRef.current) updateFractals();
        if (showAligRef.current) updateAlligator();
      }
      live = { time: bucketTime, open: c.open, high: c.high, low: c.low, close: c.close };
      liveBucketRef.current = live;
      // Periodically rebuild from the capped raw history so the chart series
      // (and chartBarsRef) stay bounded to the 24h retention window.
      if (finalizedRef.current >= REBUILD_EVERY) { rebuildDisplay(false); return; }
    } else if (bucketTime === live.time) {
      live.high  = Math.max(live.high, c.high);
      live.low   = Math.min(live.low, c.low);
      live.close = c.close;
    } else return;
    liveBucketRef.current = live;

    try {
      seriesRef.current?.update(toBar(live));
      areaRef.current?.update(toLine(live));
    } catch {
      rebuildDisplay(false);
    }
    setReal(true);
    const now = Date.now();
    if (now - lastNotifyRef.current >= 150) {
      onPriceRef.current?.(live.close);
      lastNotifyRef.current = now;
    }
    scheduleOverlayUpdate();
  };

  /* ── CREATE CHART (once) ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const initialWidth = Math.max(100, Math.floor(rect.width || el.clientWidth || el.offsetWidth || 800));
    const initialHeight = Math.max(100, Math.floor(rect.height || el.clientHeight || el.offsetHeight || 500));

    const chart = createChart(el, {
      width:  initialWidth,
      height: initialHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#71717a",
        fontSize: 10,
        fontFamily: "'Inter', 'SF Mono', monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: {
          color: "rgba(255, 255, 255, 0.07)",
          style: LineStyle.Dotted,
          visible: true,
        },
        horzLines: {
          color: "rgba(255, 255, 255, 0.07)",
          style: LineStyle.Dotted,
          visible: true,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#FF6B0055", labelBackgroundColor: "#FF6B00" },
        horzLine: { color: "#FF6B0055", labelBackgroundColor: "#FF6B00" },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: "rgba(255, 255, 255, 0.08)",
        textColor: "#71717a",
        scaleMargins: { top: 0.12, bottom: 0.12 },
        autoScale: true,
        entireTextOnly: true,
        ticksVisible: false,
      },
      localization: {
        timeFormatter: (ts: number) => {
          const d = new Date(ts * 1000);
          const hh = d.getHours().toString().padStart(2, "0");
          const mm = d.getMinutes().toString().padStart(2, "0");
          const ss = d.getSeconds().toString().padStart(2, "0");
          return `${hh}:${mm}:${ss}`;
        },
      },
      timeScale: {
        borderColor: "transparent",
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        ticksVisible: false,
        tickMarkFormatter: (time: number, _tickMarkType: number) => {
          const ts = typeof time === "number" ? time : Number(time);
          if (!Number.isFinite(ts)) return "";
          const d = new Date(ts * 1000);
          const hh = d.getHours().toString().padStart(2, "0");
          const mm = d.getMinutes().toString().padStart(2, "0");
          const ss = d.getSeconds().toString().padStart(2, "0");
          return `${hh}:${mm}:${ss}`;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: true, axisPressedMouseMove: true, pinch: true },
    });

    const initDigits = digits ?? (symbol ? ASSET_DIGITS[symbol] : undefined) ?? 5;
    const initMinMove = 1 / Math.pow(10, initDigits);

    const series = chart.addCandlestickSeries({
      upColor:        "#0ecb81",
      downColor:      "#f6465d",
      borderUpColor:  "#0ecb81",
      borderDownColor:"#f6465d",
      wickUpColor:    "#0ecb8199",
      wickDownColor:  "#f6465d99",
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: "rgba(255, 255, 255, 0.35)",
      priceLineStyle: LineStyle.Solid,
      priceFormat: {
        type: "price",
        precision: initDigits,
        minMove: initMinMove,
      },
    });

    /* Area series for line-chart mode (hidden by default) */
    const area = chart.addAreaSeries({
      lineColor: "#FF6B00",
      topColor: "rgba(255,107,0,0.18)",
      bottomColor: "rgba(255,107,0,0.00)",
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: "rgba(255, 255, 255, 0.35)",
      priceLineStyle: LineStyle.Solid,
      visible: false,
      priceFormat: {
        type: "price",
        precision: initDigits,
        minMove: initMinMove,
      },
    });

    chartRef.current  = chart;
    seriesRef.current = series;
    areaRef.current   = area;
    candlesRef.current = [];

    /* pan detection + zoom-driven timeframe switching */
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      scheduleOverlayUpdate();
      if (!range) return;
      const total = chartBarsRef.current;
      const atLive = range.to >= total - 1.5;
      onPanRef.current?.(!atLive);
    });

    return () => {
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
      areaRef.current   = null;
      maRef.current     = null;
      bbUpRef.current = bbDnRef.current = bbMidRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── RESIZE ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateChartSize = () => {
      if (!chartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.floor(rect.width || containerRef.current.clientWidth || containerRef.current.offsetWidth);
      const h = Math.floor(rect.height || containerRef.current.clientHeight || containerRef.current.offsetHeight);
      if (w > 20 && h > 20) {
        chartRef.current.applyOptions({ width: w, height: h });
        scheduleOverlayUpdate();
      }
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        const w = Math.floor(cr.width || entry.target.clientWidth);
        const h = Math.floor(cr.height || entry.target.clientHeight);
        if (w > 20 && h > 20 && chartRef.current) {
          chartRef.current.applyOptions({ width: w, height: h });
          scheduleOverlayUpdate();
        }
      }
    });
    ro.observe(el);
    window.addEventListener("resize", updateChartSize);

    // Run resize across multiple layout passes
    requestAnimationFrame(updateChartSize);
    const t1 = setTimeout(updateChartSize, 40);
    const t2 = setTimeout(updateChartSize, 150);
    const t3 = setTimeout(updateChartSize, 400);
    const t4 = setTimeout(updateChartSize, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", updateChartSize);
      ro.disconnect();
    };
  }, []);

  /* ── MARKET WEBSOCKET ────────────────────────────────────────────────── */
  useEffect(() => {
    setReal(false);
    notifyLoading(true);
    liveBucketRef.current = null;
    baseCandlesRef.current = [];
    candlesRef.current = [];
    chartBarsRef.current = 0;
    seriesRef.current?.setData([]);

    if (!symbol) return;

    // Safety fallback: dismiss loading screen after 3 seconds in case history lags
    const safetyTimer = setTimeout(() => {
      notifyLoading(false);
    }, 3000);

    let closed = false;

    const connect = () => {
      if (closed) return;
      let ws: WebSocket;
      try {
        ws = new WebSocket(marketWsUrl());
      } catch {
        reconnectRef.current = setTimeout(connect, 1500);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ op: "sub", asset: symbol }));
      };

      ws.onmessage = (e) => {
        let msg: { type?: string; asset?: string; candles?: Candle[]; candle?: Candle };
        try { msg = JSON.parse(e.data); } catch { return; }
        if (msg.asset !== symbol) return;

        if (msg.type === "history" && Array.isArray(msg.candles)) {
          clearTimeout(safetyTimer);
          const validCandles = msg.candles.filter(
            (c): c is Candle => Boolean(c && typeof c.time === "number" && Number.isFinite(c.time))
          );
          baseCandlesRef.current = validCandles.slice(-BASE_MAX);
          rebuildDisplay(true);
          setReal(true);
          notifyLoading(false);
        } else if (msg.type === "update" && msg.candle && typeof msg.candle.time === "number") {
          notifyLoading(false);
          ingest(msg.candle);
        }
      };

      ws.onclose = () => {
        if (closed) return;
        setReal(false);
        reconnectRef.current = setTimeout(connect, 1500);
      };

      ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(safetyTimer);
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
      try { wsRef.current?.close(); } catch { /* noop */ }
      wsRef.current = null;
      setReal(false);
    };
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── ASSET PRECISION / FORMAT UPDATE ─────────────────────────────────── */
  useEffect(() => {
    const d = digits ?? (symbol ? ASSET_DIGITS[symbol] : undefined) ?? 5;
    const minMove = 1 / Math.pow(10, d);
    seriesRef.current?.applyOptions({
      priceFormat: {
        type: "price",
        precision: d,
        minMove: minMove,
      },
    });
    areaRef.current?.applyOptions({
      priceFormat: {
        type: "price",
        precision: d,
        minMove: minMove,
      },
    });
  }, [symbol, digits]);

  /* ── TIMEFRAME SWITCH (re-aggregate, no reconnect) ───────────────────── */
  useEffect(() => {
    bucketSecsRef.current = bucketSecsFor(chartInterval);
    if (baseCandlesRef.current.length > 0) rebuildDisplay(true);
  }, [chartInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── CHART TYPE (candle ↔ line) ─────────────────────────────────────── */
  useEffect(() => {
    const isCandle = chartType === "candle";
    seriesRef.current?.applyOptions({ visible: isCandle });
    areaRef.current?.applyOptions({ visible: !isCandle });
    scheduleOverlayUpdate();
  }, [chartType]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── MOVING AVERAGE (toggle) ─────────────────────────────────────────── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (showMA) {
      if (!maRef.current) {
        maRef.current = chart.addLineSeries({
          color: "#FFD700", lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
        });
      }
      updateMA();
    } else {
      if (maRef.current) { chart.removeSeries(maRef.current); maRef.current = null; }
    }
  }, [showMA]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSARRef = useRef(showSAR);
  const showFracRef = useRef(showFrac);
  const showAligRef = useRef(showAlig);
  useEffect(() => { showSARRef.current = showSAR; }, [showSAR]);
  useEffect(() => { showFracRef.current = showFrac; }, [showFrac]);
  useEffect(() => { showAligRef.current = showAlig; }, [showAlig]);

  /* SAR (toggle) */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (showSAR) {
      if (!sarRef.current) {
        sarRef.current = chart.addLineSeries({ color: "#34d399", lineWidth: 1, lineStyle: LineStyle.Dotted, priceLineVisible: false, lastValueVisible: false });
      }
      updateSAR();
    } else {
      if (sarRef.current) { chart.removeSeries(sarRef.current); sarRef.current = null; }
    }
  }, [showSAR]);

  /* Fractals (toggle) */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (showFrac) {
      if (!fracRef.current) {
        fracRef.current = chart.addLineSeries({ color: "#f472b6", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
      }
      updateFractals();
    } else {
      if (fracRef.current) { chart.removeSeries(fracRef.current); fracRef.current = null; }
    }
  }, [showFrac]);

  /* Alligator (toggle) */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (showAlig) {
      if (!aligJawRef.current) {
        aligJawRef.current = chart.addLineSeries({ color: "#2962FF", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        aligTeethRef.current = chart.addLineSeries({ color: "#FF6D00", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        aligLipsRef.current = chart.addLineSeries({ color: "#00C853", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      }
      updateAlligator();
    } else {
      if (aligJawRef.current) { chart.removeSeries(aligJawRef.current); aligJawRef.current = null; }
      if (aligTeethRef.current) { chart.removeSeries(aligTeethRef.current); aligTeethRef.current = null; }
      if (aligLipsRef.current) { chart.removeSeries(aligLipsRef.current); aligLipsRef.current = null; }
    }
  }, [showAlig]);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (showBollinger) {
      if (!bbUpRef.current) {
        bbUpRef.current  = chart.addLineSeries({ color: "#4DA2FF55", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        bbDnRef.current  = chart.addLineSeries({ color: "#4DA2FF55", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        bbMidRef.current = chart.addLineSeries({
          color: "#FF6B0055", lineWidth: 1, lineStyle: LineStyle.Dashed,
          priceLineVisible: false, lastValueVisible: false,
        });
      }
      updateBB();
    } else {
      if (bbUpRef.current)  { chart.removeSeries(bbUpRef.current);  bbUpRef.current  = null; }
      if (bbDnRef.current)  { chart.removeSeries(bbDnRef.current);  bbDnRef.current  = null; }
      if (bbMidRef.current) { chart.removeSeries(bbMidRef.current); bbMidRef.current = null; }
    }
  }, [showBollinger]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── DRAWINGS SYNC ──────────────────────────────────────────────────── */
  useEffect(() => {
    drawingsRef.current = drawings;
    scheduleOverlayUpdate();
  }, [drawings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onDrawingsRef.current = onDrawingsChange;
  }, [onDrawingsChange]);

  /* ── POINTER DRAG FOR DRAWING HANDLES ───────────────────────────────── */
  const handleStartDrag = (id: string, handle: "line" | "p1" | "p2" | "mid", e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDrawingId(id);
    const d = drawingsRef.current.find((x) => x.id === id);
    if (!d) return;
    dragRef.current = {
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origPrice: d.price,
      origTime: d.time,
      origP1: d.p1 ? { ...d.p1 } : undefined,
      origP2: d.p2 ? { ...d.p2 } : undefined,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const { id, handle, startX, startY, origP1, origP2 } = dragRef.current;
    const isCandle2 = chartTypeRef.current === "candle";
    const activeSeries2 = isCandle2 ? seriesRef.current : areaRef.current;
    const ts = chartRef.current?.timeScale();
    if (!activeSeries2 || !ts) return;

    const rect = containerRef.current.getBoundingClientRect();
    const curY = Math.max(8, Math.min(rect.height - 8, e.clientY - rect.top));
    const curX = e.clientX - rect.left;

    const newPrice = activeSeries2.coordinateToPrice(curY);
    const live = liveBucketRef.current;
    const bucketSec = bucketSecsRef.current;
    let newTime = live ? Math.round(live.time + (curX - (overlay?.dotX ?? curX)) * (bucketSec / 8)) : Math.floor(Date.now() / 1000);

    const logical = ts.coordinateToLogical(curX);
    if (logical !== null) {
      const totalBars = chartBarsRef.current;
      if (live && totalBars > 0) {
        const barDiff = (logical as number) - (totalBars - 1);
        newTime = Math.round(live.time + barDiff * bucketSec);
      }
    }

    const updated = drawingsRef.current.map((item) => {
      if (item.id !== id) return item;
      if (item.type === "horizontal") {
        return { ...item, price: newPrice !== null ? Number(newPrice) : item.price };
      }
      if (item.type === "vertical") {
        return { ...item, time: newTime };
      }
      if (item.type === "trend") {
        if (handle === "p1") {
          return {
            ...item,
            p1: { time: newTime, price: newPrice !== null ? Number(newPrice) : (item.p1?.price ?? 0) },
          };
        }
        if (handle === "p2") {
          return {
            ...item,
            p2: { time: newTime, price: newPrice !== null ? Number(newPrice) : (item.p2?.price ?? 0) },
          };
        }
        if (handle === "mid" && origP1 && origP2) {
          const startPriceVal = activeSeries2.coordinateToPrice(startY - rect.top) ?? origP1.price;
          const curPriceVal = activeSeries2.coordinateToPrice(e.clientY - rect.top) ?? origP1.price;
          const deltaPrice = Number(curPriceVal) - Number(startPriceVal);
          const deltaTime = Math.round((e.clientX - startX) * (bucketSec / 8));
          return {
            ...item,
            p1: { time: origP1.time + deltaTime, price: origP1.price + deltaPrice },
            p2: { time: origP2.time + deltaTime, price: origP2.price + deltaPrice },
          };
        }
      }
      return item;
    });

    drawingsRef.current = updated;
    onDrawingsRef.current?.(updated);
    scheduleOverlayUpdate();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
      dragRef.current = null;
    }
  };

  /* ── ACTIVE ENTRIES OVERLAY ──────────────────────────────────────────── */
  useEffect(() => {
    activeEntriesRef.current = activeEntries;
    scheduleOverlayUpdate();
  }, [activeEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── GO LIVE (external recenter trigger) ─────────────────────────────── */
  useEffect(() => {
    if (!goLiveKey) return;
    recenter();
  }, [goLiveKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative w-full h-full flex-1 flex flex-col min-h-0 min-w-0"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: "100%", height: "100%" }}
    >
      <div
        ref={containerRef}
        className="w-full h-full flex-1 min-h-0 min-w-0"
        style={{ touchAction: "none", width: "100%", height: "100%", position: "relative" }}
      />

      {/* ── Chart overlay: drawings + price dot + trade lines ───────────── */}
      {overlay && !isLoading && (
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 60, pointerEvents: "none", overflow: "hidden", zIndex: 20 }}>

          {/* SVG Drawings Layer */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
            {overlay.drawings?.map((d) => {
              if (d.type === "horizontal" && d.y !== null && d.y !== undefined) {
                return (
                  <g key={d.id} style={{ pointerEvents: "auto" }}>
                    {/* Hit area for dragging horizontal line */}
                    <line
                      x1={0} y1={d.y} x2="100%" y2={d.y}
                      stroke="transparent" strokeWidth={24}
                      className="cursor-ns-resize"
                      onPointerDown={(e) => handleStartDrag(d.id, "line", e)}
                    />
                    {/* Visual Line */}
                    <line
                      x1={0} y1={d.y} x2="100%" y2={d.y}
                      stroke={d.color} strokeWidth={d.width}
                      strokeDasharray={d.dashed ? "6,4" : undefined}
                    />
                    {/* Center Handle */}
                    <circle
                      cx="50%" cy={d.y} r={6}
                      fill={d.color} stroke="#121318" strokeWidth={2}
                      className="cursor-ns-resize shadow-md"
                      onPointerDown={(e) => handleStartDrag(d.id, "line", e)}
                    />
                  </g>
                );
              }
              if (d.type === "vertical" && d.x !== null && d.x !== undefined) {
                return (
                  <g key={d.id} style={{ pointerEvents: "auto" }}>
                    {/* Hit area for dragging vertical line */}
                    <line
                      x1={d.x} y1={0} x2={d.x} y2="100%"
                      stroke="transparent" strokeWidth={24}
                      className="cursor-ew-resize"
                      onPointerDown={(e) => handleStartDrag(d.id, "line", e)}
                    />
                    {/* Visual Line */}
                    <line
                      x1={d.x} y1={0} x2={d.x} y2="100%"
                      stroke={d.color} strokeWidth={d.width}
                      strokeDasharray={d.dashed ? "6,4" : undefined}
                    />
                    {/* Center Handle */}
                    <circle
                      cx={d.x} cy="50%" r={6}
                      fill={d.color} stroke="#121318" strokeWidth={2}
                      className="cursor-ew-resize shadow-md"
                      onPointerDown={(e) => handleStartDrag(d.id, "line", e)}
                    />
                  </g>
                );
              }
              if (d.type === "trend" && d.p1 && d.p2 && d.p1.x !== null && d.p1.y !== null && d.p2.x !== null && d.p2.y !== null) {
                const midX = (d.p1.x + d.p2.x) / 2;
                const midY = (d.p1.y + d.p2.y) / 2;
                return (
                  <g key={d.id} style={{ pointerEvents: "auto" }}>
                    {/* Hit area for trend line (midpoint drag) */}
                    <line
                      x1={d.p1.x} y1={d.p1.y} x2={d.p2.x} y2={d.p2.y}
                      stroke="transparent" strokeWidth={26}
                      className="cursor-move"
                      onPointerDown={(e) => handleStartDrag(d.id, "mid", e)}
                    />
                    {/* Visual Line */}
                    <line
                      x1={d.p1.x} y1={d.p1.y} x2={d.p2.x} y2={d.p2.y}
                      stroke={d.color} strokeWidth={d.width}
                      strokeDasharray={d.dashed ? "6,4" : undefined}
                    />
                    {/* Midpoint Handle */}
                    <circle
                      cx={midX} cy={midY} r={5}
                      fill={d.color} opacity={0.7}
                      className="cursor-move"
                      onPointerDown={(e) => handleStartDrag(d.id, "mid", e)}
                    />
                    {/* P1 Handle */}
                    <circle
                      cx={d.p1.x} cy={d.p1.y} r={7}
                      fill={d.color} stroke="#121318" strokeWidth={2}
                      className="cursor-pointer"
                      onPointerDown={(e) => handleStartDrag(d.id, "p1", e)}
                    />
                    {/* P2 Handle */}
                    <circle
                      cx={d.p2.x} cy={d.p2.y} r={7}
                      fill={d.color} stroke="#121318" strokeWidth={2}
                      className="cursor-pointer"
                      onPointerDown={(e) => handleStartDrag(d.id, "p2", e)}
                    />
                  </g>
                );
              }
              return null;
            })}
          </svg>

          {/* Drawing Badges (Price / Time / Delete) */}
          {overlay.drawings?.map((d) => (
            <div key={`badge-${d.id}`}>
              {/* Horizontal Price Badge & Delete */}
              {d.type === "horizontal" && d.y !== null && d.y !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    right: 48,
                    top: d.y - 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    pointerEvents: "auto",
                  }}
                >
                  <span
                    style={{
                      background: d.color,
                      color: "#000",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                      userSelect: "none",
                    }}
                  >
                    {d.priceLabel}
                  </span>
                  {activeDrawingId === d.id && onDeleteDrawing && (
                    <button
                      onClick={() => onDeleteDrawing(d.id)}
                      style={{
                        background: "#FF3366",
                        color: "#fff",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        fontSize: 11,
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                      }}
                      title="Sil"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Vertical Time Badge */}
              {d.type === "vertical" && d.x !== null && d.x !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    left: d.x,
                    bottom: 22,
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    pointerEvents: "auto",
                  }}
                >
                  <span
                    style={{
                      background: d.color,
                      color: "#000",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: 4,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                      userSelect: "none",
                    }}
                  >
                    {d.timeLabel}
                  </span>
                  {activeDrawingId === d.id && onDeleteDrawing && (
                    <button
                      onClick={() => onDeleteDrawing(d.id)}
                      style={{
                        background: "#FF3366",
                        color: "#fff",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        fontSize: 10,
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Sil"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Per-entry: red expiry line + thin dotted level line + semi-transparent amount bubble */}
          {overlay.entries.map((entry) => (
            <div key={entry.stableKey}>
              {/* Red vertical expiry line */}
              <div style={{
                position: "absolute",
                left: entry.expiryX,
                top: 0, bottom: 0, width: 1.5,
                background: "#f6465d",
                boxShadow: "0 0 6px rgba(246, 70, 93, 0.35)",
              }} />

              {/* Countdown badge on the LEFT of the expiry line */}
              {entry.expiryTime !== undefined && entry.expiryX > 10 && (
                <ExpiryCountdownBadge expiryTime={entry.expiryTime} x={entry.expiryX} color="#f6465d" />
              )}

              {/* Dotted horizontal entry line (Green if winning, pale gray if losing) */}
              {entry.entryY !== undefined && (
                <div style={{
                  position: "absolute",
                  left: entry.entryX,
                  top: entry.entryY - 0.75,
                  width: Math.max(0, entry.expiryX - entry.entryX),
                  height: 0,
                  borderTop: `1.5px dotted ${entry.lineColor}`,
                  opacity: 0.95,
                }} />
              )}

              {/* Semi-transparent amount bubble at entry level (Green if winning, pale gray if not winning) */}
              {entry.amount !== undefined && entry.entryY !== undefined && (
                <div style={{
                  position: "absolute",
                  left: entry.entryX,
                  top: entry.entryY - 22,
                  transform: "translateX(-50%)",
                  background: entry.isWinning
                    ? "rgba(14, 203, 129, 0.30)"
                    : "rgba(255, 255, 255, 0.12)",
                  border: entry.isWinning
                    ? "1px solid rgba(14, 203, 129, 0.50)"
                    : "1px solid rgba(255, 255, 255, 0.25)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderRadius: 8,
                  padding: "2px 7px",
                  fontSize: 10, fontWeight: 800,
                  color: entry.isWinning ? "#ffffff" : "rgba(255, 255, 255, 0.90)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  letterSpacing: "0.02em",
                }}>
                  {currencySymbol}{entry.amount}
                </div>
              )}
            </div>
          ))}

          {/* Last-price dot */}
          <div style={{
            position: "absolute",
            left: overlay.dotX - 5,
            top: overlay.dotY - 5,
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#fff",
            border: "2px solid rgba(0,0,0,0.7)",
          }} />
        </div>
      )}

      {isLoading && (
        <div style={{
          position: "absolute", inset: 0, background: "#000",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 24, zIndex: 10,
        }}>
          <style>{`
            @keyframes ch-bob {
              0%,100% { transform: translateY(0); }
              50%      { transform: translateY(-10px); }
            }
            @keyframes ch-dots {
              0%   { content: ""; }
              33%  { content: "."; }
              66%  { content: ".."; }
              100% { content: "..."; }
            }
            .ch-dot::after {
              content: "";
              animation: ch-dots 1.4s steps(4, end) infinite;
            }
          `}</style>
          {/* 3 animated candles */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {[
              { h: 26, wh: 7, color: "#2e2e2e", delay: "0s" },
              { h: 36, wh: 9, color: "#3a3a3a", delay: "0.18s" },
              { h: 22, wh: 6, color: "#2e2e2e", delay: "0.36s" },
            ].map(({ h, wh, color, delay }, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: `ch-bob 1.3s ease-in-out ${delay} infinite` }}>
                <div style={{ width: 1.5, height: wh, background: color, borderRadius: 1 }} />
                <div style={{ width: 11, height: h, background: color, borderRadius: 3, margin: "2px 0" }} />
                <div style={{ width: 1.5, height: Math.max(3, wh - 3), background: color, borderRadius: 1 }} />
              </div>
            ))}
          </div>
          {/* Text */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
              Grafik bilgisi yükleniyor<span className="ch-dot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
