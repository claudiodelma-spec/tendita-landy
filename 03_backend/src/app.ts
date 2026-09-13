import express from "express";
import cors from "cors";
import { env, isSandbox } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Split from index.ts so integration tests (Fase 11) can import the Express
// app directly with supertest, without opening a real network port.
export function createApp() {
  const app = express();

  // Section 51: two separate public frontends (admin + tienda) must both be
  // allowed to call this API. CORS_ORIGIN accepts a comma-separated list so a
  // single env var can list both real deployment URLs (e.g. Render/Vercel).
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", environment: env.ENVIRONMENT, sandbox: isSandbox });
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
