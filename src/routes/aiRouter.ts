import express from "express";
import axios from "axios";
import { getFirestore } from "firebase-admin/firestore";

export const aiRouter = express.Router();
const db = getFirestore();

aiRouter.post("/chat", async (req, res) => {
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
    const allProducts: any[] = [];

    for (const platformDoc of platformsSnap.docs) {
      const productsSnap = await platformDoc.ref.collection("urunler").get();
      productsSnap.forEach((p) => {
        allProducts.push({
          ...p.data(),
          platform: platformDoc.id,
        });
      });
    }

    const productListString =
      allProducts
        .map(
          (p) =>
            `• ${p.title} | ${p.price || ""} | ${p.url} | Platform: ${p.platform}`
        )
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
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: groqMessages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    const data = groqResponse.data;

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI yanıtı alınamadı (Groq boş yanıt verdi).";

    return res.json({
      ok: true,
      reply,
      productCount: allProducts.length,
    });
  } catch (err: any) {
    console.error("AI Chat Error:", err.response?.data || err);
    return res
      .status(500)
      .json({ ok: false, error: err.response?.data || err.message });
  }
});
