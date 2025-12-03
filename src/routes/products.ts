import { Router } from "express";
import fetch from "node-fetch";
import { db } from "../config/firebase-admin";

export const productsRouter = Router();

/**
 * --------------------------------------------------------
 * ÜRÜN İMPORT (Chrome Extension)
 * --------------------------------------------------------
 * POST /products/import
 *
 * Body:
 * {
 *   "shopId": "serhat",          // Firestore: mağazalar/serhat
 *   "platform": "trendyol.com",
 *   "products": [
 *     { "title": "...", "price": "...", "image": "...", "url": "..." }
 *   ]
 * }
 */
productsRouter.post("/import", async (req, res) => {
  try {
    const { shopId, platform, products } = req.body;

    if (!shopId || !platform || !Array.isArray(products)) {
      return res.json({ ok: false, error: "missing_params" });
    }

    // Firestore yolu:
    // mağazalar/{shopId}/platformlar/{platform}/ürünler/{docId}
    const baseRef = db
      .collection("mağazalar")
      .doc(String(shopId))
      .collection("platformlar")
      .doc(String(platform))
      .collection("ürünler");

    let imported = 0;

    for (const p of products) {
      if (!p || !p.url) continue;

      const docId = encodeURIComponent(p.url); // aynı URL tekrar gelirse overwrite olsun
      await baseRef.doc(docId).set(
        {
          başlık: p.title || "",
          fiyat: p.price || "",
          görüntü: p.image || "",
          URL: p.url || "",
          güncellendi: Date.now(),
        },
        { merge: true }
      );
      imported++;
    }

    return res.json({
      ok: true,
      shopId,
      platform,
      imported,
    });
  } catch (err) {
    console.error("PRODUCT IMPORT ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, error: "product_import_failed" });
  }
});

/**
 * --------------------------------------------------------
 * ÜRÜN LİSTELEME
 * --------------------------------------------------------
 * GET /products/list?shopId=serhat&platform=trendyol.com
 */
productsRouter.get("/list", async (req, res) => {
  try {
    const { shopId, platform } = req.query;

    if (!shopId || !platform) {
      return res.json({ ok: false, error: "missing_params" });
    }

    const ref = db
      .collection("mağazalar")
      .doc(String(shopId))
      .collection("platformlar")
      .doc(String(platform))
      .collection("ürünler");

    const snapshot = await ref.get();
    const products: any[] = [];

    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    return res.json({
      ok: true,
      shopId,
      platform,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("PRODUCT LIST ERROR:", err);
    return res.status(500).json({ ok: false, error: "product_list_failed" });
  }
});

/**
 * --------------------------------------------------------
 * (Opsiyonel) AI ÜRÜN AÇIKLAMASI
 * --------------------------------------------------------
 * POST /products/ai/description
 */
productsRouter.post("/ai/description", async (req, res) => {
  try {
    const { title, description, platform } = req.body;

    if (!title) {
      return res.json({ ok: false, error: "missing_title" });
    }

    const LM_URL = "http://127.0.0.1:1234/v1/chat/completions";

    const prompt = `
Sen bir e-ticaret ürün açıklaması yazma uzmanısın.
Görevin: Ürün için SEO uyumlu, profesyonel ve yüksek dönüşüm sağlayan bir açıklama hazırlamak.

Ürün Başlığı: ${title}
Mevcut Açıklama: ${description || "Açıklama bulunmuyor"}
Platform: ${platform}

Aşağıdaki formatta kısa ve net cevap ver:
---
🎯 SEO Açıklaması:
(buraya ürünün detaylı açıklamasını yaz)

🔥 SEO Anahtar Kelimeler:
(virgülle ayrılmış 10 adet SEO kelime üret)
---
`;

    const response = await fetch(LM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3-vl-2b-instruct",
        messages: [
          {
            role: "system",
            content: "Sen profesyonel bir e-ticaret AI asistanısın.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    const data = await response.json();

    const output =
      data?.choices?.[0]?.message?.content ||
      "AI modelinden yanıt alınamadı.";

    return res.json({
      ok: true,
      result: output,
    });
  } catch (err) {
    console.error("AI DESCRIPTION ERROR:", err);
    return res.status(500).json({ ok: false, error: "ai_description_failed" });
  }
});

/**
 * --------------------------------------------------------
 * ÜRÜN SİLME
 * --------------------------------------------------------
 * DELETE /products/:shopId/:platform/:productId
 * --------------------------------------------------------
 */
productsRouter.delete("/:shopId/:platform/:productId", async (req, res) => {
  try {
    const { shopId, platform, productId } = req.params;

    if (!shopId || !platform || !productId) {
      return res.json({ ok: false, error: "missing_params" });
    }

    const docRef = db
      .collection("mağazalar")
      .doc(String(shopId))
      .collection("platformlar")
      .doc(String(platform))
      .collection("ürünler")
      .doc(String(productId));

    const snap = await docRef.get();
    if (!snap.exists) {
      return res.json({ ok: false, error: "product_not_found" });
    }

    await docRef.delete();

    return res.json({ ok: true, deleted: productId });
  } catch (err) {
    console.error("PRODUCT DELETE ERROR:", err);
    return res
      .status(500)
      .json({ ok: false, error: "product_delete_failed" });
  }
});
