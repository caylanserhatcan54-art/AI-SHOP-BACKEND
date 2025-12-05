import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();
const J: any = Jimp;

// UTF-8 destekli fontlar
const FONT64 = "https://raw.githubusercontent.com/ademilter/jimp-fonts/master/fonts/roboto/Roboto-Regular-64.fnt";
const FONT64_PNG = "https://raw.githubusercontent.com/ademilter/jimp-fonts/master/fonts/roboto/Roboto-Regular-64.png";

const TEXT_LINES = [
  "Ürün hakkında soru sormak, doğru ürünü bulmak veya",
  "kombin önerisi almak için QR kodunu okutun.",
  "",
  "Akıllı alışveriş desteği hemen hazır!"
];

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const targetUrl = `https://flowai.app/${shopId}`;

    const width = 1200;
    const height = 1600;

    const image = new J(width, height, 0xffffffff);

    const qrBuffer = await QRCode.toBuffer(targetUrl, {
      width: 500,
      margin: 0
    });

    const qr = await J.read(qrBuffer);
    qr.resize(500, 500);

    const qrX = (width - 500) / 2;
    const qrY = 100;

    const shadow = new J(520, 520, "#00000022");
    image.composite(shadow, qrX - 10, qrY + 10);

    image.composite(qr, qrX, qrY);

    // HARİCİ FONT YÜKLE (UTF-8 destekli)
    const font = await J.loadFont(FONT64);

    let textY = qrY + 580;

    TEXT_LINES.forEach((line: string) => {
      image.print(
        font,
        0,
        textY,
        {
          text: line,
          alignmentX: J.HORIZONTAL_ALIGN_CENTER
        },
        width,
        80
      );

      textY += 80;
    });

    const buffer = await image.getBufferAsync(J.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${shopId}-qr-v2.png"`
    );

    res.send(buffer);

  } catch (err: any) {
    console.log("QR ERROR", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default qrImageRouter;
