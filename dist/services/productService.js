"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsForPlatform = getProductsForPlatform;
const firebase_admin_1 = require("../config/firebase-admin");
async function getProductsForPlatform(shopId) {
    try {
        const snap = await firebase_admin_1.db
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
