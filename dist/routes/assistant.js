import { Router } from "express";
import { getAssistantReply } from "../services/assistantService.js";
export const assistantRouter = Router();
assistantRouter.post("/", async (req, res) => {
    try {
        const { shopId, msg } = req.body;
        if (!shopId || !msg) {
            return res.status(400).json({ error: "shopId ve msg gereklidir" });
        }
        const reply = await getAssistantReply(shopId, msg);
        return res.status(200).json({ reply });
    }
    catch (err) {
        console.error("Assistant ERROR:", err);
        return res.status(500).json({ error: "Assistant error" });
    }
});
