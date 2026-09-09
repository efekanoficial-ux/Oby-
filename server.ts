import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { startEngine } from "./server/market/engine";
import { attachMarketWs } from "./server/market/ws";
import router from "./server/routes";
import { logger } from "./server/lib/logger";

const app = express();
const PORT = 3000;
const server = createServer(app);

// Request logger middleware
app.use((req: any, _res, next) => {
  req.log = logger;
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve .well-known/assetlinks.json explicitly
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(process.cwd(), 'public', '.well-known', 'assetlinks.json'));
});

// API routes
app.use("/api", router);

// Start market simulation and attach WebSocket on /api/market
startEngine();
attachMarketWs(server);

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

setupVite();
