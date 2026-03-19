import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminAuthRouter } from "./routes/adminAuth.routes.js";
import { quizRouter } from "./routes/quiz.routes.js";
import { leaderboardRouter } from "./routes/leaderboard.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { creatorRouter } from "./routes/creator.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { paymentsRouter } from "./routes/payments.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { razorpayWebhook } from "./controllers/payments.controller.js";
import { configureOAuth } from "./services/oauth.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));

  // Razorpay signature validation requires raw body BEFORE JSON parsing
  app.post("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

  app.use(express.json({ limit: "1mb" }));
  app.set("trust proxy", 1);
  app.use(cookieParser());
  const allowedOrigins = new Set([
    env.CLIENT_ORIGIN,
    ...(env.CLIENT_ORIGINS ? env.CLIENT_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) : [])
  ]);

  app.use(
    cors({
      origin: (origin, cb) => {
        // allow same-origin / server-to-server requests
        if (!origin) return cb(null, true);
        return cb(null, allowedOrigins.has(origin));
      },
      credentials: true
    })
  );

  configureOAuth(app);

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/quizzes", quizRouter);
  app.use("/api/leaderboard", leaderboardRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/creator", creatorRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/ai", aiRouter);

  app.use((err, _req, res, _next) => {
    const message = err?.message || "INTERNAL_ERROR";
    const isZod = err?.name === "ZodError";
    if (isZod) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.issues });
    return res.status(500).json({ error: message });
  });

  return app;
}