import express from "express";
import { getAssistantReply } from "../services/assistantService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shopId = req.query.shopId as string;
    const message = req.query.message as string;

    if (!shopId || !message) {
      return res.status(400).json({ error: "shopId ve message gerekli" });
    }

    const reply = await getAssistantReply(shopId, message);

    return res.json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
