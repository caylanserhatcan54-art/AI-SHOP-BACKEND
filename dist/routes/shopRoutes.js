import { Router } from "express";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
const router = Router();
const db = getFirestore();
// Domain
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "https://flowai.com";
// -------------------------------------------------------
// SHOP CREATE
// -------------------------------------------------------
router.post("/create", async (req, res) => {
    try {
        const { shopId, shopName, platform } = req.body;
        if (!shopId || !shopName || !platform) {
            return res.json({ ok: false, msg: "Eksik bilgi!" });
        }
        const shopRef = doc(db, "magazalar", shopId);
        await setDoc(shopRef, {
            shopId,
            shopName,
            platform,
            shopUrl: `${CLIENT_BASE_URL}/${shopId}`,
            createdAt: Date.now(),
        });
        return res.json({
            ok: true,
            msg: "Shop oluşturuldu ✔",
            shopUrl: `${CLIENT_BASE_URL}/${shopId}`,
        });
    }
    catch (err) {
        console.error("CREATE ERROR:", err);
        return res.json({ ok: false, msg: "Shop create failed" });
    }
});
// -------------------------------------------------------
// PUBLIC SHOP GET
// -------------------------------------------------------
router.get("/public/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const shopRef = doc(db, "magazalar", shopId);
        const snap = await getDoc(shopRef);
        if (!snap.exists()) {
            return res.json({ ok: false, msg: "Shop bulunamadı ❌" });
        }
        return res.json({
            ok: true,
            shop: snap.data(),
        });
    }
    catch (err) {
        console.error("PUBLIC ERROR:", err);
        return res.json({ ok: false, msg: "Shop okunamadı" });
    }
});
// -------------------------------------------------------
export default router;
