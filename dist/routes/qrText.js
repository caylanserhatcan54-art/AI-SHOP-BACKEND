"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrTextRouter = void 0;
const express_1 = __importDefault(require("express"));
exports.qrTextRouter = express_1.default.Router();
exports.qrTextRouter.get("/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const baseUrl = process.env.CLIENT_URL || "https://ai-shop-backend-2.onrender.com/chat";
    const link = `${baseUrl}/${shopId}`;
    const text = `
📎 Ürünler hakkında soru sormak, kombin önerisi almak veya doğru ürünü bulmak için
QR kodu okutarak ya da ürün açıklamasındaki linke tıklayarak yapay zekaya ulaşabilirsiniz.

💬 Size özel öneriler ve ürün desteği hazır!
👉 ${link}
  `;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="bilgilendirme-${shopId}.txt"`);
    return res.send(text);
});
