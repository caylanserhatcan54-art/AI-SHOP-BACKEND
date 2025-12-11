import { Router } from "express";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const router = Router();

// Sabit domain (ENV’den de alabilirsin)
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "https://flowai-client.vercel.app";

// ------------------------------
//  SHOP REGISTER
// ------------------------------
router.post("/register", async (req, res) => {
  try {
    const { shopId, shopName, platform } = req.body;

    if (!shopId || !shopName || !platform) {
      return res.json({ ok: false, msg: "Eksik bilgi!" });
    }

    const shopsDir = path.join(process.cwd(), "public", "shops");
    if (!fs.existsSync(shopsDir)) fs.mkdirSync(shopsDir, { recursive: true });

    const filePath = path.join(shopsDir, `${shopId}.json`);

    const data = {
      shopId,
      shopName,
      platform,
      shopUrl: `${CLIENT_BASE_URL}/shop/${shopId}`, // ✔ Kalıcı Domain
      createdAt: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.json({
      ok: true,
      msg: "Shop registered successfully",
      shopUrl: data.shopUrl,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.json({ ok: false, msg: "Shop register failed" });
  }
});


// ------------------------------
//  PUBLIC SHOP GET
// ------------------------------
router.get("/public/:shopId", (req, res) => {
  try {
    const { shopId } = req.params;

    const filePath = path.join(process.cwd(), "public", "shops", `${shopId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.json({ ok: false, msg: "Shop bulunamadı ❌" });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return res.json({ ok: true, shop: data });

  } catch (err) {
    console.error("PUBLIC ERROR:", err);
    return res.json({ ok: false, msg: "Shop okunamadı" });
  }
});


// ------------------------------
//  QR GENERATE
// ------------------------------
router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) return res.json({ ok: false, msg: "shopId gerekli!" });

    // Ana hedef: QR her zaman kalıcı domain'i kullansın!
    const shopUrl = `${CLIENT_BASE_URL}/shop/${shopId}`;

    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);

    await QRCode.toFile(qrPath, shopUrl);

    return res.json({
      ok: true,
      msg: "QR üretildi ✔",
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
      shopUrl: shopUrl,
    });

  } catch (err) {
    console.error("QR ERROR:", err);
    return res.json({ ok: false, msg: "QR üretilemedi" });
  }
});

export default router;
