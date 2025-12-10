import express from "express";
import { generateShopQR } from "../utils/qrGenerator";

const router = express.Router();

router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId gerekli" });
    }

    const qr = await generateShopQR(shopId);

    return res.json({
      status: "success",
      qrUrl: qr.qrUrl
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "QR oluşturulamadı" });
  }
});

export default router;
