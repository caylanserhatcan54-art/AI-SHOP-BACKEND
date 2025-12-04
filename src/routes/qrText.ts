import express from "express";
export const qrTextRouter = express.Router();

qrTextRouter.get("/:shopId", async (req, res) => {
  const { shopId } = req.params;

  const baseUrl =
    process.env.CLIENT_URL || "https://ai-shop-backend-2.onrender.com/chat";

  const link = `${baseUrl}/${shopId}`;

  const text = `
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak ya da ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 ${link}
  `;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="bilgilendirme-${shopId}.txt"`
  );

  return res.send(text);
});
