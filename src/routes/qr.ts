import express from "express";
import QRCode from "qrcode";

export const qrRouter = express.Router();

qrRouter.get("/:shopId", async (req, res) => {
  const { shopId } = req.params;

  const redirectUrl = `https://flowai.app/sor?shopId=${shopId}`;

  try {
    const qr = await QRCode.toBuffer(redirectUrl);

    res.setHeader("Content-Type", "image/png");
    res.send(qr);
  } catch (err) {
    console.error("QR Create Error:", err);
    res.status(500).json({ ok: false });
  }
});
