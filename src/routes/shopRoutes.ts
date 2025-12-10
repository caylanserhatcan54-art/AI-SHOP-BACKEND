import { Router } from "express";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const router = Router();

// QR Generate
router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId gerekli!" });
    }

    // store QR folder under /public/qr
    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);
    const shopUrl = `https://ai-shop-site.vercel.app/qr/${shopId}`;

    await QRCode.toFile(qrPath, shopUrl);

    res.json({
      ok: true,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
      shopUrl,
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ ok: false, msg: "QR üretilemedi" });
  }
});

export default router;
