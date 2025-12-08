import express from "express";
import QRCode from "qrcode";
export const qrRouter = express.Router();
// ---- Her mağaza için QR + link üretici ----
qrRouter.get("/", async (req, res) => {
    try {
        const shopId = req.query.shop;
        if (!shopId) {
            return res.status(400).json({
                ok: false,
                error: "shopId_missing",
            });
        }
        // Mağazaya özel link
        const link = `https://flowai.app/${shopId}`;
        // QR PNG buffer oluştur
        const qrBuffer = await QRCode.toBuffer(link, {
            errorCorrectionLevel: "H",
            type: "png",
            width: 600,
            margin: 2,
        });
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", `attachment; filename="${shopId}-qr.png"`);
        return res.send(qrBuffer);
    }
    catch (err) {
        console.error("QR ERROR:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
