import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";
import { fileURLToPath } from "url";
const app = express();
// ESM için dirname oluşturma
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(cors());
app.use(express.json());
// QR klasörünü statik yayınlama
app.use("/qr", express.static(path.join(__dirname, "../public/qr")));
// Test endpoint
app.get("/api/health", (req, res) => {
    res.json({ message: "Backend çalışıyor 🚀" });
});
// AI BOT endpoint
app.use("/api/assistant", assistantRouter);
// SHOP & QR endpoint
app.use("/api/shop", shopRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
