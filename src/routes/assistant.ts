import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";

const router = Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Assistant test endpoint çalışıyor!" });
});

// POST endpoint
router.post("/", async (req, res) => {
  try {
    const { shopId, msg } = req.body;

    if (!shopId || !msg) {
      return res.status(400).json({ error: "shopId ve msg zorunludur" });
    }

    const reply = await getAssistantReply(shopId, msg);
    res.json({ reply });
  } catch (err) {
    console.error("Assistant Error:", err);
    res.status(500).json({ error: "AI cevap üretirken hata oluştu" });
  }
});

export default router;
