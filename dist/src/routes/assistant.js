import { Router } from "express";
import { generateSmartReply } from "../services/assistantService.js";
import { generateQr } from "../services/generateQr.js";
const router = Router();
// AI cevap endpointi
router.post("/reply", async (req, res) => {
    try {
        const { shopId, message } = req.body;
        if (!shopId || !message) {
            return res.status(400).json({ error: "shopId ve message gerekli" });
        }
        const reply = await generateSmartReply(shopId, message);
        res.json({
            ok: true,
            reply,
        });
    }
    catch (err) {
        console.error("Assistant Error", err);
        res.status(500).json({ error: "Assistant Error" });
    }
});
// QR üretme endpointi
router.post("/generate-qr", async (req, res) => {
    try {
        const { shopId } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: "shopId gerekli" });
        }
        const qr = await generateQr(shopId);
        return res.json({
            ok: true,
            qrUrl: qr.publicUrl,
            file: qr.fileName,
        });
    }
    catch (error) {
        console.error("QR ERROR:", error);
        res.status(500).json({ error: "QR üretilemedi" });
    }
});
export default router;
