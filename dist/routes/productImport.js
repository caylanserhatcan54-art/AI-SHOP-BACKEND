import { Router } from "express";
const router = Router();
router.post("/import", async (req, res) => {
    try {
        const { shopId, platform, products } = req.body;
        if (!shopId || !platform || !Array.isArray(products)) {
            return res.status(400).json({
                ok: false,
                error: "Eksik parametreler: shopId, platform, products",
            });
        }
        const shopRef = db.collection("magazalar").doc(shopId);
        const platformRef = shopRef.collection("platformlar").doc(platform);
        await shopRef.set({ id: shopId, updatedAt: Date.now() }, { merge: true });
        await platformRef.set({ platform, updatedAt: Date.now() }, { merge: true });
        let savedCount = 0;
        for (const p of products) {
            const productRef = platformRef.collection("urunler").doc(p.productId);
            await productRef.set({ ...p, importedAt: Date.now() }, { merge: true });
            savedCount++;
        }
        return res.json({
            ok: true,
            savedCount,
            platform,
            shopId,
        });
    }
    catch (err) {
        console.error("Import hata:", err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});
export default router;
