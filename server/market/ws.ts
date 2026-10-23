import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { getHistory, subscribe, isKnownAsset } from "./engine";
import { logger } from "../lib/logger";

/**
 * Attaches the market WebSocket server at `/api/market`.
 *
 * Protocol (JSON text frames):
 *   client → server: { "op": "sub", "asset": "AUD/CAD" }
 *   server → client: { "type": "history", "asset": "...", "candles": [...] }
 *                    { "type": "update",  "asset": "...", "candle": {...} }
 *                    { "type": "error",   "message": "..." }
 *
 * One asset subscription per connection; subscribing again switches assets.
 */
export function attachMarketWs(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/api/market" });

  wss.on("connection", (socket: WebSocket) => {
    let unsubscribe: (() => void) | null = null;
    let current: string | null = null;

    const send = (payload: unknown) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    };

    const switchTo = (asset: string) => {
      if (!isKnownAsset(asset)) {
        send({ type: "error", message: `Unknown asset: ${asset}` });
        return;
      }
      if (asset === current) return;

      unsubscribe?.();
      current = asset;

      send({ type: "history", asset, candles: getHistory(asset) ?? [] });
      unsubscribe = subscribe(asset, (candle) => {
        send({ type: "update", asset, candle });
      });
    };

    socket.on("message", (data) => {
      let msg: { op?: string; asset?: string };
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (msg.op === "sub" && typeof msg.asset === "string") switchTo(msg.asset);
    });

    socket.on("close", () => unsubscribe?.());
    socket.on("error", () => unsubscribe?.());
  });

  logger.info("Market WebSocket listening on /api/market");
}
