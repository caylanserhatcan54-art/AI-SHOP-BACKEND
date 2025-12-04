"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
const jimp_1 = __importDefault(require("jimp"));
exports.qrRouter = express_1.default.Router();
exports.qrRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const qrUrl = `https://ai-shop-backend-2.onrender.com/chat/${shopId}`;
        // QR CODE BUFFER oluştur
        const qrBuffer = await qrcode_1.default.toBuffer(qrUrl, {
            width: 800,
            margin: 2,
        });
        // QR görüntüsünü RAM'e yükle
        const qrImage = await jimp_1.default.read(qrBuffer);
        // Alt yazıyı değiştir
        const descText = "QR okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekayı kullanabilirsiniz";
        // Font
        const font = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_BLACK);
        // Resim yüksekliğine alt yazı alanı ekle
        const canvas = new jimp_1.default(800, qrImage.getHeight() + 150, "#FFFFFF");
        // QR'i üst tarafa ekle
        canvas.composite(qrImage, 0, 0);
        // Yazıyı ortala
        canvas.print(font, 0, qrImage.getHeight() + 50, {
            text: descText,
            alignmentX: jimp_1.default.HORIZONTAL_ALIGN_CENTER,
            alignmentY: jimp_1.default.VERTICAL_ALIGN_MIDDLE,
        }, 800);
        // PNG BUFFER oluştur
        const finalBuffer = await canvas.getBufferAsync(jimp_1.default.MIME_PNG);
        res.setHeader("Content-Disposition", `attachment; filename=qr-${shopId}.png`);
        res.setHeader("Content-Type", "image/png");
        return res.send(finalBuffer);
    }
    catch (err) {
        console.error("QR GENERATE ERROR", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
