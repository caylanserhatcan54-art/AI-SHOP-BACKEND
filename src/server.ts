import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/firebase-admin";

// ROUTES
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import { qrRouter } from "./routes/qr";
import { qrTextRouter } from "./routes/qrText";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  return res.json({ ok: true, msg: "FlowAI Backend Aktif!" });
});

// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));

// PRODUCT IMPORT
app.use("/products", productImportRouter);

// PUBLIC ROUTES
app.use("/api/public", publicRouter);

// AI CHAT ROUTE (GROQ)
app.use("/api/ai", aiRouter);

// QR CODE ROUTE
app.use("/api/qr", qrRouter);

// QR TEXT ROUTE
app.use("/api/qr-text", qrTextRouter);

// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log("🔥 FlowAI Backend PORT:", PORT, " üzerinde çalışıyor")
);
