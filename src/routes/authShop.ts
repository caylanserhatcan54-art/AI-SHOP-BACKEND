import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { admin } from "../config/firebase-admin";

export const authShopRouter = express.Router();
const db = admin.firestore();

/**
 * REGISTER SHOP
 */
authShopRouter.post("/register_shop", async (req, res) => {
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

    const hashedPass = await bcrypt.hash(password, 10);

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
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * LOGIN SHOP
 */
authShopRouter.post("/login_shop", async (req, res) => {
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

    const isPasswordCorrect = await bcrypt.compare(password, shop.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ ok: false, error: "Şifre hatalı" });
    }

    const token = jwt.sign(
      { shopId: shop.id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

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
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default authShopRouter;
