"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
exports.qrRouter = express_1.default.Router();
exports.qrRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        if (!shopId) {
            return res.status(400).json({ ok: false, error: "shopId_missing" });
        }
        const baseUrl = process.env.CLIENT_URL || "https://ai-shop-backend-2.onrender.com/chat";
        const shopUrl = `${baseUrl}/${shopId}`;
        // QR oluştur
        const qrPng = await qrcode_1.default.toBuffer(shopUrl);
        // İndirilebilir PNG yolluyoruz
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="QR-${shopId}.png"`);
        return res.send(qrPng);
    }
    catch (err) {
        return res.status(500).json({ ok: false, error: String(err) });
    }
});
