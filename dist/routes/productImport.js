import express from "express";
import { db } from "../config/firebase-admin.js";
const router = express.Router();
/**
 * 📌 Trendyol ürün import örneği
 * sen daha sonra gerçek API ekleyeceksin
 */
router.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { products } = req.body;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Products array is required" });
        }
        const batch = db.batch();
        products.forEach((product) => {
            const ref = db.collection("products").doc();
            batch.set(ref, {
                shopId,
                createdAt: new Date(),
                ...product,
            });
        });
        await batch.commit();
        return res.json({ success: true, count: products.length });
    }
    catch (err) {
        console.error("❌ Import error:", err);
        return res.status(500).json({ error: err.message });
    }
});
export default router;
