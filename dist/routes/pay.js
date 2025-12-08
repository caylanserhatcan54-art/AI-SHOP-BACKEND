import { Router } from "express";
const router = Router();
/*
BODY:
{
  token: string,
  planType: "standard" | "premium",
  paymentReference: string
}
*/
router.post("/activate_plan", async (req, res) => {
    const { token, planType, paymentReference } = req.body;
    if (!token || !planType) {
        return res.json({ ok: false, message: "Eksik bilgi var" });
    }
    try {
        const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        const shopId = decoded.shopId;
        const now = Date.now();
        const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 gün
        await admin.firestore().collection("shops").doc(shopId).update({
            activePlan: planType,
            paymentReference,
            planActivatedAt: now,
            planExpiresAt: expiresAt
        });
        return res.json({
            ok: true,
            message: "Plan başarıyla aktif edildi",
            expiresAt
        });
    }
    catch (err) {
        console.log(err);
        return res.json({ ok: false, message: "Plan aktivasyonunda hata oluştu" });
    }
});
export default router;
