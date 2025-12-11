// src/routes/shoproutes.ts
import { Router } from "express";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { db } from "../config/firebaseAdmin.js";

const router = Router();

const CLIENT_BASE_URL =
  process.env.CLIENT_BASE_URL || "https://flowai-client.vercel.app";


// --------------------------
// SHOP CREATE
// --------------------------
router.post("/create", async (req, res) => {
  try {
    const { shopId, shopName } = req.body;

    if (!shopId || !shopName) {
      return res.json({ ok: false, msg: "Eksik bilgi!" });
    }

    const shopUrl = `${CLIENT_BASE_URL}/shop/${shopId}`;

    await db.collection("magazalar").doc(shopId).set(
      {
        shopId,
        shopName,
        shopUrl,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // QR üret
    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);
    await QRCode.toFile(qrPath, shopUrl);

    return res.json({
      ok: true,
      shopUrl,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
    });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, msg: "Shop oluşturulamadı" });
  }
});


// --------------------------
// SHOP GET (FRONTEND BURAYI KULLANIYOR)
// --------------------------
router.get("/public/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const snap = await db.collection("magazalar").doc(shopId).get();

    if (!snap.exists) {
      return res.json({ ok: false, msg: "Shop bulunamadı ❌" });
    }

    return res.json({
      ok: true,
      shop: snap.data(),
    });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, msg: "Shop okunamadı!" });
  }
});

export default router;
