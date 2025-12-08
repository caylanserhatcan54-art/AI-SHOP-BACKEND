import { db } from "../config/firebase-admin.js";

export async function getProductsForShop(shopId: string) {
  const platformsSnap = await db
    .collection("magazalar")
    .doc(shopId)
    .collection("platformlar")
    .get();

  let allProducts: any[] = [];

  for (const platformDoc of platformsSnap.docs) {
    const platformName = platformDoc.id;

    const productsSnap = await db
      .collection("magazalar")
      .doc(shopId)
      .collection("platformlar")
      .doc(platformName)
      .collection("urunler")
      .get();

    productsSnap.docs.forEach((doc) => {
      const data = doc.data();
      allProducts.push({
        id: doc.id,
        platform: platformName,
        ...data,
      });
    });
  }

  return allProducts;
}
