"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const firebase_admin_1 = require("../config/firebase-admin");
exports.aiRouter = (0, express_1.Router)();
const LM_URL = "http://192.168.1.43:1234/v1/chat/completions";
const LM_MODEL = "qwen2.5-7b-instruct-1m";
/**
 * Mağaza AI ayarlarını al (logo, mağaza adı, açıklama)
 */
async function getAISettings(shopId) {
    const ref = firebase_admin_1.db
        .collection("shops")
        .doc(shopId)
        .collection("ai")
        .doc("settings");
    const snap = await ref.get();
    return snap.exists ? snap.data() : {};
}
/**
 * Mağaza ürünlerini al
 */
async function getProducts(shopId) {
    const result = [];
    const platSnap = await firebase_admin_1.db
        .collection("shops")
        .doc(shopId)
        .collection("platformlar")
        .get();
    for (const plat of platSnap.docs) {
        const prodSnap = await plat.ref.collection("products").get();
        for (const p of prodSnap.docs) {
            const d = p.data();
            result.push({
                title: d.title || d.başlık || "",
                price: (d.price || d.fiyat || "").replace("$", "").trim(),
                image: d.image || d.görüntü || "",
                link: d.url || d.URL || ""
            });
        }
    }
    return result;
}
/**
 * ---------------------------------------------------------
 *  AI CHAT — FlowAI Zeka Motoru
 * ---------------------------------------------------------
 */
exports.aiRouter.post("/chat", async (req, res) => {
    try {
        const { shopId, message, history = [] } = req.body;
        if (!shopId || !message) {
            return res.json({ ok: false, error: "missing_params" });
        }
        // 1) Mağaza bilgileri
        const settings = await getAISettings(shopId);
        const storeName = settings.storeName || "Bu Mağaza";
        const storeLogo = settings.logo || "";
        const storeDescription = settings.description || "Genel ürün mağazası. Müşterilere yardımcı ol.";
        // 2) Ürün listesi
        const productList = await getProducts(shopId);
        // 3) SYSTEM PROMPT (AI Kişiliği)
        const systemMessage = `
Sen FlowAI adında profesyonel bir e-ticaret satış ve destek asistanısın.

Bu mağaza: **${storeName}**
Açıklama: ${storeDescription}
Logo: ${storeLogo}

Görevlerin:
- Müşteriye kibar, samimi ve profesyonel yaklaş.
- Sorunu anlamadıysan önce 1 kısa soru sor.
- Kombin / moda sorularında net öneriler ver ama ürünleri sadece aşağıdaki productList’ten kullan.
- Boya, hırdavat, elektronik, spor ürünleri sorularında gerçek bilgiler ver.
- Ürün önerirken productList dışına ÇIKMA. Ürün uydurma.
- Fiyatları TL olarak yaz.
- Sonuçta URUN_KARTLARI listesi oluşturabilirsin:

Format:
{
 "title": "",
 "image": "",
 "price": "",
 "link": ""
}

Müşteriye göstereceğin ürünler sadece buradaki productList’ten seçilebilir.

productList:
${JSON.stringify(productList, null, 2)}
`;
        // 4) Mesajı modele gönder
        const response = await (0, node_fetch_1.default)(LM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: LM_MODEL,
                messages: [
                    { role: "system", content: systemMessage },
                    ...history,
                    { role: "user", content: message }
                ],
                temperature: 0.7,
            }),
        });
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content ||
            "Şu anda yanıt veremiyorum, lütfen tekrar dener misin?";
        return res.json({ ok: true, result: answer });
    }
    catch (err) {
        console.error("AI ERROR:", err);
        return res.json({ ok: false, error: "chat_failed" });
    }
});
