import { Router } from "express";
import { generateQr } from "../utils/generateQr.js";

const router = Router();

router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId gerekli" });
    }

    const qrFileName = await generateQr(shopId);

    return res.json({
      ok: true,
      shopId,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${qrFileName}`
    });

  } catch (error) {
    console.log("QR ERROR:", error);
    return res.status(500).json({ error: "QR üretilemedi" });
  }
});

export default router;
