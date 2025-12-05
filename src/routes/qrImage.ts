import express from "express";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";

export const qrImageRouter = express.Router();

qrImageRouter.get("/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const link = `https://flowai.app/${shopId}`;

    const qrBase64 = await QRCode.toDataURL(link);

    const html = `
<html>
<head>
<style>
  body { font-family: Arial; text-align:center; padding: 40px; }
  img { width: 360px; margin-bottom: 30px; }
  .text { font-size: 24px; line-height: 32px; white-space:pre-line; }
</style>
</head>
<body>
  <img src="${qrBase64}" />
  <div class="text">
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

👉 ${link}
  </div>
</body>
</html>`;

    // 🔥 Render Chromium Path
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/chromium-browser",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const buffer = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Disposition", `attachment; filename=${shopId}.png`);
    res.setHeader("Content-Type", "image/png");

    res.send(buffer);

  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
