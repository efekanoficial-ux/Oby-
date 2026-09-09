import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import {
  doc, collection, addDoc, getDocs, deleteDoc,
  onSnapshot, updateDoc, increment,
  query, where, limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

/** Written by home.tsx on every price tick; read at trade settlement to determine win/loss. */
export const livePriceRegistry: Record<string, number> = {};

export type TradeDirection = "UP" | "DOWN";
export type TradeResult    = "WIN" | "LOSE";

export type Trade = {
  id: string; asset: string; direction: TradeDirection;
  amount: number; duration: number; startTime: number; startPrice: number;
};

export type CompletedTrade = {
  id: string; asset: string; direction: TradeDirection;
  amount: number; result: TradeResult; profit: number; closedAt: number;
  mode?: "demo" | "real";
  entryPrice?: number;
  exitPrice?: number;
  duration?: number;
};

type DemoAccountContextType = {
  balance:         number;
  activeTrades:    Trade[];
  completedTrades: CompletedTrade[];
  tradesLoading:   boolean;
  /** Returns the trade id used internally (same as passed tradeId if provided). */
  placeTrade: (
    asset: string, direction: TradeDirection,
    amount: number, duration: number, currentPrice: number,
    tradeId?: string,
  ) => string;
};

const DemoAccountContext = createContext<DemoAccountContextType | null>(null);

const INITIAL_BALANCE = 10000;

/* ─── Guest localStorage helpers ──────────────────────────────────────────── */
const guestBalKey         = () => "obyo_balance_guest";
const guestTradesKey      = () => "obyo_trades_guest";
const guestActiveTradeKey = () => "obyo_active_trades_guest";

function loadGuestBalance(): number {
  try { const v = localStorage.getItem(guestBalKey()); if (v) return JSON.parse(v); } catch {}
  return INITIAL_BALANCE;
}
function saveGuestBalance(b: number) {
  try { localStorage.setItem(guestBalKey(), JSON.stringify(b)); } catch {}
}
function loadGuestTrades(): CompletedTrade[] {
  try { const v = localStorage.getItem(guestTradesKey()); if (v) return JSON.parse(v); } catch {}
  return [];
}
function saveGuestTrades(ts: CompletedTrade[]) {
  try { localStorage.setItem(guestTradesKey(), JSON.stringify(ts.slice(0, 200))); } catch {}
}
function loadGuestActiveTrades(): Trade[] {
  try { const v = localStorage.getItem(guestActiveTradeKey()); if (v) return JSON.parse(v); } catch {}
  return [];
}
function saveGuestActiveTrades(ts: Trade[]) {
  try { localStorage.setItem(guestActiveTradeKey(), JSON.stringify(ts)); } catch {}
}

/* ─── Firestore active-trade helpers ──────────────────────────────────────── */
async function fsAddActiveTrade(uid: string, trade: Trade) {
  await addDoc(collection(db, "activeTrades"), { ...trade, userId: uid });
}

async function fsRemoveActiveTrade(firestoreId: string) {
  try { await deleteDoc(doc(db, "activeTrades", firestoreId)); } catch {}
}

/* ─── Provider ─────────────────────────────────────────────────────────────── */
export function DemoAccountProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const uid     = currentUser?.id ?? auth.currentUser?.uid ?? "guest";
  const isGuest = uid === "guest";

  const [balance,         setBalance]         = useState<number>(isGuest ? loadGuestBalance() : INITIAL_BALANCE);
  const [activeTrades,    setActiveTrades]     = useState<Trade[]>(isGuest ? loadGuestActiveTrades() : []);
  const [completedTrades, setCompletedTrades]  = useState<CompletedTrade[]>(isGuest ? loadGuestTrades() : []);
  const [tradesLoading,   setTradesLoading]    = useState(!isGuest);

  const activeTradesRef = useRef(activeTrades);
  activeTradesRef.current = activeTrades;

  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  /* ── Firestore balance listener (non-guest) ──────────────────────────── */
  useEffect(() => {
    if (isGuest) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const val = snap.data().demoBalance;
        if (typeof val === "number") setBalance(val);
      }
    }, (err) => {
      if (err.code !== "permission-denied") console.error(err);
    });
    return () => unsub();
  }, [uid, isGuest]);

  /* ── Firestore completed trade history listener (non-guest) ──────────── */
  useEffect(() => {
    if (isGuest) return;
    setTradesLoading(true);
    const q = query(
      collection(db, "trades"),
      where("userId", "==", uid),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const sorted = snap.docs
          .map(d => {
            const data = d.data();
            // Use saved tradeId when available so the id matches the local
            // optimistic update — prevents false-positive duplicate notifications.
            return { id: (data.tradeId as string | undefined) ?? d.id, ...data } as CompletedTrade;
          })
          .sort((a, b) => b.closedAt - a.closedAt);
        setCompletedTrades(sorted);
        setTradesLoading(false);
      },
      (err) => {
        if (err.code !== "permission-denied") {
          console.error("[DemoAccount] trades onSnapshot error:", err.code, err.message);
        }
        setTradesLoading(false);
      }
    );
    return () => unsub();
  }, [uid, isGuest]);

  /* ── Restore active trades from Firestore on mount (non-guest) ────────── */
  useEffect(() => {
    if (isGuest) return;

    (async () => {
      try {
        const now = Date.now();
        const q = query(collection(db, "activeTrades"), where("userId", "==", uid));
        const snap = await getDocs(q);
        if (snap.empty) return;

        const expired: (Trade & { fsId: string })[] = [];
        const still:   (Trade & { fsId: string })[] = [];

        snap.docs.forEach(d => {
          const t = { fsId: d.id, ...d.data() } as Trade & { fsId: string };
          if (now >= t.startTime + t.duration * 1000) expired.push(t);
          else still.push(t);
        });

        /* Restore still-running trades into state */
        if (still.length > 0) {
          setActiveTrades(still.map(({ fsId: _f, ...t }) => t));
        }

        /* Immediately settle expired trades */
        for (const trade of expired) {
          const currentPrice = livePriceRegistry[trade.asset] ?? trade.startPrice;
          const isWin  = trade.direction === "UP"
            ? currentPrice >= trade.startPrice
            : currentPrice <= trade.startPrice;
          const profit = isWin ? +(trade.amount * 0.85).toFixed(2) : -trade.amount;

          try {
            if (isWin) {
              await updateDoc(doc(db, "users", uid), { demoBalance: increment(trade.amount + profit) });
            }
            await addDoc(collection(db, "trades"), {
              userId: uid, tradeId: trade.id,
              asset: trade.asset, direction: trade.direction,
              amount: trade.amount, result: isWin ? "WIN" : "LOSE", profit, closedAt: now,
              mode: "demo",
              entryPrice: trade.startPrice,
              exitPrice: currentPrice,
              duration: trade.duration,
            });
            await fsRemoveActiveTrade(trade.fsId);
          } catch (e: unknown) {
            console.error("[DemoAccount] expired trade settle failed:", e);
          }
        }
      } catch (err: any) {
        if (err?.code !== "permission-denied") {
          console.error("[DemoAccount] Restore active trades failed:", err);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isGuest]);

  /* ── Trade settlement interval ───────────────────────────────────────── */
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining: Trade[] = [];
      const finished:  Trade[] = [];

      activeTradesRef.current.forEach(t =>
        (now >= t.startTime + t.duration * 1000 ? finished : remaining).push(t)
      );

      if (finished.length === 0) return;
      setActiveTrades(remaining);
      if (isGuest) saveGuestActiveTrades(remaining);

      finished.forEach(async (trade) => {
        const currentPrice = livePriceRegistry[trade.asset] ?? trade.startPrice;
        const isWin  = trade.direction === "UP"
          ? currentPrice >= trade.startPrice
          : currentPrice <= trade.startPrice;
        const profit = isWin ? +(trade.amount * 0.85).toFixed(2) : -trade.amount;

        if (isGuest) {
          if (isWin) {
            setBalance(b => {
              const next = b + trade.amount + profit;
              saveGuestBalance(next);
              return next;
            });
          }
          const completed: CompletedTrade = {
            id: trade.id, asset: trade.asset, direction: trade.direction,
            amount: trade.amount, result: isWin ? "WIN" : "LOSE", profit, closedAt: now,
            mode: "demo",
            entryPrice: trade.startPrice,
            exitPrice: currentPrice,
            duration: trade.duration,
          };
          setCompletedTrades(prev => {
            const next = [completed, ...prev];
            saveGuestTrades(next);
            return next;
          });
        } else {
          /* 1. Update local state immediately so history shows right away */
          if (isWin) {
            setBalance(b => b + trade.amount + profit);
          }
          const completed: CompletedTrade = {
            id: trade.id, asset: trade.asset, direction: trade.direction,
            amount: trade.amount, result: isWin ? "WIN" : "LOSE", profit, closedAt: now,
            mode: "demo",
            entryPrice: trade.startPrice,
            exitPrice: currentPrice,
            duration: trade.duration,
          };
          setCompletedTrades(prev => [completed, ...prev]);

          /* 2. Persist to Firestore (onSnapshot will reconcile the list) */
          try {
            if (isWin) {
              await updateDoc(doc(db, "users", uid), { demoBalance: increment(trade.amount + profit) });
            }
            await addDoc(collection(db, "trades"), {
              userId: uid, tradeId: trade.id,
              asset: trade.asset, direction: trade.direction,
              amount: trade.amount, result: isWin ? "WIN" : "LOSE", profit, closedAt: now,
              mode: "demo",
              entryPrice: trade.startPrice,
              exitPrice: currentPrice,
              duration: trade.duration,
            });
            /* Remove from activeTrades collection by matching our local id field */
            const aq = query(
              collection(db, "activeTrades"),
              where("userId", "==", uid),
              where("id", "==", trade.id)
            );
            const aSnap = await getDocs(aq);
            for (const d of aSnap.docs) await fsRemoveActiveTrade(d.id);
          } catch (e: any) {
            if (e?.code !== "permission-denied") {
              console.error("[DemoAccount] trade settle failed:", e);
            }
          }
        }
      });
    }, 500);

    return () => clearInterval(interval);
  // activeTrades (full ref) so the interval restarts correctly on every settlement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrades, uid, isGuest]);

  /* ── Place trade ─────────────────────────────────────────────────────── */
  const placeTrade = (
    asset: string, direction: TradeDirection,
    amount: number, duration: number, currentPrice: number,
    tradeId?: string,
  ): string => {
    // Check available balance synchronously to avoid negative balance from rapid clicks
    if (balanceRef.current < amount) return "";

    // Maximum 5 simultaneous live active trades
    const liveCount = activeTradesRef.current.filter(
      t => t.startTime + t.duration * 1000 > Date.now()
    ).length;
    if (liveCount >= 5) return "";

    // Synchronously deduct from ref
    balanceRef.current -= amount;

    setBalance(b => {
      const next = Math.max(0, b - amount);
      if (isGuest) saveGuestBalance(next);
      return next;
    });

    const trade: Trade = {
      id:         tradeId ?? Math.random().toString(36).slice(2, 9),
      asset, direction, amount, duration,
      startTime:  Date.now(),
      startPrice: currentPrice,
    };

    setActiveTrades(prev => {
      const next = [trade, ...prev];
      if (isGuest) saveGuestActiveTrades(next);
      return next;
    });

    if (!isGuest) {
      updateDoc(doc(db, "users", uid), { demoBalance: increment(-amount) }).catch(() => {});
      fsAddActiveTrade(uid, trade).catch(() => {});
    }

    return trade.id;
  };

  return (
    <DemoAccountContext.Provider value={{ balance, activeTrades, completedTrades, tradesLoading, placeTrade }}>
      {children}
    </DemoAccountContext.Provider>
  );
}

export function useDemoAccount() {
  const ctx = useContext(DemoAccountContext);
  if (!ctx) throw new Error("useDemoAccount must be used within DemoAccountProvider");
  return ctx;
}
