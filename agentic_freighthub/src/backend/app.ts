import express from "express";
import { tariffRouter } from "./routes/tariffs";
import { quoteRouter } from "./routes/quotes";
import { feedbackRouter } from "./routes/feedback";
import masterDataRouter from "./routes/masterData";
import { milestone3Router } from "./routes/milestone3Routes";
import authRouter from "./routes/authRoutes";
import { attachAuth } from "./middleware/auth";
import { isDbReady } from "./db/database";
import { ensureAuthSeed } from "./auth/authService";

export const app = express();

app.use(express.json());

// Enable CORS for Vercel & cross-origin deployment
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-auth-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Resolve Bearer / x-auth-token session tokens into req.authUser on every request
app.use(attachAuth);

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FreightQuote AI - Risk, Weather & Customs Engine",
    database: isDbReady() ? "connected" : "disconnected",
  });
});
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FreightQuote AI - Risk, Weather & Customs Engine",
    database: isDbReady() ? "connected" : "disconnected",
  });
});

// Mount Routers for Tariff, Quote & Master Data Endpoints
app.use("/api", tariffRouter);
app.use("/api", quoteRouter);
app.use("/", tariffRouter);
app.use("/", quoteRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/feedback", feedbackRouter);
app.use("/api/v1/master-data", masterDataRouter);
app.use("/v1/master-data", masterDataRouter);

// Risk, Customs & Weather Intelligence Routes
app.use("/api", milestone3Router);
app.use("/", milestone3Router);

// Authentication & User Administration Routes
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);

// Seed default platform accounts on first boot (no-op when already present)
ensureAuthSeed().catch(() => undefined);

