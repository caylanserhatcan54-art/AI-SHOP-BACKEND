import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import assistantRouter from "./routes/assistant.js";
import { fileURLToPath } from "url";
const app = express();
// ESM için __dirname tanımlıyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(cors());
app.use(express.json());
// QR klasörünü yayınlama
app.use("/qr", express.static(path.join(__dirname, "../public/qr")));
// health endpoint
app.get("/api/health", (req, res) => {
    res.json({ message: "Backend çalışıyor 🚀" });
});
// assistant endpoint
app.use("/api/assistant", assistantRouter);
// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
