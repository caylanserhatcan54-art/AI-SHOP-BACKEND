import express from "express";
import { getFirestore } from "firebase-admin/firestore";

export const aiRouter = express.Router();
const db = getFirestore();

// ---------------------------------------------
// GROQ AI CHAT
// ---------------------------------------------
aiRouter.post("/chat", async (req, res) => {
  try {
    const { shopId, messages } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, error: "shopId_missing" });
    }

    // 1) Mağaza kontrol
    const shopRef = db.collection("magazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return res.status(404).json({ ok: false, error: "shop_not_found" });
    }

    // 2) Ürünleri al
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

    // Ürün listesini prompta çevir
    const productListString =
      allProducts
        .map(
          (p) =>
            `• ${p.title} | ${p.price || ""} | ${p.url} | Platform: ${p.platform}`
        )
        .join("\n") || "Bu mağazada ürün yok.";

    const systemPrompt = `
Sen FlowAI'nın e-ticaret satış asistanısın.
Görevin: müşterinin sorularına göre mağazanın ürünlerinden en uygun olanları önermek.

Kurallar:
- Sadece aşağıdaki ürün listesini kullan.
- Ürün linklerini mutlaka göster.
- Liste dışı ürün uydurma.
- Eğer uygun ürün yoksa açıkça söyle.

Mağazanın ürünleri:

${productListString}
`;

    // 3) GROQ formatına dönüştür
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // 4) GROQ API CALL
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL,
          messages: groqMessages,
        }),
      }
    );

    const data = await groqResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "AI yanıtı alınamadı (Groq boş yanıt verdi).";

    return res.json({
      ok: true,
      reply,
      productCount: allProducts.length,
    });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
