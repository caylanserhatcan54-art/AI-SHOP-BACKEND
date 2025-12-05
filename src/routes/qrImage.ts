import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();
const J: any = Jimp;

// Türkçe ve emoji içeren yazıyı resim olarak koyacağız
const SAFE_TEXT_IMAGE =
  "https://i.ibb.co/51mVsCt/qr-text-v2.png"; // BURASI PNG, text embedd edilmiş

/**
 * GET /api/qr-image/:shopId
 */
qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const targetUrl = `https://flowai.app/${shopId}`;

    const width = 1200;
    const height = 1500;

    // beyaz arka plan
    const base = new J(width, height, 0xffffffff);

    // QR üret
    const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
      width: 500,
      errorCorrectionLevel: "H",
    });
    const qrImg = await J.read(qrPngBuffer);

    const qrX = (width - 500) / 2;
    const qrY = 100;

    base.composite(qrImg, qrX, qrY);

    // Text placeholder resmi (Türkçe embed edilmiş hali)
    const txt = await J.read(SAFE_TEXT_IMAGE);
    txt.resize(1000, J.AUTO);

    const textX = (width - 1000) / 2;
    const textY = qrY + 520;

    base.composite(txt, textX, textY);

    const outBuffer = await base.getBufferAsync(J.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qr-${shopId}.png"`
    );
    return res.send(outBuffer);
  } catch (err: any) {
    console.log("QR ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "image error",
    });
  }
});
