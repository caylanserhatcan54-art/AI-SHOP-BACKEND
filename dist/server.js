import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import assistantRouter from "./routes/assistant.js";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import fs from "fs";

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

// QR üretme endpointi
app.get("/api/qr/generate", async (req, res) => {
  const { shopId } = req.query;

  if (!shopId) {
    return res.status(400).json({ error: "shopId zorunlu!" });
  }

  try {
    const qrDir = path.join(__dirname, "../public/qr");

    // dizin yoksa oluştur
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const targetPath = path.join(qrDir, `${shopId}.png`);

    // panel url → NEXT tarafına yönlendirecek sayfa
    const panelURL = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;

    // QR Oluştur
    await QRCode.toFile(targetPath, panelURL);

    return res.json({
      message: "QR başarıyla oluşturuldu ✔",
      qrUrl: `/qr/${shopId}.png`,
      panelUrl: panelURL,
    });
  } catch (err) {
    console.error("QR ERROR", err);
    return res.status(500).json({ error: "QR oluşturulamadı!" });
  }
});

// assistant endpoint
app.use("/api/assistant", assistantRouter);

// PORT
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
