"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// ROUTES
const productImport_1 = __importDefault(require("./routes/productImport"));
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
const qrcode_1 = __importDefault(require("qrcode"));
const jimp_1 = __importDefault(require("jimp"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ROOT TEST
app.get("/", (req, res) => {
    res.json({ ok: true, msg: "FlowAI Backend Aktif!" });
});
// HEALTH CHECK
app.get("/health", (_req, res) => res.json({ ok: true }));
// AI ROUTES
app.use("/api/ai", aiRouter_1.aiRouter);
// PUBLIC ROUTES
app.use("/api/public", public_1.publicRouter);
// PRODUCT IMPORT
app.use("/products", productImport_1.default);
// 🔥🔥 QR CODE IMAGE + TEXT ENDPOINT 🔥🔥
// URL → https://.../api/qr-image/serhat
app.get("/api/qr-image/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const qrUrl = `https://flowai.app/${shopId}`;
        // QR üret
        const qrBuffer = await qrcode_1.default.toBuffer(qrUrl, { width: 500 });
        const qrImage = await jimp_1.default.read(qrBuffer);
        const qrWidth = qrImage.bitmap.width;
        const qrHeight = qrImage.bitmap.height;
        // QR altına 200px alan ekle
        const totalHeight = qrHeight + 200;
        const finalImage = new jimp_1.default(qrWidth, totalHeight, "#FFFFFF");
        // QR'i yerleştir
        finalImage.composite(qrImage, 0, 0);
        // Yazı metni
        const text = `📎 Ürünler hakkında soru sorabilir,\n` +
            `kombin önerisi alabilir ve\n` +
            `mağaza ürünleri için destek alabilirsiniz.\n\n` +
            `👉 Açıklamadaki linke tıklayın\n`;
        const font = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_BLACK);
        finalImage.print(font, 10, qrHeight + 10, {
            text,
            alignmentX: jimp_1.default.HORIZONTAL_ALIGN_CENTER,
            alignmentY: jimp_1.default.VERTICAL_ALIGN_TOP,
        }, qrWidth - 20);
        const pngBuffer = await finalImage.getBufferAsync(jimp_1.default.MIME_PNG);
        res.setHeader("Content-Type", "image/png");
        res.send(pngBuffer);
    }
    catch (err) {
        console.log("QR ERROR =>", err);
        res.status(500).json({ ok: false, error: "QR oluşturulamadı" });
    }
});
// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 FlowAI Backend PORT: ${PORT} üzerinde çalışıyor`));
