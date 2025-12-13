import express from "express";
import { db } from "../config/firebaseAdmin.js";
const router = express.Router();
router.post("/import", async (req, res) => {
    try {
        const { shopId, product } = req.body;
        if (!shopId || !product) {
            return res.status(400).json({ error: "shopId or product missing" });
        }
        const platform = product.platform || "unknown";
        // 🔥 HER ZAMAN ÇALIŞAN ID
        const safeProductId = String(product.productId || "")
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .slice(0, 100) ||
            `auto_${Date.now()}`;
        console.log("📦 IMPORT", {
            shopId,
            platform,
            safeProductId,
            title: product.title
        });
        await db
            .collection("magazalar")
            .doc(shopId)
            .collection("platformlar")
            .doc(platform)
            .collection("urunler")
            .doc(safeProductId)
            .set({
            ...product,
            productId: safeProductId,
            importedAt: Date.now()
        }, { merge: true });
        return res.json({ ok: true });
    }
    catch (e) {
        console.error("❌ IMPORT ERROR", e);
        return res.status(500).json({ error: e.message });
    }
});
export default router;
