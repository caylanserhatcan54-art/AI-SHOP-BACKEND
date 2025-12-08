import { Router } from "express";
import { askAssistant } from "../services/assistantService.js";

const router = Router();

// POST /assistant/:shopId
router.post("/:shopId", async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await askAssistant(shopId, userMessage);

    return res.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Assistant Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Something went wrong",
    });
  }
});

export default router;
