import { Router } from "express";
import { db } from "../config/firebaseAdmin.js";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { shopId, message } = req.body;

    if (!shopId || !message) {
      return res.status(400).json({ ok: false, msg: "Eksik bilgi!" });
    }

    // Basit yapay zeka placeholder cevabı (istersen gerçek AI bağlarız)
    const reply =
      "Bu mağaza için yapay zeka konuşma sistemi henüz bağlanmadı. Mesajınız: " +
      message;

    return res.json({
      ok: true,
      reply,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ ok: false, msg: "Sunucu hatası!" });
  }
});

export default router;
