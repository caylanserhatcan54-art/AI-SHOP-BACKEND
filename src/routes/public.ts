import { Router } from "express";
import { db } from "../config/firebase-admin";
import admin from "firebase-admin";

export const publicRouter = Router();

publicRouter.get("/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    console.log("\n========================================");
    console.log("📌 İstek Alındı → /shop/" + shopId);

    // 🔥 DOĞRU DEBUG — Admin SDK üzerinden projectId alma
    console.log("🔥 FIREBASE PROJECT:", admin.app().options.projectId);

    // 🔥 Firestore root koleksiyonlarını göster
    const rootCollections = await db.listCollections();
    console.log(
      "🔥 ROOT COLLECTIONS:",
      rootCollections.map((c) => c.id)
    );

    // mağazalar
    const shopRef = db.collection("mağazalar").doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      console.log("❌ Belge bulunamadı:", `mağazalar/${shopId}`);
      console.log("========================================\n");
      return res.json({ ok: false, error: "shop_not_found" });
    }

    const shopData = shopSnap.data() || {};

    // platformlar
    const platformsRef = shopRef.collection("platformlar");
    const platformsSnap = await platformsRef.get();

    let platforms: any[] = [];

    for (let doc of platformsSnap.docs) {
      const platformName = doc.id;

      const productsSnap = await platformsRef
        .doc(platformName)
        .collection("ürünler")
        .get();

      const products = productsSnap.docs.map((p) => ({
        id: p.id,
        ...p.data(),
      }));

      platforms.push({
        platform: platformName,
        products,
      });
    }

    console.log("✅ Mağaza bulundu:", `mağazalar/${shopId}`);
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
