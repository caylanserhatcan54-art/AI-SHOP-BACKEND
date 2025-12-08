import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase-admin";

export async function checkSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const shopId = req.headers["x-shop-id"];
    if (!shopId) {
      return res.status(400).json({ ok: false, message: "shopId eksik" });
    }

    const shopRef = await admin.firestore().collection("shops").doc(String(shopId)).get();

    if (!shopRef.exists) {
      return res.status(404).json({ ok: false, message: "Mağaza bulunamadı" });
    }

    const data = shopRef.data();

    if (!data?.subscriptionActive) {
      return res.status(403).json({
        ok: false,
        locked: true,
        message: "Abonelik aktif değil"
      });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: "Sunucu hatası" });
  }
}
