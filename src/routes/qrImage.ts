import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();
const J: any = Jimp;

// Version 2 modern açıklama
const TEXT_LINES = [
  "Ürün hakkında soru sormak, doğru ürünü bulmak veya",
  "kombin önerileri almak için QR kodunu okutup,",
  "ürün açıklamasındaki linke tıklayabilirsiniz.",
  "",
  "Akıllı alışveriş desteği şimdi hazır!"
];


/** --- Version 2 --- */
qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const targetUrl = `https://flowai.app/${shopId}`;

    const width = 1200;
    const height = 1600;

    // Beyaz arka plan
    const image = new J(width, height, 0xffffffff);

    // QR oluştur
    const qrBuffer = await QRCode.toBuffer(targetUrl, {
      width: 500,
      margin: 0,
    });

    const qr = await J.read(qrBuffer);
    qr.resize(500, 500);

    const qrX = (width - 500) / 2;
    const qrY = 100;

    // QR gölge efekti
    const shadow = new J(520, 520, 0x00000022); // gri transparan
    image.composite(shadow, qrX - 10, qrY + 10);

    image.composite(qr, qrX, qrY);

    // Font yükle
    const font = await J.loadFont(J.FONT_SANS_32_BLACK);

    // Yazı konumu
    let textStartY = qrY + 550 + 40;

    TEXT_LINES.forEach((line: string) => {
      image.print(
        font,
        0,
        textStartY,
        {
          text: line,
          alignmentX: J.HORIZONTAL_ALIGN_CENTER
        },
        width,
        60
      );

      textStartY += 60;
    });

    const buffer = await image.getBufferAsync(J.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${shopId}-qr-v2.png"`
    );

    return res.send(buffer);
  } catch (err: any) {
    console.log("QR ERROR", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

export default qrImageRouter;
