import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";

export const aiRouter = Router();

aiRouter.post("/", async (req, res) => {
  const { shopId, msg } = req.body;

  if (!shopId || !msg) {
    return res.status(400).json({ error: "shopId ve msg gerekli" });
  }

  const reply = await getAssistantReply(shopId, msg);

  return res.status(200).json({ reply });
});
