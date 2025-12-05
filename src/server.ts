import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import QRCode from "qrcode";
import Jimp from "jimp";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// ROOT TEST
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "FlowAI Backend Aktif!" });
});

// HEALTH CHECK
app.get("/health", (_req, res) => res.json({ ok: true }));


// AI ROUTES
app.use("/api/ai", aiRouter);

// PUBLIC ROUTES
app.use("/api/public", publicRouter);

// PRODUCT IMPORT
app.use("/products", productImportRouter);


// 🔥🔥 QR CODE IMAGE + TEXT ENDPOINT 🔥🔥
// URL → https://.../api/qr-image/serhat
app.get("/api/qr-image/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const qrUrl = `https://flowai.app/${shopId}`;

    // QR üret
    const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 500 });

    const qrImage = await Jimp.read(qrBuffer);

    const qrWidth = qrImage.bitmap.width;
    const qrHeight = qrImage.bitmap.height;

    // QR altına 200px alan ekle
    const totalHeight = qrHeight + 200;

    const finalImage = new Jimp(qrWidth, totalHeight, "#FFFFFF");

    // QR'i yerleştir
    finalImage.composite(qrImage, 0, 0);

    // Yazı metni
    const text =
      `📎 Ürünler hakkında soru sorabilir,\n` +
      `kombin önerisi alabilir ve\n` +
      `mağaza ürünleri için destek alabilirsiniz.\n\n` +
      `👉 Açıklamadaki linke tıklayın\n`;

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    finalImage.print(
      font,
      10,
      qrHeight + 10,
      {
        text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP,
      },
      qrWidth - 20
    );

    const pngBuffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);

    res.setHeader("Content-Type", "image/png");
    res.send(pngBuffer);

  } catch (err) {
    console.log("QR ERROR =>", err);
    res.status(500).json({ ok: false, error: "QR oluşturulamadı" });
  }
});


// PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`🔥 FlowAI Backend PORT: ${PORT} üzerinde çalışıyor`)
);
