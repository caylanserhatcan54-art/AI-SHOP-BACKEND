import dotenv from "dotenv";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shoproutes.js";
import chatPage from "./routes/chatPage.js";
import productImportRoutes from "./routes/productImport.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
const app = express();
/* ---------------- MIDDLEWARES ---------------- */
app.use(cors());
app.use(express.json());
/* ---------------- STATIC FILES ---------------- */
app.use(express.static(path.join(process.cwd(), "public")));
/* ---------------- API ROUTES ---------------- */
// 🤖 AI CHAT API (JSON)
app.use("/api/assistant", assistantRouter);
// POST /api/assistant/:shopId
// 🛍️ Shop yönetimi
app.use("/api/shop", shopRoutes);
// 📦 Ürün import (Chrome extension)
app.use("/api/product", productImportRoutes);
/* ---------------- UI ROUTES ---------------- */
// 💬 HTML Chat Page
app.use("/chat", chatPage);
// GET /chat/:shopId
/* ---------------- QR STATIC ---------------- */
app.use("/qr", express.static(path.join(process.cwd(), "public/qr")));
/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
    res.send("Backend aktif ✔ Assistant aktif 🤖 Ürün sistemi hazır 🛍️");
});
/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend running on PORT: ${PORT}`);
});
