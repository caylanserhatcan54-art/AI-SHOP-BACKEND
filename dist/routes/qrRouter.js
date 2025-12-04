"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
exports.qrRouter = express_1.default.Router();
// ---- Her mağaza için QR + link üretici ----
exports.qrRouter.get("/", async (req, res) => {
    try {
        const shopId = req.query.shop;
        if (!shopId) {
            return res.status(400).json({
                ok: false,
                error: "shopId_missing",
            });
        }
        // Mağazaya özel link
        const link = `https://flowai.app/${shopId}`;
        // QR PNG buffer oluştur
        const qrBuffer = await qrcode_1.default.toBuffer(link, {
            errorCorrectionLevel: "H",
            type: "png",
            width: 600,
            margin: 2,
        });
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="${shopId}-qr.png"`);
        return res.send(qrBuffer);
    }
    catch (err) {
        console.error("QR ERROR:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
