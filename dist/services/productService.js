"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const firebase_admin_1 = require("../config/firebase-admin");
class ProductService {
    async getProducts(shopId) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId).collection("products");
        const snap = await ref.get();
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
    async addProduct(shopId, product) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId).collection("products");
        await ref.add(product);
        return true;
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
