"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = __importDefault(require("express"));
const qrcode_1 = __importDefault(require("qrcode"));
const canvas_1 = require("canvas");
const firestore_1 = require("firebase-admin/firestore");
exports.qrRouter = express_1.default.Router();
const db = (0, firestore_1.getFirestore)();
// ---------------------------------------------
// MAĞAZAYA ÖZEL QR + LİNK + AÇIKLAMA
// ---------------------------------------------
exports.qrRouter.get("/", async (req, res) => {
    try {
        const shopId = req.query.shop;
        if (!shopId) {
            return res.status(400).json({ ok: false, error: "shop_missing" });
        }
        // Mağaza bilgisi
        const shopRef = db.collection("magazalar").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ ok: false, error: "shop_not_found" });
        }
        const shopData = shopSnap.data();
        // Mağaza kategorisi (eğer yoksa 'general' seçilir)
        const category = (shopData === null || shopData === void 0 ? void 0 : shopData.category) || "general";
        // Otomatik açıklama metinleri
        const descriptions = {
            fashion: "QR’ı okutarak veya açıklamadaki linke tıklayarak mağazanın yapay zeka stil asistanına erişebilirsiniz. Kombin, beden ve renk uyumu önerileri alabilirsiniz.",
            hardware: "QR’ı okutarak veya açıklamadaki linke tıklayarak teknik yapay zeka danışmanına ulaşabilirsiniz. Amacınıza uygun ürün seçimi ve kullanım önerileri alabilirsiniz.",
            market: "QR’ı okutarak veya açıklamadaki linke tıklayarak mağazanın akıllı alışveriş asistanını kullanabilirsiniz. İhtiyacınıza uygun ürün önerileri alabilirsiniz.",
            general: "QR’ı okutarak veya açıklamadaki linke tıklayarak mağazanın yapay zeka asistanını kullanabilirsiniz. Ürünler hakkında bilgi ve öneri alabilirsiniz.",
        };
        const description = descriptions[category] || descriptions.general;
        // Chat linki (müşteri buraya gider)
        const chatUrl = `https://flowai.app/chat?shop=${shopId}`;
        // QR üret
        const qrDataUrl = await qrcode_1.default.toDataURL(chatUrl, { margin: 2 });
        // CANVAS alanı
        const canvas = (0, canvas_1.createCanvas)(800, 1100);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 800, 1100);
        // QR resmini çiz
        const qrImg = new canvas_1.Image();
        qrImg.src = qrDataUrl;
        ctx.drawImage(qrImg, 75, 50, 650, 650);
        // Açıklama yazısı
        ctx.fillStyle = "black";
        ctx.font = "34px Arial";
        ctx.textAlign = "center";
        const lines = description.match(/.{1,45}/g) || []; // 45 karakterde satır böler
        let y = 780;
        for (const line of lines) {
            ctx.fillText(line, 400, y);
            y += 50;
        }
        res.setHeader("Content-Type", "image/png");
        return res.send(canvas.toBuffer("image/png"));
    }
    catch (err) {
        console.error("QR Error:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
