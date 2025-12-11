// src/routes/productImport.ts

import { Router } from "express";
import admin, { db } from "../config/firebaseAdmin.js";

const router = Router();

/**
 * Ürün import — Chrome extension buraya POST atıyor
 * Endpoint: POST /api/import/:shopId
 */
router.post("/:shopId", async (req, res) => {
  const { shopId } = req.params;
  const { platform, product } = req.body;

  if (!platform || !product) {
    return res.status(400).json({
      ok: false,
      msg: "platform ve product gönderilmesi zorunludur!",
    });
  }

  try {
    // Eğer ürün id yoksa Firestore random doc id üretelim:
    const productId = product.id || db.collection("_").doc().id;

    const ref = db
      .collection("magazalar")
      .doc(shopId)
      .collection("platformlar")
      .doc(platform)
      .collection("urunler")
      .doc(productId);

    await ref.set(product, { merge: true });

    return res.json({
      ok: true,
      msg: "Ürün başarıyla kaydedildi ✔",
      productId,
    });

  } catch (error) {
    console.error("IMPORT ERROR:", error);
    return res.status(500).json({
      ok: false,
      msg: "Ürün kaydı sırasında hata oluştu ❌",
    });
  }
});

export default router;
