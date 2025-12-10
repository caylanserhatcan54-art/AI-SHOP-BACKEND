import { Router } from "express";
import { generateQr } from "../services/generateQr.js";
const router = Router();
// AI cevap endpointi
router.post("/generate-qr", async (req, res) => {
    try {
        const { shopId } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: "shopId gerekli" });
        }
        const qr = await generateQr(shopId);
        return res.json({
            ok: true,
            qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${qr.fileName}`,
        });
    }
    catch (error) {
        console.log("QR ERROR:", error);
        return res.status(500).json({ error: "QR üretilemedi" });
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
            qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${qr.fileName}`,
        });
    }
    catch (error) {
        console.log("QR ERROR:", error);
        return res.status(500).json({ error: "QR üretilemedi" });
    }
});
export default router;
