import { Router } from "express";
import { generateQr } from "../utils/generateQr.js";
import fs from "fs";


const router = Router();

router.post("/generate-qr", async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({ error: "shopId gerekli" });
    }

    const qr = await generateQr(shopId);

    return res.json({
      ok: true,
      qrUrl: `https://ai-shop-backend-2.onrender.com/api/shop/get-qr/${qr.fileName}`,
    });

  } catch (err) {
    console.error("QR ERROR:", err);
    res.status(500).json({ error: "QR üretilemedi" });
  }
});


router.get("/get-qr/:name", (req, res) => {
  const fileName = req.params.name;

  const filePath = `/tmp/qr/${fileName}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("QR bulunamadı");
  }

  return res.sendFile(filePath);
});

export default router;
