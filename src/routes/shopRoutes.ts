import { Router } from "express";
import { generateQr } from "../utils/generateQr.js";

const router = Router();

router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId gerekli" });
    }

    const qrFile = await generateQr(shopId);

    return res.json({
      ok: true,
      shopId,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
    });

  } catch (err) {
    console.error("QR ERROR:", err);
    return res.status(500).json({ error: "QR üretilemedi" });
  }
});

export default router;
