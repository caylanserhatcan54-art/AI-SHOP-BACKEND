// src/routes/shoproutes.ts
import { Router } from "express";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { db } from "../config/firebaseAdmin.js";

const router = Router();

const CLIENT_BASE_URL =
  process.env.CLIENT_BASE_URL || "https://flowai-client.vercel.app";

/* ============================
   SHOP CREATE
============================ */
router.post("/create", async (req, res) => {
  try {
    const { shopId, shopName, platform } = req.body;

    if (!shopId || !shopName || !platform) {
      return res.json({ ok: false, msg: "Eksik bilgi!" });
    }

    const shopUrl = `${CLIENT_BASE_URL}/shop/${shopId}`;

    await db.collection("magazalar").doc(shopId).set({
      shopId,
      shopName,
      platform,
      shopUrl,
      createdAt: Date.now(),
    });

    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);
    await QRCode.toFile(qrPath, shopUrl);

    return res.json({
      ok: true,
      msg: "Shop oluşturuldu ✔",
      shopUrl,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
    });
  } catch (err) {
    console.error("SHOP CREATE ERROR:", err);
    return res.json({ ok: false, msg: "Shop create failed" });
  }
});

/* ============================
   PUBLIC SHOP GET
============================ */
router.get("/public/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const snap = await db.collection("magazalar").doc(shopId).get();

    if (!snap.exists) {
      return res.json({ ok: false, msg: "Shop bulunamadı ❌" });
    }

    return res.json({ ok: true, shop: snap.data() });
  } catch (err) {
    console.error("PUBLIC ERROR:", err);
    return res.json({ ok: false, msg: "Shop okunamadı" });
  }
});

export default router;
