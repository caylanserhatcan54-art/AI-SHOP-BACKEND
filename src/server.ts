import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";

// ✔ ES Module ortamında __dirname üret
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 👇 QR klasörünü static olarak yayınla (Render uyumlu)
app.use("/qr", express.static(path.join(__dirname, "../public/qr")));

// ➤ Test endpoint
app.get("/", (req, res) => {
  res.send("Backend 🎯 çalışıyor • QR + Shop + Assistant aktif ✔");
});

// ➤ API router bağlantıları
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);

// ➤ Server dinleme
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🔥 Backend running on PORT: ${PORT}`);
});
