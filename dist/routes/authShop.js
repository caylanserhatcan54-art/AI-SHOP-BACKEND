import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export const authShopRouter = express.Router();
authShopRouter.post("/register_shop", async (req, res) => {
    try {
        const { shopName, email, password } = req.body;
        if (!shopName || !email || !password) {
            return res.status(400).json({ ok: false, error: "Eksik bilgi gönderildi." });
        }
        const db = admin.firestore();
        const shopRef = db.collection("shops").doc(email);
        const shopSnap = await shopRef.get();
        if (shopSnap.exists) {
            return res.status(400).json({ ok: false, error: "Bu e-mail ile mağaza zaten kayıtlı." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await shopRef.set({
            shopName,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
        });
        return res.json({ ok: true, message: "Mağaza kaydı başarılı" });
    }
    catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
});
authShopRouter.post("/login_shop", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ ok: false, error: "Eksik bilgi gönderildi." });
        const db = admin.firestore();
        const shopRef = db.collection("shops").doc(email);
        const shopSnap = await shopRef.get();
        if (!shopSnap.exists) {
            return res.status(400).json({ ok: false, error: "Mağaza bulunamadı." });
        }
        const shopData = shopSnap.data();
        const isMatch = await bcrypt.compare(password, shopData.password);
        if (!isMatch) {
            return res.status(400).json({ ok: false, error: "Şifre hatalı" });
        }
        const token = jwt.sign({ email, shopName: shopData.shopName }, process.env.JWT_SECRET || "flowai-secret", { expiresIn: "7d" });
        return res.json({ ok: true, token });
    }
    catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
});
export default authShopRouter;
