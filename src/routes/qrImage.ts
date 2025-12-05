import express from "express";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";
import { executablePath } from "puppeteer";

export const qrImageRouter = express.Router();

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const link = `https://flowai.app/${shopId}`;

    const qrBase64 = await QRCode.toDataURL(link);

    const htmlTemplate = `
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; text-align:center; padding: 40px; }
  img { width: 350px; margin-bottom: 25px; }
  div { font-size: 22px; line-height: 30px; white-space:pre-line; }
</style>
</head>
<body>
  <img src="${qrBase64}" />
  <div>
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

👉 ${link}
  </div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);

    const buffer = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Disposition", `attachment; filename=${shopId}.png`);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
