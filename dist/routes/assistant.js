import { Router } from "express";
import { processChatMessage } from "../services/assistantService.js";
const router = Router();
/* --------------------------------------------------
   AI SHOP ASSISTANT CHAT ENDPOINT
   POST /api/assistant/chat
-------------------------------------------------- */
router.post("/chat", async (req, res) => {
    try {
        const { shopId, message } = req.body;
        // 🔒 ZORUNLU KONTROL
        if (!shopId || !message) {
            return res.status(400).json({
                reply: "shopId ve message zorunludur",
                products: []
            });
        }
        // 🔥 TEK KAYNAK: TÜM MANTIK SERVİSTE
        const result = await processChatMessage(shopId, message);
        return res.json({
            reply: result.reply,
            products: result.products
        });
    }
    catch (err) {
        console.error("❌ ASSISTANT CHAT ERROR:", err);
        return res.status(500).json({
            reply: "Yapay zeka cevap üretirken bir hata oluştu ❌",
            products: []
        });
    }
});
export default router;
