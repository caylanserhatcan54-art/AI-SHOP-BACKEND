// src/routes/aiChat.ts

import { Router } from "express";
import { generateSmartReply } from "../services/assistantService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        error: "shopId and message required"
      });
    }

    const reply = await generateSmartReply(shopId, message);

    return res.json({
      reply
    });
  } catch (err) {
    console.error("❌ AI Chat Error:", err);
    return res.status(500).json({
      error: "AI response failed"
    });
  }
});

export default router;
