import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();

const WHITE = 0xffffffff;
const BLACK = 0x000000ff;

/**
 * GET /api/qr-image/:shopId
 */
qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const targetUrl = `https://flowai.app/${shopId}`;

    const textLines = [
      "Ürünlerle ilgili soru sormak, istediginiz ürünü bulmak veya",
      "kombin önerileri almak için QR kodunu okutabilir yada,",
      "ürün bilgilerindeki linkten ulasabilirsiniz.",
      "",
      "Yapay Zeka destekli alsveris hizmetinizde!"
    ];

    // Çalışma alanı
    const width = 1200;
    const height = 1600;

    const image = new Jimp(width, height, WHITE);

    // QR üret
    const qrBuffer = await QRCode.toBuffer(targetUrl, { width: 650, margin: 1 });
    const qr = await Jimp.read(qrBuffer);

    // QR yerleşimi
    const qrX = (width - 650) / 2;
    const qrY = 120;

    // *** GÖLGE ARKA PLAN ***
    const shadow = new Jimp(650, 650, 0xccccccff);
    image.composite(shadow, qrX + 15, qrY + 15);

    // QR'yi baseline üstüne bindir
    image.composite(qr, qrX, qrY);

    // Yazı fontları
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Yazı başlama noktası
    let textY = qrY + 650 + 80;

    for (const line of textLines) {
      image.print(
        fontLarge,
        0,
        textY,
        {
          text: line,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        },
        width,
        50
      );

      textY += 60;
    }

    // PNG çıkar
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="flowai-${shopId}-qr.png"`
    );

    res.send(buffer);

  } catch (err: any) {
    console.log("QR ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

export default qrImageRouter;
