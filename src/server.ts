import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Firebase init
import "./config/firebase-admin";

// ROUTES
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import { qrImageRouter } from "./routes/qrImage";

const app = express();
app.use(cors());
app.use(express.json());

// ========================= ROOT ============================
app.get("/", (req, res) => {
  return res.json({ ok: true, msg: "FlowAI Backend Aktif!" });
});

// ========================= HEALTH ============================
app.get("/health", (req, res) => res.json({ ok: true }));

// ========================= AI CHAT ============================
app.use("/api/ai", aiRouter);

// ========================= PRODUCT IMPORT ============================
app.use("/products", productImportRouter);

// ========================= PUBLIC ROUTES ============================
app.use("/api/public", publicRouter);

// ========================= QR IMAGE (PNG) ============================
app.use("/api/qr-image", qrImageRouter);

// ========================= PORT ============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 Backend Running on PORT:", PORT));
