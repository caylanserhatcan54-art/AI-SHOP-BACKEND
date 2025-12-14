import express from "express";
import { processChatMessage } from "../services/assistantService.js";
const router = express.Router();
// POST /api/assistant/:shopId
router.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { message, sessionId } = req.body;
        if (!message) {
            return res.json({
                reply: "Bir şeyler yazabilirsin 😊",
                products: [],
            });
        }
        const result = await processChatMessage(shopId, sessionId || req.ip, message);
        res.json(result);
    }
    catch (err) {
        console.error("❌ Assistant error:", err);
        res.status(500).json({
            reply: "Bir hata oluştu.",
            products: [],
        });
    }
});
export default router;
