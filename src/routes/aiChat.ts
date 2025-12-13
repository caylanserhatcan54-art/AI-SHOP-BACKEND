// aiChat.ts (SADECE ROUTE)
import express from "express";
import { processChatMessage } from "../services/assistantService";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({ error: "shopId ve message zorunlu" });
    }

    const result = await processChatMessage(shopId, message);

    res.json({
      ok: true,
      reply: result.reply,
      products: result.products
    });
  } catch (e) {
    console.error("AI CHAT ERROR", e);
    res.status(500).json({ error: "AI hata verdi" });
  }
});

export default router;
