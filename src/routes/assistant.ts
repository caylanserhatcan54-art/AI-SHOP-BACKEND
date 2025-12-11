// src/routes/assistant.js
import { Router } from "express";
import { processChatMessage } from "../services/assistantService.js";

const router = Router();

/**
 * YAPAY ZEKA + ÜRÜN SİSTEMİ
 * Endpoint: POST /api/assistant/chat
 */
router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        ok: false,
        reply: "shopId ve message zorunludur!"
      });
    }

    // 🔥 Hem AI cevabı hem ürünler burada hazırlanıyor
    const result = await processChatMessage(shopId, message);

    return res.json({
      ok: true,
      reply: result.reply,      // Yapay zeka cevabı
      products: result.products // Ürün listesi (resim + link + fiyat)
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
