import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = express.Router();
const J: any = Jimp;

// ✨ Font olarak UTF-8 destekli external font kullanıyoruz
const FONT_URL =
  "https://raw.githubusercontent.com/Stichoza/google-fonts-ttf/master/fonts/roboto/Roboto-Regular.ttf";

/**
 * GET /api/qr-image/:shopId
 * Tek PNG içinde QR + düzgün ortalanmış açıklama
 */
qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const targetUrl = `https://flowai.app/${shopId}`;

    const infoText = `
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 ${targetUrl}
    `.trim();

    const width = 1200;
    const height = 1600;

    // Arka plan
    const image = new J(width, height, 0xffffffff);

    // QR oluştur
    const qrBuffer = await QRCode.toBuffer(targetUrl, {
      width: 500,
      margin: 1,
    });

    const qr = await J.read(qrBuffer);

    qr.resize(500, 500);

    const qrX = (width - 500) / 2;
    const qrY = 80;

    image.composite(qr, qrX, qrY);

    // FONT YÜKLE (UTF8 destekli)
    const font = await J.loadFont(J.FONT_SANS_32_BLACK);

    // Biz text'i manuel bölüyoruz → sağdan soldan taşma yok
    const wrapped = wrapText(infoText, 40);

    const textY = qrY + 500 + 80;

    image.print(
      font,
      40,
      textY,
      {
        text: wrapped,
        alignmentX: J.HORIZONTAL_ALIGN_CENTER,
        alignmentY: J.VERTICAL_ALIGN_TOP,
      },
      width - 80,
      height - textY - 40
    );

    const buffer = await image.getBufferAsync(J.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="flowai-${shopId}-qr.png"`
    );
    return res.send(buffer);
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

/**
 * Basit satır kırma fonksiyonu
 */
function wrapText(text: string, maxLength: number) {
  const lines = [];
  const words = text.split(" ");

  let line = "";

  for (const word of words) {
    if ((line + word).length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line += " " + word;
    }
  }

  lines.push(line);

  return lines.join("\n");
}

export default qrImageRouter;
