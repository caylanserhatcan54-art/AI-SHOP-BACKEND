import express from "express";
import QRCode from "qrcode";
export const qrDownloadRouter = express.Router();
qrDownloadRouter.get("/:shopId", async (req, res) => {
    try {
        const shopId = req.params.shopId;
        if (!shopId)
            return res.status(400).send("shopId_missing");
        const qrLink = `https://flowai.app/${shopId}`;
        // QR üret
        const qrBuffer = await QRCode.toBuffer(qrLink, { width: 500 });
        // ALT YAZI
        const text = `
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

👉 ${qrLink}
`.trim();
        // PNG BASE64 yap
        const base64QR = qrBuffer.toString("base64");
        const combinedDownloadJson = {
            qr_png_base64: base64QR,
            info_text: text,
        };
        res.setHeader("Content-Disposition", `attachment; filename=${shopId}_qr.json`);
        res.json(combinedDownloadJson);
    }
    catch (err) {
        console.error("QR DOWNLOAD ERROR:", err);
        res.status(500).json({ ok: false });
    }
});
