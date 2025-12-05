import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();

const FONT_URL =
  "https://raw.githubusercontent.com/caylanserhatcan54-art/public-assets/main/font/Roboto-64.fnt";
const FONT_PNG =
  "https://raw.githubusercontent.com/caylanserhatcan54-art/public-assets/main/font/Roboto-64.png";

/**
 * GET /api/qr-image/:shopId
 */
qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const targetUrl = `https://flowai.app/${shopId}`;

    const width = 1200;
    const height = 1600;

    const base = new Jimp(width, height, "#FFFFFF");

    // QR üretme
    const qrBuffer = await QRCode.toBuffer(targetUrl, { margin: 0 });
    const qrJimp = await Jimp.read(qrBuffer);
    qrJimp.resize(550, 550);

    const qrX = (width - 550) / 2;
    const qrY = 150;

    // gölge arkası
    const blurBg = new Jimp(580, 580, "#00000030");
    base.composite(blurBg, qrX - 15, qrY + 15);

    base.composite(qrJimp, qrX, qrY);

    // FONT → PNG ile eşle
    const font = await Jimp.loadFont(FONT_URL);

    const textLines = [
      "Ürün hakkında soru sormak,",
      "kombin önerisi almak veya doğru ürünü bulmak için",
      "QR kodunu okutun ya da ürün açıklamasındaki linke tıklayın.",
      "",
      "Akıllı alışveriş desteği hemen hazır!"
    ];

    let startY = qrY + 600;

    for (let line of textLines) {
      base.print(
        font,
        0,
        startY,
        {
          text: line,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        },
        width,
        80
      );

      startY += 80;
    }

    const pngBuffer = await base.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${shopId}-qr.png"`
    );

    return res.send(pngBuffer);
  } catch (err: any) {
    console.log("V2 ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});
