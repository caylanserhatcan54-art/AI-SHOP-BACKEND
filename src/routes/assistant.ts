import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";
import { getProductsForShop } from "../services/productService.js";

const router = Router();

/** Ürün için kısa açıklama üret */
function buildProductDescription(p) {
  const desc = [];

  // Kategoriye göre yorum
  if (p.category === "ayakkabi") {
    desc.push("Günlük kullanım için rahat bir model. Hem spor hem casual kombinlerle uyum sağlar.");
  }
  if (p.category === "giyim") {
    desc.push("Kumaş yapısı sayesinde gün boyu konfor sunar. Çoğu kombine kolay uyum sağlar.");
  }
  if (p.category === "elektronik") {
    desc.push("Performans odaklı, günlük kullanım için stabil bir cihaz.");
  }

  // Renge göre
  if (p.color) desc.push(`${p.color} tonları çoğu stile uyumludur.`);

  // Fiyata göre
  if (p.price) desc.push(`Fiyat/performans olarak dengeli bir ürün.`);

  return desc.join(" ");
}

/** Rastgele ürün seçimi */
function pickRandomProducts(list, max = 3) {
  const items = [...list];
  const selected = [];

  while (items.length && selected.length < max) {
    const i = Math.floor(Math.random() * items.length);
    selected.push(items[i]);
    items.splice(i, 1);
  }

  return selected;
}

/** 🔥 GERÇEK YAPAY ZEKA CEVABI */
router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        ok: false,
        reply: "shopId ve message zorunludur!"
      });
    }

    // AI cevabı
    const reply = await getAssistantReply(shopId, message);

    // Ürünleri çek
    const allProducts = await getProductsForShop(shopId);

    let products = [];

    if (allProducts.length > 0) {
      const random3 = pickRandomProducts(allProducts, 3);

      products = random3.map(p => ({
        title: p.title,
        price: p.price || "",
        url: p.url || "",
        imageUrl: p.imageUrl || "",
        description: buildProductDescription(p)
      }));
    }

    return res.json({
      ok: true,
      reply,
      products
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      ok: false,
      reply: "Yapay zeka cevap üretirken bir hata oluştu ❌"
    });
  }
});

export default router;
