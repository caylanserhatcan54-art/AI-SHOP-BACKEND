import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// REGISTER SHOP
router.post("/register", async (req, res) => {
  try {
    const { shopId, shopName, platform } = req.body;

    if (!shopId) {
      return res.status(400).json({ ok: false, msg: "shopId gerekli!" });
    }

    const dataPath = path.join(process.cwd(), "public", "shops.json");

    let shops = [];

    if (fs.existsSync(dataPath)) {
      const fileData = fs.readFileSync(dataPath, "utf8");
      shops = JSON.parse(fileData);
    }

    const exists = shops.find((s: any) => s.shopId === shopId);
    if (!exists) {
      shops.push({
        shopId,
        shopName: shopName || "Unnamed Store",
        platform: platform || "unknown",
        createdAt: Date.now()
      });

      fs.writeFileSync(dataPath, JSON.stringify(shops, null, 2));
    }

    res.json({ ok: true, msg: "Shop registered successfully" });

  } catch (e) {
    res.status(500).json({ ok: false, msg: "Error registering shop", e });
  }
});

export default router;
