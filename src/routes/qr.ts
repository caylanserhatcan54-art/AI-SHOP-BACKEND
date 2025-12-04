import express from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrRouter = express.Router();

qrRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const qrUrl = `https://ai-shop-backend-2.onrender.com/chat/${shopId}`;

    // QR CODE BUFFER oluştur
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      width: 800,
      margin: 2,
    });

    // QR görüntüsünü RAM'e yükle
    const qrImage = await Jimp.read(qrBuffer);

    // Alt yazıyı değiştir
    const descText =
      "QR okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekayı kullanabilirsiniz";

    // Font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Resim yüksekliğine alt yazı alanı ekle
    const canvas = new Jimp(800, qrImage.getHeight() + 150, "#FFFFFF");

    // QR'i üst tarafa ekle
    canvas.composite(qrImage, 0, 0);

    // Yazıyı ortala
    canvas.print(
      font,
      0,
      qrImage.getHeight() + 50,
      {
        text: descText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      800
    );

    // PNG BUFFER oluştur
    const finalBuffer = await canvas.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=qr-${shopId}.png`
    );
    res.setHeader("Content-Type", "image/png");

    return res.send(finalBuffer);
  } catch (err) {
    console.error("QR GENERATE ERROR", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
