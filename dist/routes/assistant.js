import express from "express";
import { generateSmartReply } from "../services/assistantService.js";
const router = express.Router();
// POST /api/assistant
router.post("/", async (req, res) => {
    try {
        const { shopId, msg } = req.body;
        if (!shopId || !msg) {
            return res.status(400).json({ error: "shopId ve msg zorunludur" });
        }
        const reply = await generateSmartReply(shopId, msg);
        res.json({ reply });
    }
    catch (err) {
        console.error("Assistant Error:", err);
        res.status(500).json({ error: "Asistan cevap üretemedi" });
    }
});
export default router;
