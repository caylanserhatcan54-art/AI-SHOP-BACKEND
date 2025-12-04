import express from "express";
import { getFirestore } from "firebase-admin/firestore";

export const aiRouter = express.Router();
const db = getFirestore();

aiRouter.post("/chat", async (req, res) => {
  try {
    const { shopId, messages } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, error: "shopId_missing" });
    }

    // --- Mağaza kontrol ---
    const shopRef = db.collection("magazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return res.status(404).json({ ok: false, error: "shop_not_found" });
    }

    // --- Ürünleri çek ---
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
        .join("\n") || "Bu mağazada ürün yok.";

    // === PROMPT ===
    const systemPrompt = `
Sen FlowAI'nın e-ticaret satış asistanısın.

Kurallar:
- Sadece aşağıdaki ürün listesini kullan.
- Ürün linklerini mutlaka ver.
- Liste dışı ürün uydurma.

Mağazanın ürünleri:

${productListString}
`;

    // --- Mesaj formatı ---
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // === 🔥 GROQ API İSTEĞİ ===
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
    console.log("🔥 Groq Response:", data);

    // === 🔥 100% Güvenli cevap çıkarma ===
    let reply = "Yanıt oluşturulamadı.";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    return res.json({
      ok: true,
      reply,
      productCount: allProducts.length,
    });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
