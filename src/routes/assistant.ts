import express from "express";
import { db } from "../config/firebase-admin.js";


const router = express.Router();

router.post("/", async (req, res) => {
  const { store_id, message } = req.body;

  if (!store_id || !message) {
    return res.status(400).json({
      message: "store_id ve message zorunludur",
    });
  }

  const reply = await getAIResponse(store_id, message);
  return res.json({ message: reply });
});

export default router;
