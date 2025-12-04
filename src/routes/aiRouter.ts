import express, { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";

export const aiRouter = express.Router();
const db = getFirestore();

/* ----------------------------------------------
   1) KULLANICI SORUSUNU GROQ İLE ANALİZ ET
   (Kategori / alt kategori / renk / amaç vs.)
-----------------------------------------------*/
async function analyzeQuestionWithGroq(userMessage: string) {
  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL, // örn: llama-3.1-8b-instant
          messages: [
            {
              role: "system",
              content: `
Sen bir ürün sınıflandırma motorusun.
Görevin: Kullanıcının sorusundan kategori / alt kategori / renk / amaç / cinsiyet gibi filtreler çıkarmaktır.

SADECE AŞAĞIDAKİ JSON FORMATINI DÖN:
{
  "category": "...",
  "subCategory": "...",
  "color": "...",
  "occasion": "...",
  "gender": "..."
}

Bilmediğin alanları boş bırak ("").
Açıklama yazma, sadece JSON döndür.
`,
            },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const data = await groqRes.json();

    if (data?.error) {
      console.error("🔥 Groq analyze error:", data.error);
      return {};
    }

    const content = data?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("🔥 analyzeQuestionWithGroq exception:", err);
    return {};
  }
}

/* ----------------------------------------------
   2) FİLTREYE GÖRE FIRESTORE'DAN ÜRÜN ÇEK (MAX 20)
-----------------------------------------------*/
async function getFilteredProducts(shopId: string, filters: any) {
  const shopRef = db.collection("magazalar").doc(shopId);
  const platformsSnap = await shopRef.collection("platformlar").get();

  const matched: any[] = [];

  for (const platformDoc of platformsSnap.docs) {
    const productsSnap = await platformDoc.ref.collection("urunler").get();

    productsSnap.forEach((p) => {
      const product: any = p.data();

      const text = (
        (product.title || "") +
        " " +
        (product.description || "") +
        " " +
        (product.category || "") +
        " " +
        (product.color || "")
      ).toLowerCase();

      let score = 0;

      if (filters?.category && text.includes(String(filters.category).toLowerCase())) {
        score += 3;
      }
      if (filters?.subCategory && text.includes(String(filters.subCategory).toLowerCase())) {
        score += 3;
      }
      if (filters?.color && text.includes(String(filters.color).toLowerCase())) {
        score += 2;
      }
      if (filters?.occasion && text.includes(String(filters.occasion).toLowerCase())) {
        score += 1;
      }

      // Hiç filtre çıkmadıysa, son eklenen ürünlere ağırlık ver
      const importedAt = product.importedAt || 0;

      matched.push({
        ...product,
        platform: platformDoc.id,
        score,
        importedAt,
      });
    });
  }

  // Eğer hiç filtre yoksa: importedAt'e göre sırala
  const hasAnyFilter =
    filters?.category ||
    filters?.subCategory ||
    filters?.color ||
    filters?.occasion ||
    filters?.gender;

  if (hasAnyFilter) {
    matched.sort((a, b) => b.score - a.score);
  } else {
    matched.sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0));
  }

  // Maks 20 ürün
  return matched.slice(0, 20);
}

/* ----------------------------------------------
   3) GROQ İLE SATIŞ ODAKLI YANIT OLUŞTUR
-----------------------------------------------*/
async function generateSalesReply(products: any[], messages: any[]) {
  if (!products.length) {
    // Ürün yoksa, yine de Groq’a "mağazada ürün yok" diyerek kibar yanıt aldıralım
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `
Sen FlowAI'nın profesyonel e-ticaret satış asistanısın.
Mağazada uygun ürün yoksa müşteriye bunu nazikçe belirt ve alternatif olarak
farklı kategori / renk / fiyat aralığı deneyebileceğini söyle.
`,
            },
            ...messages,
          ],
        }),
      }
    );

    const data = await groqRes.json();
    if (data?.error) {
      console.error("🔥 Groq sales (no products) error:", data.error);
      return "Şu anda mağazada talebine uygun ürün bulamadım. Farklı bir ürün türü, renk veya fiyat aralığı denemek ister misin?";
    }

    return (
      data?.choices?.[0]?.message?.content ||
      "Şu anda mağazada talebine uygun ürün bulamadım. Farklı bir ürün türü, renk veya fiyat aralığı denemek ister misin?"
    );
  }

  // Ürünleri çok uzun olmasın diye hafif kırp
  const productText = products
    .map((p) => {
      const title = String(p.title || "").slice(0, 120);
      const price = p.price || p.fiyat || "";
      const url = p.url || "";
      const image = p.image || p.resim || "";
      const platform = p.platform || "";

      return `• ${title}
   Fiyat: ${price}
   Platform: ${platform}
   Link: ${url}
   Görsel: ${image}`;
    })
    .join("\n\n");

  const salesPrompt = `
Sen FlowAI'nın profesyonel e-ticaret satış asistanısın.

Görevin:
- Müşterinin ihtiyacına göre bu listedeki ürünlerden en uygun 3–5 tanesini önermek.
- Her öneride ürün linkini, görselini ve fiyatını belirt.
- Satış odaklı, sıcak, ikna edici ama dürüst ol.
- Uyumlu ürünleri kombin olarak önerebilirsin (örneğin kazak + pantolon).
- Çok satan / popüler ürünleri vurgulayabilirsin.
- Mümkünse müşteriye 1 kısa ek soru sor (beden, bütçe, kullanım amaç vs.).

Mağazadaki uygun ürünler:

${productText}
`;

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL,
          messages: [
            { role: "system", content: salesPrompt },
            ...messages,
          ],
        }),
      }
    );

    const data = await groqRes.json();

    if (data?.error) {
      console.error("🔥 Groq sales error:", data.error);
      return "Şu anda yanıt üretirken bir sorun oluştu, lütfen tekrar dener misin?";
    }

    return (
      data?.choices?.[0]?.message?.content ||
      "Şu anda yanıt üretirken bir sorun oluştu, lütfen tekrar dener misin?"
    );
  } catch (err) {
    console.error("🔥 generateSalesReply exception:", err);
    return "Şu anda yanıt üretirken bir hata oluştu, lütfen tekrar dener misin?";
  }
}

/* ----------------------------------------------
   ANA ENDPOINT
-----------------------------------------------*/
aiRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const { shopId, messages } = req.body;

    if (!shopId || !messages) {
      return res.status(400).json({ ok: false, error: "missing_params" });
    }

    // Mağaza var mı?
    const shopRef = db.collection("magazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return res.status(404).json({ ok: false, error: "shop_not_found" });
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    // 1) Soru analiz (kategori / renk / amaç)
    const filters = await analyzeQuestionWithGroq(userMessage);
    console.log("🔥 Filters:", filters);

    // 2) Firestore’dan ilgili ürünleri çek
    const products = await getFilteredProducts(shopId, filters);
    console.log("🔥 Selected products:", products.length);

    // 3) Satış odaklı yanıt üret
    const reply = await generateSalesReply(products, messages);

    return res.json({
      ok: true,
      filters,
      productCount: products.length,
      reply,
    });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
