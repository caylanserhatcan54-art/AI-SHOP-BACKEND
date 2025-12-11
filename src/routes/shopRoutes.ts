// src/routes/productImport.ts

import { Router } from "express";
import admin, { db } from "../config/firebaseAdmin.js";

const router = Router();

/**
 * Ürün import — Chrome extension buraya POST atıyor
 */
router.post("/import", async (req, res) => {
  try {
    const { shopId, platform, products } = req.body;

    if (!shopId || !platform || !products) {
      return res.json({ ok: false, msg: "Eksik bilgi gönderildi!" });
    }

    // Firestore batch
    const batch = db.batch();

    products.forEach((p: any) => {
      const ref = db
        .collection("magazalar")
        .doc(shopId)
        .collection("platformlar")
        .doc(platform)
        .collection("urunler")
        .doc(p.id || admin.firestore().collection("_").doc().id);

      batch.set(ref, p, { merge: true });
    });

    await batch.commit();

    return res.json({
      ok: true,
      msg: "Ürünler Firestore’a başarıyla aktarıldı ✔",
      count: products.length,
    });

  } catch (err) {
    console.error("IMPORT ERROR:", err);
    return res.json({
      ok: false,
      msg: "Ürün import sırasında hata oluştu",
    });
  }
});

export default router;
