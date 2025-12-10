import express, { Request, Response } from "express";
import cors from "cors";
import path, { dirname } from "path";
import assistantRouter from "./routes/assistant.js";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import fs from "fs";

const app = express();

// ESM ortamında __dirname üretmek için
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

// QR klasörünü public olarak açıyoruz
app.use("/qr", express.static("/tmp/qr"));

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Backend çalışıyor 🚀" });
});

// ✨ QR ÜRETME ENDPOINT ✨
app.get("/api/qr/generate", async (req: Request, res: Response) => {
  const shopId = req.query.shopId as string;

  if (!shopId) {
    return res.status(400).json({ error: "shopId zorunlu!" });
  }

  try {
    const qrDir = path.join(__dirname, "../public/qr");

    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const targetPath = path.join(qrDir, `${shopId}.png`);

    // Shop'a özel yapay zeka panel linki
    const panelURL = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;

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

// Yapay Zeka endpoint
app.use("/api/assistant", assistantRouter);

// PORT
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
