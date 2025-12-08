import express from "express";
import dotenv from "dotenv";
import { firestoreAdmin } from "../config/firebase-admin.js";

dotenv.config();
const router = express.Router();

router.post("/create-payment", async (req: any, res: any) => {
  try {
    const { shopId, plan } = req.body;

    const price = plan === "premium" ? 899 : 499;

    const redirectUrl = `https://ai-shop-backend-2.onrender.com/payment/success?shopId=${shopId}&plan=${plan}`;

    return res.json({
      ok: true,
      checkoutUrl: `https://iyzico-sanal-link.com/pay?amount=${price}&redirect=${redirectUrl}`
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err });
  }
});

// PAYMENT SUCCESS CALLBACK
router.get("/success", async (req: any, res: any) => {
  const { shopId, plan } = req.query;

  const now = Date.now();
  const activeUntil = now + 1000 * 60 * 60 * 24 * 30; // +30 gün

  await db.collection("shops").doc(shopId).update({
    plan,
    activeUntil
  });

  return res.json({ ok: true, message: "Plan aktif edildi!" });
});

export default router;
