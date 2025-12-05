import { Router } from "express";
import QRCode from "qrcode";
import Jimp from "jimp";

export const qrImageRouter = Router();

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const qrUrl = `https://flowai.app/${shopId}`;
    const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 500 });

    const qrImage = await Jimp.read(qrBuffer);

    const width = qrImage.bitmap.width;
    const height = qrImage.bitmap.height + 200;

    const finalImage = new Jimp(width, height, "#FFFFFF");

    finalImage.composite(qrImage, 0, 0);

    const text = `📎 Ürünler hakkında soru sorabilir,
kombin önerisi alabilir,
ve mağaza ürünleri için destek alabilirsiniz.

👉 Açıklamadaki linke tıklayın`;

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    finalImage.print(
      font,
      10,
      qrImage.bitmap.height + 10,
      {
        text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP,
      },
      width - 20
    );

    res.setHeader("Content-Type", "image/png");
    res.send(await finalImage.getBufferAsync(Jimp.MIME_PNG));

  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err });
  }
});
