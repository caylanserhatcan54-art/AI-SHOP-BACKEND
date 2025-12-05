"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authShopRouter = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_admin_1 = require("../config/firebase-admin");
exports.authShopRouter = express_1.default.Router();
const db = firebase_admin_1.admin.firestore();
/**
 * REGISTER SHOP
 */
exports.authShopRouter.post("/register_shop", async (req, res) => {
    try {
        const { email, password, shopName } = req.body;
        if (!email || !password || !shopName) {
            return res.status(400).json({ ok: false, error: "Eksik veri" });
        }
        const exists = await db
            .collection("shops")
            .where("email", "==", email)
            .get();
        if (!exists.empty) {
            return res.status(400).json({ ok: false, error: "Bu email ile kayıt var" });
        }
        const hashedPass = await bcryptjs_1.default.hash(password, 10);
        const newShop = {
            email,
            shopName,
            password: hashedPass,
            active: true,
            createdAt: Date.now(),
        };
        const docRef = await db.collection("shops").add(newShop);
        return res.json({
            ok: true,
            shopId: docRef.id,
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ ok: false, error: e.message });
    }
});
/**
 * LOGIN SHOP
 */
exports.authShopRouter.post("/login_shop", async (req, res) => {
    try {
        const { email, password } = req.body;
        const snapshot = await db
            .collection("shops")
            .where("email", "==", email)
            .get();
        if (snapshot.empty) {
            return res.status(400).json({ ok: false, error: "Mağaza bulunamadı" });
        }
        const shop = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        const isPasswordCorrect = await bcryptjs_1.default.compare(password, shop.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ ok: false, error: "Şifre hatalı" });
        }
        const token = jsonwebtoken_1.default.sign({ shopId: shop.id }, process.env.JWT_SECRET || "secret123", { expiresIn: "7d" });
        return res.json({
            ok: true,
            token,
            shop: {
                id: shop.id,
                email: shop.email,
                shopName: shop.shopName,
                active: shop.active,
            },
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({ ok: false, error: e.message });
    }
});
exports.default = exports.authShopRouter;
