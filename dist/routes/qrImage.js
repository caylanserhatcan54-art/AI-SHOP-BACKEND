"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrImageRouter = void 0;
// src/routes/qrImage.ts
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
const jimp_1 = __importDefault(require("jimp"));
exports.qrImageRouter = express_1.default.Router();
// Jimp'i "any" gibi kullanıp TS hatalarını susturuyoruz
const J = jimp_1.default;
/**
 * QR + altında açıklama yazısı ile tek PNG indirir
 * Örnek: GET /api/qr-image/serhat
 */
exports.qrImageRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        // QR'ın gideceği URL (frontend tarafı)
        const targetUrl = `https://flowai.app/${shopId}`;
        // Görsel boyutları
        const width = 800;
        const height = 1100;
        const qrSize = 400;
        const marginTop = 40;
        // Açıklama metni (QR altına gelecek)
        const infoText = `📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 ${targetUrl}`;
        // 1) QR PNG buffer üret
        const qrBuffer = await qrcode_1.default.toBuffer(targetUrl, {
            width: qrSize,
            margin: 1,
        });
        // 2) Boş beyaz zemin oluştur
        const baseImage = await new J(width, height, 0xffffffff); // beyaz zemin
        // 3) QR'ı ortala ve ekle
        const qrImage = await J.read(qrBuffer);
        const qrX = (width - qrSize) / 2;
        const qrY = marginTop;
        qrImage.resize(qrSize, qrSize);
        baseImage.composite(qrImage, qrX, qrY);
        // 4) Font yükle ve metni QR'ın altına, ortalı yaz
        const font = await J.loadFont(J.FONT_SANS_32_BLACK);
        const textMarginX = 40;
        const textTopY = qrY + qrSize + 40;
        const textBoxWidth = width - textMarginX * 2;
        const textBoxHeight = height - textTopY - 40;
        baseImage.print(font, textMarginX, textTopY, {
            text: infoText,
            alignmentX: J.HORIZONTAL_ALIGN_CENTER,
            alignmentY: J.VERTICAL_ALIGN_TOP,
        }, textBoxWidth, textBoxHeight);
        // 5) PNG buffer olarak cevapla
        const outBuffer = await baseImage.getBufferAsync(J.MIME_PNG);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="flowai-qr-${shopId}.png"`);
        return res.send(outBuffer);
    }
    catch (err) {
        console.error("QR Image Error:", err);
        return res
            .status(500)
            .json({ ok: false, error: (err === null || err === void 0 ? void 0 : err.message) || "qr_image_error" });
    }
});
exports.default = exports.qrImageRouter;
