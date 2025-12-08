import { db } from "../config/firebase-admin.js";
export async function getProductsForShop(shopId) {
    const snapshot = await db
        .collection("products")
        .where("shopId", "==", shopId)
        .get();
    const products = [];
    snapshot.forEach((doc) => products.push(doc.data()));
    return products;
}
