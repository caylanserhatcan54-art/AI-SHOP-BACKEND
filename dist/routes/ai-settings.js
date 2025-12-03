"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSettingsRouter = void 0;
const express_1 = require("express");
const firebase_admin_1 = require("../config/firebase-admin");
exports.aiSettingsRouter = (0, express_1.Router)();
/**
 * GET /ai-settings/:shopId
 * Mağazanın AI ayarlarını döner
 */
exports.aiSettingsRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const ref = firebase_admin_1.db
            .collection("shops")
            .doc(String(shopId))
            .collection("ai")
            .doc("settings");
        const snap = await ref.get();
        if (!snap.exists) {
            return res.json({
                ok: true,
                settings: {
                    logo: "",
                    storeName: "",
                    description: "",
                },
            });
        }
        return res.json({ ok: true, settings: snap.data() });
    }
    catch (err) {
        console.error(err);
        return res.json({ ok: false, error: "get_failed" });
    }
});
/**
 * POST /ai-settings/:shopId
 * Mağaza AI ayarlarını kaydeder
 */
exports.aiSettingsRouter.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { logo, storeName, description } = req.body;
        const ref = firebase_admin_1.db
            .collection("shops")
            .doc(String(shopId))
            .collection("ai")
            .doc("settings");
        await ref.set({
            logo,
            storeName,
            description,
            updatedAt: Date.now(),
        }, { merge: true });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.json({ ok: false, error: "save_failed" });
    }
});
