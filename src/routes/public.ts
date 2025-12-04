import { Router } from "express";
import { db } from "../config/firebase-admin";

export const publicRouter = Router();

/**
 * GET /api/public/shop/:shopId
 * Mağaza bilgisi + platformlar + ürünler
 */
publicRouter.get("/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    // ❗🔥 Sadece "magazalar" kullanılacak
    const shopRef = db.collection("magazalar").doc(shopId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: "shop_not_found",
      });
    }

    // Platformlar
    const platformsSnap = await shopRef.collection("platformlar").get();

    const platforms = [];
    for (const platformDoc of platformsSnap.docs) {
      const productsSnap = await platformRef(shopRef, platformDoc.id);
      platforms.push({
        platform: platformDoc.id,
        products: productsSnap,
      });
    }

    return res.json({
      ok: true,
      shop: {
        id: shopId,
        ...shopDoc.data(),
      },
      platforms,
    });
  } catch (err: any) {
    console.error("Public shop error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Platform ürünlerini okuyucu
async function platformRef(shopRef, platformId) {
  const productSnap = await shopRef
    .collection("platformlar")
    .doc(platformId)
    .collection("urunler")
    .get();

  return productSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}
