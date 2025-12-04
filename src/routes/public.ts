import { Router } from "express";
import { db } from "../config/firebase-admin";
import admin from "firebase-admin";

export const publicRouter = Router();

/**
 * GET /api/public/shop/:shopId
 * Public mağaza bilgisi + platformlar + ürünler
 */
publicRouter.get("/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    console.log("\n========================================");
    console.log("📌 İstek Alındı → /shop/" + shopId);
    console.log("🔥 FIREBASE PROJECT:", admin.app().options.projectId);

    // 🔥 Mağaza referansı
    const shopRef = db.collection("mağazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      console.log("❌ Belge bulunamadı:", `mağazalar/${shopId}`);
      console.log("========================================\n");
      return res.json({ ok: false, error: "shop_not_found" });
    }

    const shopData = shopSnap.data() || {};

    // 🔥 Platformları çek
    const platformsRef = shopRef.collection("platformlar");
    const platformsSnap = await platformsRef.get();

    let platforms: any[] = [];

    for (let doc of platformsSnap.docs) {
      const rawPlatformId = doc.id;

      // platform adı normalize et (trendyol.com → trendyol)
      const cleanPlatformName = rawPlatformId
        .replace(".com", "")
        .replace(".net", "")
        .replace(".org", "")
        .replace("www.", "")
        .trim();

      console.log("🔎 Platform bulundu:", rawPlatformId, "→", cleanPlatformName);

      // Ürünleri çek (ID URL encode olsa bile Firestore sorunsuz çeker!)
      const productsSnap = await platformsRef
        .doc(rawPlatformId)
        .collection("ürünler")
        .get();

      const products = productsSnap.docs.map((p) => {
        return {
          id: p.id,
          ...p.data(),
        };
      });

      platforms.push({
        platform: cleanPlatformName,
        products,
      });
    }

    console.log("✅ Mağaza ve platformlar başarıyla bulundu.");
    console.log("========================================\n");

    return res.json({
      ok: true,
      shop: { id: shopId, ...shopData },
      platforms,
    });
  } catch (err) {
    console.error("🚨 PUBLIC_SHOP_ERROR:", err);
    return res.json({ ok: false, error: "server_error" });
  }
});
