import express from "express";
import QRCode from "qrcode";

export const qrRouter = express.Router();

qrRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ ok: false, error: "shopId_missing" });
    }

    const baseUrl =
      process.env.CLIENT_URL || "https://ai-shop-backend-2.onrender.com/chat";

    const shopUrl = `${baseUrl}/${shopId}`;

    // QR oluştur
    const qrPng = await QRCode.toBuffer(shopUrl);

    // İndirilebilir PNG yolluyoruz
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="QR-${shopId}.png"`
    );

    return res.send(qrPng);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});
