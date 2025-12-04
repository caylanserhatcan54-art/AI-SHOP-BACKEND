import { Router } from "express";
import { db } from "../config/firebase-admin";
import admin from "firebase-admin";

export const publicRouter = Router();

/**
 * GET /api/public/shop/:shopId
 */
publicRouter.get("/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    console.log("\n========================================");
    console.log("📌 İstek Alındı → /shop/" + shopId);

    const shopRef = db.collection("mağazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      console.log("❌ Belge bulunamadı:", `mağazalar/${shopId}`);
      return res.json({ ok: false, error: "shop_not_found" });
    }

    const shopData = shopSnap.data() || {};

    // PLATFORMLARI AL
    const platformsRef = shopRef.collection("platformlar");
    const platformsSnap = await platformsRef.get();

    let platforms: any[] = [];

    for (let doc of platformsSnap.docs) {
      const rawPlatformId = doc.id;

      // Platformu görünüş için temizle
      const cleanPlatformName = rawPlatformId
        .replace(".com", "")
        .replace(".net", "")
        .replace(".org", "")
        .replace("www.", "")
        .trim();

      console.log("🔎 Platform:", rawPlatformId, "→ gösterim:", cleanPlatformName);

      // ÜRÜNLERİ ÇEK (Firestore'dan HER ZAMAN RAW ID ile çekmeliyiz)
      const productsSnap = await platformsRef
        .doc(rawPlatformId)   // ✔ DOĞRU PATH
        .collection("ürünler")
        .get();

      const products = productsSnap.docs.map((p) => ({
        id: p.id,
        ...p.data(),
      }));

      platforms.push({
        platform: cleanPlatformName, // müşteriye görünen isim
        rawPlatformId,               // gerçek platform ID (istersen kaldırabiliriz)
        products,
      });
    }

    console.log("✅ Platformlar ve ürünler bulundu.");
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
