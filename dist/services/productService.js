import { db } from "../config/firebase-admin";
export async function getProductsForPlatform(shopId) {
    try {
        const snap = await db
            .collection("shops")
            .doc(shopId)
            .collection("products")
            .get();
        let products = [];
        snap.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    }
    catch (err) {
        console.error("getProductsForPlatform ERROR:", err);
        return [];
    }
}
