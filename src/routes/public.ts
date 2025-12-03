import { Router } from "express";
import { db } from "../config/firebase-admin";

export const publicRouter = Router();

/**
 * --------------------------------------------------------
 * GET /api/public/shop-info?shop=serhat
 * Mağaza bilgilerini döndürür (AI chat ekranı için)
 * --------------------------------------------------------
 */
publicRouter.get("/shop-info", async (req, res) => {
  try {
    const shopId = String(req.query.shop || "").trim();

    if (!shopId) {
      return res.json({ ok: false, error: "missing_shop" });
    }

    // Firestore: mağaza/{shopId}
    const shopRef = db.collection("mağaza").doc(shopId);
    const snap = await shopRef.get();

    if (!snap.exists) {
      return res.json({
        ok: false,
        error: "shop_not_found",
      });
    }

    const data = snap.data() || {};

    return res.json({
      ok: true,
      shop: {
        id: shopId,
        name: data.name || shopId,
        logo: data.logo || null,
        categories: data.categories || [],
        welcomeMessage:
          data.welcomeMessage ||
          "Merhaba, mağazamıza hoş geldiniz! Size nasıl yardımcı olabilirim?",
        themeColor: data.themeColor || "#0066ff",
      },
    });
  } catch (err) {
    console.error("SHOP-INFO ERROR:", err);
    return res.json({ ok: false, error: "shop_info_failed" });
  }
});

/**
 * --------------------------------------------------------
 * POST /api/public/shop-settings
 * Body: { shopId, name?, logo?, welcomeMessage?, themeColor?, categories? }
 * Mağaza AI ayarlarını kaydeder (panelden)
 * --------------------------------------------------------
 */
publicRouter.post("/shop-settings", async (req, res) => {
  try {
    const {
      shopId,
      name,
      logo,
      welcomeMessage,
      themeColor,
      categories,
    } = req.body || {};

    if (!shopId) {
      return res.json({ ok: false, error: "missing_shopId" });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = String(name);
    if (logo !== undefined) updateData.logo = String(logo);
    if (welcomeMessage !== undefined)
      updateData.welcomeMessage = String(welcomeMessage);
    if (themeColor !== undefined) updateData.themeColor = String(themeColor);
    if (Array.isArray(categories)) updateData.categories = categories;

    await db.collection("mağaza").doc(String(shopId)).set(updateData, {
      merge: true,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("SHOP-SETTINGS ERROR:", err);
    return res.json({ ok: false, error: "shop_settings_failed" });
  }
});
