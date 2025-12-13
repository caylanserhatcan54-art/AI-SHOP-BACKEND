import { Router } from "express";
import { processChatMessage } from "../services/assistantService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({
        error: "shopId and message required"
      });
    }

    const result = await processChatMessage(shopId, message);

    return res.json(result);
  } catch (err) {
    console.error("❌ AI Chat Error:", err);
    return res.status(500).json({
      error: "AI response failed"
    });
  }
});

export default router;
