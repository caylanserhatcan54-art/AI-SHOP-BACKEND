import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";
import { getProductsForShop, normalizeText } from "../services/productService.js";

const router = Router();

/* ---------------- KATEGORİ TESPİT ---------------- */
function detectCategoryFromMessage(message: string): string | null {
  const t = normalizeText(message);

  if (t.includes("ayakkabi") || t.includes("bot") || t.includes("sneaker"))
    return "ayakkabi";
  if (t.includes("mont") || t.includes("kazak") || t.includes("pantolon"))
    return "giyim";
  if (t.includes("telefon") || t.includes("kilif") || t.includes("kulaklik"))
    return "elektronik";

  return null;
}

/* ---------------- CHAT ---------------- */
router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        reply: "shopId ve message zorunlu",
        products: []
      });
    }

    const category = detectCategoryFromMessage(message);
    const allProducts = await getProductsForShop(shopId);

    let filtered = allProducts;
    if (category) {
      filtered = allProducts.filter(p => p.category === category);
    }

    const products = filtered.slice(0, 4).map(p => ({
      title: p.title,
      price: p.price || "",
      url: p.url || "",
      imageUrl: p.imageUrl || "",
    }));

    const reply = await getAssistantReply(shopId, message);

    return res.json({ reply, products });

  } catch (err) {
    console.error("ASSISTANT CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Bir hata oluştu ❌",
      products: []
    });
  }
});

export default router;
