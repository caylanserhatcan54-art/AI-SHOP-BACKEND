import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";
import { getProductsForShop } from "../services/productService.js";
import { normalizeText } from "../services/productService.js";

const router = Router();

/* --------------------------------------------------
   KULLANICI MESAJINDAN KATEGORİ ANLA
-------------------------------------------------- */
function detectCategoryFromMessage(message: string): string | null {
  const t = normalizeText(message);

  if (
    t.includes("ayakkabi") ||
    t.includes("bot") ||
    t.includes("spor ayakkabi") ||
    t.includes("sneaker")
  )
    return "ayakkabi";

  if (
    t.includes("kazak") ||
    t.includes("mont") ||
    t.includes("ceket") ||
    t.includes("pantolon") ||
    t.includes("elbise")
  )
    return "giyim";

  if (
    t.includes("telefon") ||
    t.includes("kilif") ||
    t.includes("kulaklik") ||
    t.includes("elektronik")
  )
    return "elektronik";

  return null;
}

/* --------------------------------------------------
   İKNA EDİCİ METİN – VARYASYONLU
-------------------------------------------------- */
function buildProductDescription(p: any): string {
  const copies: Record<string, string[]> = {
    ayakkabi: [
      "Günlük kullanımda çok rahat, uzun süre ayakta kalanlar için ideal.",
      "Hem spor hem casual kombinlerde çok şık duruyor.",
      "Tarzını yormadan güçlü bir görünüm sağlar.",
      "Ayağı saran yapısıyla konfor ve stil bir arada."
    ],
    giyim: [
      "Günlük kombinlerde kurtarıcı bir parça.",
      "Tek başına bile kombini taşıyabilecek kadar şık.",
      "Rahat kalıbı sayesinde gün boyu konfor sağlar.",
      "Dolabında uzun süre yer bulacak zamansız bir ürün."
    ],
    elektronik: [
      "Günlük kullanım için yeterli performans sunar.",
      "Fiyat/performans açısından dengeli bir tercih.",
      "İhtiyaçlarını sorunsuz şekilde karşılar."
    ],
    genel: [
      "Birçok kullanım senaryosuna uyum sağlar.",
      "Güvenle tercih edilebilecek bir ürün.",
      "Kullanışlı ve pratik bir seçim."
    ]
  };

  const list = copies[p.category] || copies["genel"];
  return list[Math.floor(Math.random() * list.length)];
}

/* --------------------------------------------------
   RASTGELE AMA TEKRARSIZ SEÇİM
-------------------------------------------------- */
function pickRandomProducts(list: any[], max = 3) {
  return [...list].sort(() => 0.5 - Math.random()).slice(0, max);
}

/* --------------------------------------------------
   CHAT ENDPOINT
-------------------------------------------------- */
router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        ok: false,
        reply: "shopId ve message zorunludur!",
        products: []
      });
    }

    /* 🔍 Kullanıcı niyeti */
    const detectedCategory = detectCategoryFromMessage(message);

    /* 🛒 Mağaza ürünleri */
    const allProducts = await getProductsForShop(shopId);

    /* 🎯 SADECE ALAKALI ÜRÜNLER */
    let filteredProducts = allProducts;

    if (detectedCategory) {
      filteredProducts = allProducts.filter(
        (p) => p.category === detectedCategory
      );
    }

    /* 🎲 Rastgele ama alakalı */
    const selectedProducts = pickRandomProducts(filteredProducts, 3);

    const products = selectedProducts.map((p) => ({
      title: p.title,
      price: p.price || "",
      url: p.url || "",
      imageUrl:
        p.imageUrl ||
        p.image ||
        p.image_url ||
        p.images ||
        "",
       description: buildProductDescription(p) + " " + ([
  "Bu ürün tam sana göre olabilir.",
  "Bunu tercih edenler genelde çok memnun kalıyor.",
  "Günlük kullanım için oldukça mantıklı bir seçim.",
  "Fiyatına göre sundukları gerçekten iyi.",
  "Tarzını yormadan şık duracak bir parça."
][Math.floor(Math.random() * 5)]),
    }));

    /* 🤖 AI metin cevabı */
    const reply = await getAssistantReply(shopId, message);

    return res.json({
      ok: true,
      reply,
      products
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      ok: false,
      reply: "Yapay zeka cevap üretirken bir hata oluştu ❌",
      products: []
    });
  }
});

export default router;
