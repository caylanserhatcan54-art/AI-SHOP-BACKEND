import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// 🔥 Firebase Admin Initialize
import "./config/firebase-admin";

// ROUTERS
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import { qrRouter } from "./routes/qrRouter";

const app = express();
app.use(cors());
app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "FlowAI backend aktif" });
});

// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));

// ROUTES
app.use("/products", productImportRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);
app.use("/api/qr", qrRouter); // 👈 QR sistemi buraya eklendi

// PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`🔥 FlowAI Backend PORT : ${PORT}'de çalışıyor`)
);
