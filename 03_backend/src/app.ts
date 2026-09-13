import express from "express";
import cors from "cors";
import { env, isSandbox } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Split from index.ts so integration tests (Fase 11) can import the Express
// app directly with supertest, without opening a real network port.
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", environment: env.ENVIRONMENT, sandbox: isSandbox });
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
