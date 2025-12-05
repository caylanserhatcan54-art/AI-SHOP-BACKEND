"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrImageRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
const jimp_1 = __importDefault(require("jimp"));
exports.qrImageRouter = express_1.default.Router();
const WHITE = 0xffffffff;
const BLACK = 0x000000ff;
/**
 * GET /api/qr-image/:shopId
 */
exports.qrImageRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const targetUrl = `https://flowai.app/${shopId}`;
        const textLines = [
            "Ürünlerle ilgili soru sormak, istediginiz ürünü bulmak veya",
            "kombin önerileri almak için QR kodunu okutabilir yada,",
            "ürün bilgilerindeki linkten ulasabilirsiniz.",
            "",
            "Yapay Zeka destekli alsveris hizmetinizde!"
        ];
        // Çalışma alanı
        const width = 1200;
        const height = 1600;
        const image = new jimp_1.default(width, height, WHITE);
        // QR üret
        const qrBuffer = await qrcode_1.default.toBuffer(targetUrl, { width: 650, margin: 1 });
        const qr = await jimp_1.default.read(qrBuffer);
        // QR yerleşimi
        const qrX = (width - 650) / 2;
        const qrY = 120;
        // *** GÖLGE ARKA PLAN ***
        const shadow = new jimp_1.default(650, 650, 0xccccccff);
        image.composite(shadow, qrX + 15, qrY + 15);
        // QR'yi baseline üstüne bindir
        image.composite(qr, qrX, qrY);
        // Yazı fontları
        const fontLarge = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_BLACK);
        // Yazı başlama noktası
        let textY = qrY + 650 + 80;
        for (const line of textLines) {
            image.print(fontLarge, 0, textY, {
                text: line,
                alignmentX: jimp_1.default.HORIZONTAL_ALIGN_CENTER,
                alignmentY: jimp_1.default.VERTICAL_ALIGN_TOP,
            }, width, 50);
            textY += 60;
        }
        // PNG çıkar
        const buffer = await image.getBufferAsync(jimp_1.default.MIME_PNG);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="flowai-${shopId}-qr.png"`);
        res.send(buffer);
    }
    catch (err) {
        console.log("QR ERROR:", err);
        res.status(500).json({
            ok: false,
            error: err.message,
        });
    }
});
exports.default = exports.qrImageRouter;
