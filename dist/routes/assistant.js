import express from "express";
import { processChatMessage } from "../services/assistantService.js";
const router = express.Router();
/**
 * POST /api/assistant/chat
 * BODY:
 * {
 *   shopId: "caylan",
 *   sessionId?: "abc123",
 *   message: "erkek gözlük"
 * }
 */
router.post("/chat", async (req, res) => {
    try {
        const { shopId, sessionId, message } = req.body;
        // 🔴 shopId zorunlu
        if (!shopId) {
            return res.status(400).json({
                reply: "Mağaza bilgisi eksik.",
                products: [],
            });
        }
        // 🔴 mesaj yoksa
        if (!message || !String(message).trim()) {
            return res.json({
                reply: "Bir şeyler yazabilirsin 😊",
                products: [],
            });
        }
        const result = await processChatMessage(shopId, sessionId || req.ip, // session fallback
        String(message));
        return res.json(result);
    }
    catch (err) {
        console.error("❌ Assistant error:", err);
        return res.status(500).json({
            reply: "Bir hata oluştu. Lütfen tekrar dene.",
            products: [],
        });
    }
});
export default router;
