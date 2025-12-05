import { Router } from "express";
import fetch from "node-fetch";
import { askAI } from "../services/aiService";

const router = Router();

// Trendyol ürün import ROZET
router.post("/import/trendyol", async (req, res) => {
  try {
    const { shopId, url } = req.body;

    if (!shopId || !url) {
      return res.status(400).json({ ok: false, error: "Eksik parametre" });
    }

    // Trendyol product JSON çekme
    const response = await fetch(url);
    const html = await response.text();

    // Ürün başlığını almak için regex
    const titleMatch = html.match(/"name":"(.*?)"/);
    const brandMatch = html.match(/"brand":"(.*?)"/);

    const title = titleMatch ? titleMatch[1] : "Ürün";
    const brand = brandMatch ? brandMatch[1] : "";

    // AI prompt
    const prompt = `
Bu ürün: ${title}
Marka: ${brand}

Bu ürün için 300 kelimelik etkileyici bir açıklama yaz.
SEO odaklı olsun, müşteri ikna edilsin.
Satın almaya yönlendirsin.
`;

    const aiResponse = await askAI(prompt);

    const finalDescription =
      typeof aiResponse === "string"
        ? aiResponse
        : JSON.stringify(aiResponse);

    return res.json({
      ok: true,
      title,
      brand,
      ai_description: finalDescription,
    });

  } catch (err) {
    console.error("🔥 Product import error:", err);
    return res.status(500).json({ ok: false });
  }
});

export default router;
