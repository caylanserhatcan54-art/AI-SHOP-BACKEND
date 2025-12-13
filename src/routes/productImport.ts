import express from "express";
import { db } from "../config/firebaseAdmin.js";

const router = express.Router();

router.post("/import", async (req, res) => {
  try {
    const { shopId, platform, product } = req.body;

    // ✅ Artık 3’ü de zorunlu
    if (!shopId || !platform || !product) {
      return res.status(400).json({ error: "shopId, platform or product missing" });
    }

    // 🔥 payload platform her zaman doğru olsun
    const safePlatform = String(platform || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 50) || "unknown";

    // 🔥 HER ZAMAN ÇALIŞAN ID
    const safeProductId =
      String(product.productId || "")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 100) ||
      `auto_${Date.now()}`;

    console.log("📦 IMPORT", {
      shopId,
      platform: safePlatform,
      safeProductId,
      title: product.title
    });

    await db
      .collection("magazalar")
      .doc(shopId)
      .collection("platformlar")
      .doc(safePlatform)
      .collection("urunler")
      .doc(safeProductId)
      .set(
        {
          ...product,
          platform: safePlatform,       // ✅ her zaman yaz
          productId: safeProductId,     // ✅ normalize edilmiş id
          importedAt: Date.now()
        },
        { merge: true }
      );

    return res.json({ ok: true, platform: safePlatform, productId: safeProductId });
  } catch (e: any) {
    console.error("❌ IMPORT ERROR", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
