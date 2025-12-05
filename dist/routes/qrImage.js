"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrImageRouter = void 0;
const express_1 = require("express");
const qrcode_1 = __importDefault(require("qrcode"));
const jimp_1 = __importDefault(require("jimp"));
exports.qrImageRouter = (0, express_1.Router)();
exports.qrImageRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const qrUrl = `https://flowai.app/${shopId}`;
        const qrBuffer = await qrcode_1.default.toBuffer(qrUrl, { width: 500 });
        const qrImage = await jimp_1.default.read(qrBuffer);
        const width = qrImage.bitmap.width;
        const height = qrImage.bitmap.height + 200;
        const finalImage = new jimp_1.default(width, height, "#FFFFFF");
        finalImage.composite(qrImage, 0, 0);
        const text = `📎 Ürünler hakkında soru sorabilir,
kombin önerisi alabilir,
ve mağaza ürünleri için destek alabilirsiniz.

👉 Açıklamadaki linke tıklayın`;
        const font = await jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_BLACK);
        finalImage.print(font, 10, qrImage.bitmap.height + 10, {
            text,
            alignmentX: jimp_1.default.HORIZONTAL_ALIGN_CENTER,
            alignmentY: jimp_1.default.VERTICAL_ALIGN_TOP,
        }, width - 20);
        res.setHeader("Content-Type", "image/png");
        res.send(await finalImage.getBufferAsync(jimp_1.default.MIME_PNG));
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ ok: false, error: err });
    }
});
