import { Router } from "express";
import { getAIResponse } from "../services/assistantService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true, message: "Assistant API working" });
});

router.post("/", async (req, res) => {
  const { shopId, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required",
    });
  }

  const reply = await getAIResponse(shopId, message);

  return res.json({
    success: true,
    reply,
  });
});

export default router;
