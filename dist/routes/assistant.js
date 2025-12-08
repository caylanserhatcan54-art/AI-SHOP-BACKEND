import express from "express";
import { generateSmartReply } from "../services/assistantService.js";
const assistantRouter = express.Router();
assistantRouter.post("/", async (req, res) => {
    try {
        const { shopId, msg } = req.body;
        if (!shopId || !msg) {
            return res.status(400).json({ reply: "ShopID ve mesaj gerekli" });
        }
        const reply = await generateSmartReply(shopId, msg);
        return res.json({ reply });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Bir hata oluştu ⚠️" });
    }
});
export default assistantRouter;
