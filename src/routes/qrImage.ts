import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();
const J: any = Jimp;

// Yeni text görseli
// — Arka plan beyaz
// — Yazılar siyah
// — UTF-8 destekli
const TEXT_IMAGE =
  "https://i.ibb.co/hV6Yk5V/text-v3.png";

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const targetUrl = `https://flowai.app/${shopId}`;

    const width = 1200;
    const height = 1600;

    // Arkaplan beyaz
    const baseImage = new J(width, height, 0xffffffff);

    // QR üret (eski 500 yerine 700 px yaptık)
    const qrBuffer = await QRCode.toBuffer(targetUrl, {
      width: 700,
      margin: 1,
      errorCorrectionLevel: "H",
    });

    const qrImage = await J.read(qrBuffer);

    const qrSize = 700;
    const qrX = (width - qrSize) / 2;
    const qrY = 100;

    baseImage.composite(qrImage, qrX, qrY);

    // Text PNG’yi oku
    const textImage = await J.read(TEXT_IMAGE);

    textImage.resize(1000, J.AUTO);

    const txtX = (width - 1000) / 2;
    const txtY = qrY + qrSize + 70;

    baseImage.composite(textImage, txtX, txtY);

    const output = await baseImage.getBufferAsync(J.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qr-${shopId}.png"`
    );

    return res.send(output);
  } catch (err: any) {
    console.log("QR ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "unknown error",
    });
  }
});
