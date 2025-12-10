import { Router } from "express";
import fs from "fs";
import QRCode from "qrcode";
import path from "path";

const router = Router();

router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId zorunludur" });
    }

    const qrFolder = path.join(process.cwd(), "public", "qr");
    const filePath = path.join(qrFolder, `${shopId}.png`);

    if (!fs.existsSync(qrFolder)) {
      fs.mkdirSync(qrFolder, { recursive: true });
    }

    const qrData = `https://flow-ai.vercel.app/?shop=${shopId}`;

    await QRCode.toFile(filePath, qrData);

    return res.status(200).json({
      status: "ok",
      message: "QR oluşturuldu",
      qrUrl: `/qr/${shopId}.png`,
      shopUrl: qrData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "QR oluşturulamadı" });
  }
});

export default router;
