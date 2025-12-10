import express from "express";
import { generateQr } from "../utils/generateQr.js";
const router = express.Router();
router.post("/create-qr", async (req, res) => {
    try {
        const { shopId } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: "shopId gerekli" });
        }
        const fileName = await generateQr(shopId);
        const qrUrl = `https://ai-shop-backend-2.onrender.com/qr/${fileName}`;
        return res.json({
            ok: true,
            shopId,
            qrUrl
        });
    }
    catch (err) {
        console.log("QR oluşturma hatası", err);
        return res.status(500).json({ error: "QR oluşturulamadı!" });
    }
});
export default router;
