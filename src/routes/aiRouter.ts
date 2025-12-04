import express from "express";
import { getFirestore } from "firebase-admin/firestore";

export const aiRouter = express.Router();
const db = getFirestore();

// ---------------------------------------------
// OLLAMA İLE AI CHAT
// ---------------------------------------------
aiRouter.post("/chat", async (req, res) => {
  try {
    const { shopId, messages } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, error: "shopId_missing" });
    }

    // 1) Mağaza var mı?
    const shopRef = db.collection("magazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return res.status(404).json({ ok: false, error: "shop_not_found" });
    }

    // 2) ÜRÜNLERİ TOPLA
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

    console.log("🔥 Toplam ürün:", allProducts.length);

    // 3) AI prompt içinde ürün listesi
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
- Ürün linklerini mutlaka ver.
- Fiyat ve kategoriye göre filtre yapabilirsin.
- Listede olmayan ürünü asla uydurma.
- Uygun ürün yoksa bunu söyle.

Mağazanın ürünleri:

${productListString}
`;

    // 4) Ollama Formatına Çevir
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 5) OLLAMA'YA İSTEK
    const ollamaResponse = await fetch(
      "http://127.0.0.1:11434/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:1.5b",
          messages: ollamaMessages,
          stream: false,
        }),
      }
    );

    const data = await ollamaResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Yanıt oluşturulamadı (Ollama'dan boş yanıt geldi).";

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
