import express from "express";
import { getAssistantReply } from "../services/assistantService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shopId = req.query.shopId as string;
    const message = req.query.message as string;

    if (!shopId || !message) {
      return res.status(400).json({ error: "shopId ve message zorunludur" });
    }

    const reply = await getAssistantReply(shopId, message);

    return res.json({
      reply: reply,
    });

  } catch (err) {
    return res.status(500).json({ error: "Bir hata oluştu" });
  }
});

export default router;
