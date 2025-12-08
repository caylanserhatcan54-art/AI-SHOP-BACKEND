import { Router } from "express";
import { getAIResponse } from "../services/assistantService";

const router = Router();

router.post("/", async (req, res) => {
  const { shopId, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required",
    });
  }

  const reply = await getAIResponse(shopId, message);

  res.json({
    success: true,
    reply: reply,
  });
});

export default router;
