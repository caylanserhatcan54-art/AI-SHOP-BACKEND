"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrDownloadRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
exports.qrDownloadRouter = express_1.default.Router();
exports.qrDownloadRouter.get("/:shopId", async (req, res) => {
    try {
        const shopId = req.params.shopId;
        if (!shopId)
            return res.status(400).send("shopId_missing");
        const qrLink = `https://flowai.app/${shopId}`;
        // QR üret
        const qrBuffer = await qrcode_1.default.toBuffer(qrLink, { width: 500 });
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
