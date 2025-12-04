import { Router } from "express";
import { getFirestore } from "firebase-admin/firestore";

const router = Router();
const db = getFirestore();

/**
 * Ürün Import Endpointi
 * POST /products/import
 */
router.post("/import", async (req, res) => {
  try {
    const { shopId, platform, products } = req.body;

    if (!shopId || !platform || !Array.isArray(products)) {
      return res.status(400).json({
        ok: false,
        error: "Eksik parametreler: shopId, platform, products gerekli.",
      });
    }

    const shopRef = db.collection("magazalar").doc(shopId);
    const platformRef = shopRef.collection("platformlar").doc(platform);

    // Mağaza dokümanı yoksa otomatik oluştur
    await shopRef.set(
      {
        id: shopId,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // Platform dokümanı yoksa oluşturalım
    await platformRef.set(
      {
        platform: platform,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    let savedCount = 0;

    for (const p of products) {
      if (!p.productId) continue;

      const productRef = platformRef.collection("urunler").doc(p.productId);

      await productRef.set(
        {
          ...p,
          productId: p.productId,
          importedAt: Date.now(),
        },
        { merge: true }
      );

      savedCount++;
    }

    return res.json({
      ok: true,
      shopId,
      platform,
      savedCount,
      message: `${savedCount} ürün kaydedildi.`,
    });
  } catch (err: any) {
    console.error("Import hata:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
