import { Router } from "express";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const router = Router();

// === 📌 REGISTER SHOP ===
router.post("/register", async (req, res) => {
  try {
    const { shopId, shopName, platform } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId gerekli!" });
    }

    const dbPath = path.join(process.cwd(), "public", "shops.json");

    let shops = [];

    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, "utf8");
      shops = JSON.parse(fileData);
    }

    const exists = shops.find((s: any) => s.shopId === shopId);
    if (!exists) {
      shops.push({
        shopId,
        shopName: shopName || "Unnamed Store",
        platform: platform || "unknown",
        createdAt: Date.now(),
      });

      fs.writeFileSync(dbPath, JSON.stringify(shops, null, 2));
    }

    return res.json({
      ok: true,
      msg: "Shop registered successfully",
    });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "Register error", error });
  }
});


// === 📌 GET SHOP INFO ===
router.get("/get-shop/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const dbPath = path.join(process.cwd(), "public", "shops.json");

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ ok: false, msg: "Data file not found" });
    }

    const fileData = fs.readFileSync(dbPath, "utf8");
    const shops = JSON.parse(fileData);

    const shop = shops.find((s: any) => s.shopId === shopId);
    if (!shop) {
      return res.status(404).json({ ok: false, msg: "Shop not found" });
    }

    return res.json({ ok: true, shop });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "Get shop error", error });
  }
});


// === 📌 GENERATE QR ===
router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId gerekli!" });
    }

    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);

    const shopUrl = `https://ai-shop-site.vercel.app/qr/${shopId}`;

    await QRCode.toFile(qrPath, shopUrl);

    return res.json({
      ok: true,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
      shopUrl,
    });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "QR üretilemedi", error });
  }
});


export default router;
