import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";

const app = express();

// ESM uyumlu __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// STATIC olarak QR klasörünü aç
const qrFolder = path.join(__dirname, "../public/qr");
app.use("/qr", express.static(qrFolder));

// TEST endpoint
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// HEALTH endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Backend çalışıyor 🚀" });
});

// ROUTES
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);

// PORT
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Backend listening on port", PORT);
});
