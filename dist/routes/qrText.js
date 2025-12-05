"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrTextRouter = void 0;
// src/routes/qrText.ts
const express_1 = __importDefault(require("express"));
exports.qrTextRouter = express_1.default.Router();
/**
 * Sadece açıklama metni döner.
 * Örnek: GET /api/qr-text/serhat
 */
exports.qrTextRouter.get("/:shopId", (req, res) => {
    const { shopId } = req.params;
    const infoText = `📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak veya ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 https://flowai.app/${shopId}
`;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.send(infoText);
});
exports.default = exports.qrTextRouter;
