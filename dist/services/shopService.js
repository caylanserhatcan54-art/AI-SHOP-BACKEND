"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopService = exports.ShopService = void 0;
const firebase_admin_1 = require("../config/firebase-admin");
class ShopService {
    async getShop(shopId) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId);
        const doc = await ref.get();
        if (!doc.exists) {
            return null;
        }
        return doc.data();
    }
    async createShop(shopId, data) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId);
        await ref.set(data, { merge: true });
        return true;
    }
    async updateAISettings(shopId, settings) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId).collection("settings").doc("ai");
        await ref.set(settings, { merge: true });
        return true;
    }
    async getAISettings(shopId) {
        const ref = firebase_admin_1.db.collection("shops").doc(shopId).collection("settings").doc("ai");
        const doc = await ref.get();
        return doc.exists ? doc.data() : null;
    }
}
exports.ShopService = ShopService;
exports.shopService = new ShopService();
