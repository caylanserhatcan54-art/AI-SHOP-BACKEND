"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const firestore_1 = require("firebase-admin/firestore");
exports.aiRouter = express_1.default.Router();
const db = (0, firestore_1.getFirestore)();
exports.aiRouter.post("/chat", async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const { shopId, messages } = req.body;
        if (!shopId) {
            return res.status(400).json({ ok: false, error: "shopId_missing" });
        }
        const shopRef = db.collection("magazalar").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ ok: false, error: "shop_not_found" });
        }
        const platformsSnap = await shopRef.collection("platformlar").get();
        const allProducts = [];
        for (const platformDoc of platformsSnap.docs) {
            const productsSnap = await platformDoc.ref.collection("urunler").get();
            productsSnap.forEach((p) => {
                allProducts.push({
                    ...p.data(),
                    platform: platformDoc.id,
                });
            });
        }
        const productListString = allProducts
            .map((p) => `• ${p.title} | ${p.price || ""} | ${p.url} | Platform: ${p.platform}`)
            .join("\n") || "Bu mağazada hiç ürün yok.";
        const systemPrompt = `
Sen FlowAI'nın e-ticaret satış asistanısın.
Kurallar:
- Sadece aşağıdaki ürün listesini kullan.
- Linkleri mutlaka göster.
- Liste dışı ürün uydurma.

Mağaza Ürünleri:
${productListString}
`;
        const groqMessages = [
            { role: "system", content: systemPrompt },
            ...messages,
        ];
        // 🔥 FETCH DEĞİL — ARTIK AXIOS KULLANIYORUZ
        const groqResponse = await axios_1.default.post("https://api.groq.com/openai/v1/chat/completions", {
            model: process.env.GROQ_MODEL,
            messages: groqMessages,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
        });
        const data = groqResponse.data;
        const reply = ((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) ||
            "AI yanıtı alınamadı (Groq boş yanıt verdi).";
        return res.json({
            ok: true,
            reply,
            productCount: allProducts.length,
        });
    }
    catch (err) {
        console.error("AI Chat Error:", ((_d = err.response) === null || _d === void 0 ? void 0 : _d.data) || err);
        return res
            .status(500)
            .json({ ok: false, error: ((_e = err.response) === null || _e === void 0 ? void 0 : _e.data) || err.message });
    }
});
