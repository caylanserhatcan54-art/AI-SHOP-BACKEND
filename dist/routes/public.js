"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = require("express");
const firebase_admin_1 = require("../config/firebase-admin");
const firebase_admin_2 = __importDefault(require("firebase-admin"));
exports.publicRouter = (0, express_1.Router)();
exports.publicRouter.get("/shop/:shopId", async (req, res) => {
    try {
        const shopId = req.params.shopId;
        console.log("\n========================================");
        console.log("📌 İstek Alındı → /shop/" + shopId);
        // 🔥 Firestore projesi
        console.log("🔥 FIREBASE PROJECT:", firebase_admin_2.default.app().options.projectId);
        // 🔥 Tüm koleksiyonları listele
        const rootCollections = await firebase_admin_1.db.listCollections();
        console.log("🔥 ROOT COLLECTIONS:", rootCollections.map((c) => c.id));
        const shopRef = firebase_admin_1.db.collection("mağazalar").doc(shopId);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            console.log("❌ Belge bulunamadı:", `mağazalar/${shopId}`);
            console.log("========================================\n");
            return res.json({ ok: false, error: "shop_not_found" });
        }
        const shopData = shopSnap.data() || {};
        const platformsRef = shopRef.collection("platformlar");
        const platformsSnap = await platformsRef.get();
        let platforms = [];
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
    }
    catch (err) {
        console.error("🚨 PUBLIC_SHOP_ERROR:", err);
        return res.json({ ok: false, error: "server_error" });
    }
});
