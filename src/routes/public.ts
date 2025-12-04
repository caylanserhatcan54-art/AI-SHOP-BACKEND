import express from "express";
import admin from "firebase-admin";

export const publicRouter = express.Router();
const db = admin.firestore();

/**
 *  🔧 ÜRÜN TEMİZLEYİCİ
 *  Bozuk URL, boşluklar, reklam linkleri, kırılmış JSON alanları temizlenir.
 */
function cleanProduct(raw: any) {
  if (!raw) return null;

  // Reklam linkleri varsa hiç kaydetme
  if (raw.url && raw.url.includes("adservice.hepsiburada.com")) return null;

  try {
    const cleaned = {
      id: raw.id || "",
      productId: String(raw.productId || "")
        .replace(/[^0-9A-Za-z]/g, "")
        .trim(),
      title: (raw.title || "").trim(),
      price: (raw.price || "").trim(),
      image: (raw.image || "")
        .replace(/\s+/g, "") // Boşlukları temizle
        .replace("ht tps", "https")
        .replace("https:/ /", "https://")
        .replace("http:/ /", "http://"),
      url: (raw.url || "").replace(/\s+/g, ""),
      importedAt: raw.importedAt || Date.now(),
    };

    // Eğer title tamamen boşsa ürünü gösterme
    if (cleaned.title.length < 2) return null;

    return cleaned;
  } catch (e) {
    console.error("❌ Product clean error:", e);
    return null;
  }
}

/**
 *  🔧 Platform içindeki ürünleri getir + temizle
 */
async function getPlatformProducts(shopId: string, platformId: string) {
  const snap = await db
    .collection("magazalar")
    .doc(shopId)
    .collection("platformlar")
    .doc(platformId)
    .collection("urunler")
    .get();

  const arr: any[] = [];

  snap.docs.forEach((doc) => {
    const cleaned = cleanProduct(doc.data());
    if (cleaned) arr.push(cleaned);
  });

  return arr;
}

/**
 *  📌 TÜM PLATFORMLARI Getir (trendyol, hb, n11, amazon, shopier vs.)
 */
async function getPlatforms(shopId: string) {
  const platformsSnap = await db
    .collection("magazalar")
    .doc(shopId)
    .collection("platformlar")
    .get();

  const result: any[] = [];

  for (const doc of platformsSnap.docs) {
    const platformId = doc.id;
    const products = await getPlatformProducts(shopId, platformId);

    result.push({
      platform: platformId,
      products,
    });
  }

  return result;
}

/**
 *  📌 /api/public/shop/:shopId
 *  Mağaza bilgisi + platformlar + ürünler + temizlenmiş JSON
 */
publicRouter.get("/shop/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const shopRef = db.collection("magazalar").doc(shopId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      return res.json({ ok: false, error: "shop_not_found" });
    }

    const platforms = await getPlatforms(shopId);

    return res.json({
      ok: true,
      shop: { id: shopId, updatedAt: Date.now() },
      platforms,
    });
  } catch (err) {
    console.error("❌ Shop fetch error", err);
    res.json({ ok: false, error: "server_error" });
  }
});
