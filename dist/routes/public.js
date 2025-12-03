"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = require("express");
const firebase_admin_1 = require("../config/firebase-admin");
exports.publicRouter = (0, express_1.Router)();
/* --------------------------------------------------------
 *  PING — Render health check endpoint
 *  GET /api/public/ping
 * -------------------------------------------------------- */
exports.publicRouter.get("/ping", (req, res) => {
    return res.json({
        ok: true,
        message: "pong",
        time: new Date().toISOString(),
    });
});
/* --------------------------------------------------------
 *  GET /api/public/shop-info?shop=serhat
 *  Müşteri tarafı sohbet ekranı için mağaza bilgisi
 * -------------------------------------------------------- */
exports.publicRouter.get("/shop-info", async (req, res) => {
    try {
        const shopId = String(req.query.shop || "").trim();
        if (!shopId) {
            return res.json({ ok: false, error: "missing_shop" });
        }
        const shopRef = firebase_admin_1.db.collection("mağaza").doc(shopId);
        const snap = await shopRef.get();
        if (!snap.exists) {
            return res.json({
                ok: false,
                error: "shop_not_found",
            });
        }
        const data = snap.data() || {};
        return res.json({
            ok: true,
            shop: {
                id: shopId,
                name: data.name || shopId,
                logo: data.logo || null,
                categories: data.categories || [],
                welcomeMessage: data.welcomeMessage ||
                    "Merhaba! Size nasıl yardımcı olabilirim?",
                themeColor: data.themeColor || "#0066ff",
            },
        });
    }
    catch (err) {
        console.error("SHOP-INFO ERROR:", err);
        return res.json({ ok: false, error: "shop_info_failed" });
    }
});
/* --------------------------------------------------------
 *  POST /api/public/shop-settings
 *  Panelde mağaza AI ayarlarını kaydetmek için
 * -------------------------------------------------------- */
exports.publicRouter.post("/shop-settings", async (req, res) => {
    try {
        const { shopId, name, logo, welcomeMessage, themeColor, categories, } = req.body || {};
        if (!shopId) {
            return res.json({ ok: false, error: "missing_shopId" });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = String(name);
        if (logo !== undefined)
            updateData.logo = String(logo);
        if (welcomeMessage !== undefined)
            updateData.welcomeMessage = String(welcomeMessage);
        if (themeColor !== undefined)
            updateData.themeColor = String(themeColor);
        if (Array.isArray(categories))
            updateData.categories = categories;
        await firebase_admin_1.db.collection("mağaza").doc(String(shopId)).set(updateData, {
            merge: true,
        });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("SHOP-SETTINGS ERROR:", err);
        return res.json({ ok: false, error: "shop_settings_failed" });
    }
});
