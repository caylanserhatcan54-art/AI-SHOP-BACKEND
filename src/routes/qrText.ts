// src/routes/qrText.ts
import express from "express";

export const qrTextRouter = express.Router();

/**
 * Sadece açıklama metni döner.
 * Örnek: GET /api/qr-text/serhat
 */
qrTextRouter.get("/:shopId", (req, res) => {
  const { shopId } = req.params;

  const infoText = `📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 https://flowai.app/${shopId}
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(infoText);
});

export default qrTextRouter;
