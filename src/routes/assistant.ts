import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";

const router = Router();

/**
 * GERÇEK YAPAY ZEKA CEVABI
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

    // 🔥 GERÇEK YAPAY ZEKA CEVABI
    const reply = await getAssistantReply(shopId, message);

    return res.json({
      ok: true,
      reply,
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
