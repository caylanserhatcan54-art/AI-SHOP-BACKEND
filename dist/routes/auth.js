"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const firebase_admin_1 = require("../config/firebase-admin"); // 🔥 ÖNEMLİ
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.authRouter = (0, express_1.Router)();
/**
 * REGISTER
 */
exports.authRouter.post("/register", async (req, res) => {
    try {
        console.log("➡️ REGISTER HIT:", req.body);
        const { email, password, shopName } = req.body;
        if (!email || !password || !shopName) {
            return res.json({ success: false, error: "missing_fields" });
        }
        const userRef = firebase_admin_1.db.collection("users").doc(email);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            return res.json({ success: false, error: "email_already_exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const shopId = Date.now().toString();
        await userRef.set({
            email,
            password: hashedPassword,
            shopId,
            shopName,
            createdAt: new Date(),
        });
        await firebase_admin_1.db.collection("shops").doc(shopId).set({
            name: shopName,
            ownerEmail: email,
            plan: "standard",
            createdAt: new Date(),
        });
        return res.json({
            success: true,
            shopId,
            email,
            shopName,
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});
/**
 * LOGIN
 */
exports.authRouter.post("/login", async (req, res) => {
    try {
        console.log("➡️ LOGIN HIT:", req.body);
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, error: "missing_fields" });
        }
        const userRef = firebase_admin_1.db.collection("users").doc(email);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return res.json({ success: false, error: "user_not_found" });
        }
        const user = userSnap.data();
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok) {
            return res.json({ success: false, error: "wrong_password" });
        }
        return res.json({
            success: true,
            token: Math.random().toString(36).substring(2),
            shopId: user.shopId,
            shopName: user.shopName,
            email: user.email,
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});
