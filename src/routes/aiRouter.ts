import express from "express";
import { askAssistant } from "../services/assistantService.js";

const router = express.Router();

router.post("/:shopSlug", async (req, res) => {
  try {
    const shopSlug = req.params.shopSlug;
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "message alanı zorunludur" });
    }

    const response = await askAssistant(shopSlug, message);

    res.json(response);

  } catch (error: any) {
    console.log(error);
    res.status(500).json({ error: "Beklenmeyen bir hata oluştu" });
  }
});

export default router;
