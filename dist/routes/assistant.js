import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";
import { getProductsForShop } from "../services/productService.js";
const router = Router();
/* --------------------------------------------------
   ÜRÜN İÇİN KISA + İKNA EDİCİ AÇIKLAMA
-------------------------------------------------- */
function buildProductDescription(p) {
    const desc = [];
    // Kategoriye göre yorum
    if (p.category === "ayakkabi") {
        desc.push("Günlük kullanımda oldukça rahat bir model. Spor ve casual kombinlerle çok iyi uyum sağlar.");
    }
    if (p.category === "giyim") {
        desc.push("Kumaş yapısı sayesinde gün boyu konfor sunar. Birçok kombinle rahatlıkla kullanılabilir.");
    }
    if (p.category === "elektronik") {
        desc.push("Günlük kullanım için yeterli performans sunan, dengeli bir ürün.");
    }
    // Renk vurgusu
    if (p.color) {
        desc.push(`${p.color} tonlarıyla şık ve zamansız bir görünüm sunar.`);
    }
    // Genel ikna cümlesi
    desc.push("Tarzını tamamlayabilecek, ihtiyaç duyduğun anlarda seni yarı yolda bırakmayacak bir ürün.");
    return desc.join(" ");
}
/* --------------------------------------------------
   RASTGELE ÜRÜN SEÇ (HEP AYNI GELMESİN)
-------------------------------------------------- */
function pickRandomProducts(list, max = 3) {
    const items = [...list];
    const selected = [];
    while (items.length > 0 && selected.length < max) {
        const index = Math.floor(Math.random() * items.length);
        selected.push(items[index]);
        items.splice(index, 1);
    }
    return selected;
}
/* --------------------------------------------------
   CHAT ENDPOINT
   POST /api/assistant/chat
-------------------------------------------------- */
router.post("/chat", async (req, res) => {
    try {
        const { shopId, message } = req.body;
        if (!shopId || !message) {
            return res.status(400).json({
                ok: false,
                reply: "shopId ve message zorunludur!",
                products: [],
            });
        }
        /* ---------------- AI METİN CEVABI ---------------- */
        const reply = await getAssistantReply(shopId, message);
        /* ---------------- MAĞAZA ÜRÜNLERİ ---------------- */
        const allProducts = await getProductsForShop(shopId);
        let products = [];
        if (allProducts.length > 0) {
            // Rastgele 3 ürün seç
            const randomProducts = pickRandomProducts(allProducts, 3);
            products = randomProducts.map((p) => ({
                title: p.title,
                price: p.price || "",
                url: p.url || "",
                imageUrl: p.imageUrl ||
                    p.image ||
                    p.image_url ||
                    p.images ||
                    "",
                description: buildProductDescription(p),
            }));
        }
        /* ---------------- RESPONSE ---------------- */
        return res.json({
            ok: true,
            reply,
            products,
        });
    }
    catch (err) {
        console.error("CHAT ERROR:", err);
        return res.status(500).json({
            ok: false,
            reply: "Yapay zeka cevap üretirken bir hata oluştu ❌",
            products: [],
        });
    }
});
export default router;
