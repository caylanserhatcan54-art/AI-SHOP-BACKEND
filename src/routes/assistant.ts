import express from "express";
import { processChatMessage } from "../services/assistantService.js";

const router = express.Router();

/**
 * POST /chat/:shopId
 * örnek: /chat/caylan
 */
router.post("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { message, sessionId } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        reply: "Eksik bilgi gönderildi.",
        products: [],
      });
    }

    const result = await processChatMessage(
      shopId,
      sessionId || req.ip,
      message
    );

    return res.json(result);
  } catch (err) {
    console.error("❌ Assistant error:", err);
    return res.status(500).json({
      reply: "Bir hata oluştu.",
      products: [],
    });
  }
});

export default router;
