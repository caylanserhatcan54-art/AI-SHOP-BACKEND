"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = __importDefault(require("express"));
const firestore_1 = require("firebase-admin/firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.aiRouter = express_1.default.Router();
const db = (0, firestore_1.getFirestore)();
// ---------------------------------------------
// GROQ + LLAMA3 AI CHAT
// ---------------------------------------------
exports.aiRouter.post("/chat", async (req, res) => {
    try {
        const { shopId, messages } = req.body;
        if (!shopId) {
            return res.status(400).json({ ok: false, error: "shopId_missing" });
        }
        // 1) MAĞAZA VAR MI?
        const shopRef = db.collection("magazalar").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(404).json({ ok: false, error: "shop_not_found" });
        }
        // 2) TÜM ÜRÜNLERİ ÇEK
        const platformsSnap = await shopRef.collection("platformlar").get();
        const allProducts = [];
        for (const p of platformsSnap.docs) {
            const productsSnap = await p.ref.collection("urunler").get();
            productsSnap.forEach((doc) => allProducts.push({
                ...doc.data(),
                platform: p.id,
            }));
        }
        // 3) ÜRÜNLERİ YAZIYA DÖNÜŞTÜR
        const productListString = allProducts
            .map((p) => `• ${p.title} | ${p.price || ""} | ${p.url} | Platform: ${p.platform}`)
            .join("\n") || "Bu mağazada ürün yok.";
        // 4) Llama3 için system prompt
        const systemPrompt = `
Sen FlowAI'nın e-ticaret satış asistanısın.
Müşterinin sorusuna göre aşağıdaki ürünlerden en uygun olanları seçip öner.

Kurallar:
- Ürün linklerini mutlaka ver.
- Listede olmayan bir ürünü ASLA uydurma.
- Fiyat, kategori ve amaç uyumuna göre öneri yap.
- Uygun ürün yoksa dürüstçe söyle.

Mağazanın ürünleri:

${productListString}
`;
        // 5) Groq AI request
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return res.status(500).json({ ok: false, error: "groq_api_key_missing" });
        }
        const groqResponse = await (0, node_fetch_1.default)("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                ],
                max_tokens: 500,
            }),
        });
        const data = await groqResponse.json();
        const reply = data?.choices?.[0]?.message?.content || "Yanıt oluşturulamadı.";
        return res.json({
            ok: true,
            reply,
            productCount: allProducts.length,
        });
    }
    catch (err) {
        console.error("AI Chat Error:", err);
        return res.status(500).json({
            ok: false,
            error: err.message,
        });
    }
});
