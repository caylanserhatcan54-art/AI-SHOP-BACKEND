import { Router } from "express";
import { generateQr } from "../utils/generateQr.js";
import fs from "fs";
import path from "path";

const router = Router();

// QR üretme endpointi
router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId gerekli" });
    }

    const qr = await generateQr(shopId);

    return res.json({
      ok: true,
      qrUrl: `https://ai-shop-backend-2.onrender.com/api/shop/get-qr/${qr.fileName}`,
    });

  } catch (err) {
    console.error("QR ERROR:", err);
    res.status(500).json({ error: "QR üretilemedi" });
  }
});

// QR dosyası gösterme endpointi
router.get("/get-qr/:name", (req, res) => {
  const { name } = req.params;
  const filePath = path.join("/tmp/qr", name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("QR bulunamadı");
  }

  return res.sendFile(filePath);
});

export default router;
