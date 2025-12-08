import { Router } from "express";
import { firestoreAdmin } from "../config/firebase-admin.js";

const router = Router();

/*
 Ödeme başarılı olduğunda bu endpoint çağrılacak
 Body içeriği:
 {
   "shopId": "serhatshop",
   "plan": "premium"
 }
*/

router.post("/activate-subscription", async (req, res) => {
  try {
    const { shopId, plan } = req.body;

    const now = new Date();
    const renewDate = new Date();
    renewDate.setDate(now.getDate() + 30);

    await admin.firestore().collection("shops").doc(shopId).update({
      subscriptionActive: true,
      plan: plan,
      startDate: now.toISOString(),
      renewDate: renewDate.toISOString()
    });

    return res.json({ ok: true, message: "Abonelik aktif edildi 🔥" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false });
  }
});

export default router;
