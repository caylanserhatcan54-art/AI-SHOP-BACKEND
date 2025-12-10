import { Router } from "express";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const router = Router();

router.post("/register", (req, res) => {
  try {
    const { shopId, shopName, platform } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId eksik!" });
    }

    const shopsDir = path.join(process.cwd(), "public", "shops");
    if (!fs.existsSync(shopsDir)) fs.mkdirSync(shopsDir, { recursive: true });

    const shopData = {
      shopId,
      shopName: shopName || "Bilgi yok",
      platform: platform || "unknown",
      createdAt: Date.now(),
    };

    const fileContent = JSON.stringify(shopData, null, 2);

    fs.writeFileSync(
      path.join(shopsDir, `${shopId}.json`),
      fileContent.toString(), // ⭐ Buffer hatası çözüldü
      "utf-8"
    );

    res.json({ ok: true, msg: "Shop registered successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ ok: false, msg: "Shop kayıt hatası" });
  }
});

// QR Generate
router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId gerekli!" });
    }

    const qrDir = path.join(process.cwd(), "public", "qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${shopId}.png`);

    // ✔ Yeni frontend linki
    const shopUrl = `https://flowai-shop-panel-1-49viicxy9-serhats-projects-cbfdb63c.vercel.app/shop/${shopId}`;

    await QRCode.toFile(qrPath, shopUrl);

    res.json({
      ok: true,
      qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`,
      shopUrl,
    });

  } catch (e) {
    res.status(500).json({ ok: false, msg: "QR üretilemedi" });
  }
});

// ✨ İşte eksik olan GET endpoint
router.get("/public/:shopId", (req, res) => {
  try {
    const { shopId } = req.params;
    const shopFile = path.join(process.cwd(), "public", "shops", `${shopId}.json`);

    if (!fs.existsSync(shopFile)) {
      return res.json({ ok: false, msg: "Shop bulunamadı ❌" });
    }

    const shopData = JSON.parse(fs.readFileSync(shopFile, "utf-8"));

    res.json({ ok: true, shop: shopData });

  } catch (err) {
    res.status(500).json({ ok: false, msg: "Shop bilgisi alınamadı" });
  }
});

export default router;
