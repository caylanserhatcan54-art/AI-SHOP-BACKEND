import { Router } from "express";
import { processChatMessage } from "../services/assistantService.js";

const router = Router();

/* --------------------------------------------------
   AI SHOP ASSISTANT CHAT ENDPOINT
   POST /chat/:shopId
-------------------------------------------------- */
router.post("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { message } = req.body;

    // 🔒 ZORUNLU KONTROLLER
    if (!shopId) {
      return res.status(400).json({
        reply: "shopId bulunamadı ❌",
        products: [],
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Mesaj boş olamaz 😊",
        products: [],
      });
    }

    // 🔥 TEK KAYNAK: TÜM MANTIK SERVİSTE
    const result = await processChatMessage(shopId, message);

    return res.json({
      reply: result.reply,
      products: result.products,
    });
  } catch (err) {
    console.error("❌ ASSISTANT CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Şu anda geçici bir sorun var, biraz sonra tekrar dener misin? 🙏",
      products: [],
    });
  }
});

export default router;
