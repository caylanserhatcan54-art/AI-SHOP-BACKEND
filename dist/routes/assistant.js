// src/routes/assistant.ts
import { Router } from "express";
import { processChatMessage } from "../services/assistantService.js";
const router = Router();
/* --------------------------------------------------
   AI SHOP ASSISTANT CHAT ENDPOINT
   POST /api/assistant/chat
   (shopId BODY'den gelir)
-------------------------------------------------- */
router.post("/chat", async (req, res) => {
    try {
        const { shopId, message } = req.body;
        if (!shopId || !message) {
            return res.status(400).json({ reply: "Eksik bilgi", products: [] });
        }
        const result = await processChatMessage(shopId, message);
        return res.json(result);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ reply: "Sunucu hatası", products: [] });
    }
});
/* --------------------------------------------------
   AI SHOP ASSISTANT CHAT ENDPOINT
   POST /api/assistant/:shopId
   (shopId URL'den gelir)
-------------------------------------------------- */
router.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { message } = req.body;
        // 🔒 ZORUNLU KONTROLLER
        if (!shopId || typeof shopId !== "string") {
            return res.status(400).json({
                reply: "shopId bulunamadı ❌",
                products: [],
            });
        }
        if (!message || typeof message !== "string") {
            return res.status(400).json({
                reply: "Mesaj boş olamaz 😊",
                products: [],
            });
        }
        const result = await processChatMessage(shopId, message);
        return res.json({
            reply: result.reply,
            products: result.products,
        });
    }
    catch (err) {
        console.error("❌ ASSISTANT /:shopId ERROR:", err);
        return res.status(500).json({
            reply: "Şu anda geçici bir sorun var, biraz sonra tekrar dener misin? 🙏",
            products: [],
        });
    }
});
export default router;
