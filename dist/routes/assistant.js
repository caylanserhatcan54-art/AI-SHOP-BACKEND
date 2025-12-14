import express from "express";
import { processChatMessage } from "../services/assistantService.js";
const router = express.Router();
/**
 * POST /api/assistant/:shopId
 * Body: { message, sessionId }
 */
router.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { message, sessionId } = req.body || {};
        if (!shopId) {
            return res.status(400).json({ reply: "shopId eksik.", products: [] });
        }
        if (!message || !String(message).trim()) {
            return res.json({ reply: "Bir şeyler yazabilirsin 😊", products: [] });
        }
        const result = await processChatMessage(shopId, sessionId || req.ip, String(message));
        return res.json(result);
    }
    catch (err) {
        console.error("❌ Assistant error:", err);
        return res.status(500).json({ reply: "Bir hata oluştu.", products: [] });
    }
});
/**
 * ✅ BACKWARD COMPAT:
 * POST /api/assistant/chat
 * Body: { shopId, message, sessionId }
 */
router.post("/chat", async (req, res) => {
    try {
        const { shopId, message, sessionId } = req.body || {};
        if (!shopId) {
            return res.status(400).json({ reply: "shopId eksik.", products: [] });
        }
        if (!message || !String(message).trim()) {
            return res.json({ reply: "Bir şeyler yazabilirsin 😊", products: [] });
        }
        const result = await processChatMessage(String(shopId), sessionId || req.ip, String(message));
        return res.json(result);
    }
    catch (err) {
        console.error("❌ Assistant /chat error:", err);
        return res.status(500).json({ reply: "Bir hata oluştu.", products: [] });
    }
});
export default router;
