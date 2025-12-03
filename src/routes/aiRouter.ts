import { Router } from "express";
import { generateAIReply } from "../services/aiService";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const { shopId, message, history } = req.body;

    console.log("📩 AI CHAT REQUEST:", { shopId, message });

    const reply = await generateAIReply(shopId, message, history);

    return res.json({ ok: true, reply });
  } catch (err: any) {
    console.error("🔥 AI CHAT ERROR:", err?.message || err);

    // Eğer LMStudio response error döndüyse logla
    if (err?.response) {
      const text = await err.response.text();
      console.error("🔥 LMSTUDIO RAW ERROR:", text);
    }

    return res.json({ ok: false, error: "chat_failed" });
  }
});
