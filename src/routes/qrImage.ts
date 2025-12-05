import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();

/**
 * Bu fontlar Jimp formatına uygun (fnt + png)
 */
const FONT_FNT_URL =
  "https://raw.githubusercontent.com/caylanserhatcan54-art/public-assets/main/font/Roboto-64.fnt";
const FONT_PNG_URL =
  "https://raw.githubusercontent.com/caylanserhatcan54-art/public-assets/main/font/Roboto-64.png";

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const width = 1200;
    const height = 1600;

    const base = await Jimp.create(width, height, "#FFFFFF");

    const targetUrl = `https://flowai.app/${shopId}`;

    // QR buffer oluştur
    const qrBuffer = await QRCode.toBuffer(targetUrl, { width: 600 });
    const qrImg = await Jimp.read(qrBuffer);

    // QR gölge arkası
    const shadow = await Jimp.create(620, 620, "#00000030");

    const qrX = (width - 600) / 2;
    const qrY = 140;

    base.composite(shadow, qrX - 10, qrY + 10);
    base.composite(qrImg, qrX, qrY);

    // FONT LOAD → artık yeni format
    const font = await Jimp.loadFont(FONT_FNT_URL);

    const lines = [
      "Ürün hakkında soru sormak, kombin önerisi almak",
      "veya doğru ürünü bulmak için",
      "QR kodunu okutun veya ürün açıklamasındaki linke tıklayın.",
      "",
      "Akıllı alışveriş desteği şimdi hazır!"
    ];

    let y = qrY + 600 + 80;

    for (const line of lines) {
      base.print(
        font,
        0,
        y,
        {
          text: line,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        },
        width,
        80
      );
      y += 90;
    }

    const result = await base.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${shopId}-qr.png"`
    );

    return res.send(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});
