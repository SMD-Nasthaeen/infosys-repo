import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { tariffRouter } from "./routes/tariffs";
import { quoteRouter } from "./routes/quotes";
import { feedbackRouter } from "./routes/feedback";
import masterDataRouter from "./routes/masterData";
import { milestone3Router } from "./routes/milestone3Routes";
import authRouter from "./routes/authRoutes";
import { attachAuth } from "./middleware/auth";
import { isDbReady } from "./db/database";
import { ensureAuthSeed } from "./auth/authService";
import { m4Router } from "./routes/m4Routes";
import { documentRouter } from "./routes/documentRoutes";
import { selectedQuoteRouter } from "./routes/selectedQuoteRoutes";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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

// M4 Routes
app.use(m4Router);

// M4 Document Routes
app.use(documentRouter);

// Selected Quotes Routes
app.use('/api/selected-quotes', selectedQuoteRouter);

// File Upload Endpoint
app.post('/api/upload', attachAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, fileUrl, fileReference: req.file.filename, fileName: req.file.originalname, fileSize: req.file.size, mimeType: req.file.mimetype });
});

// Seed default platform accounts on first boot (no-op when already present)
ensureAuthSeed().catch(() => undefined);

