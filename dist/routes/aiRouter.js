import express from "express";
import { getAIResponse } from "../services/assistantService.js";
const router = express.Router();
router.post("/", async (req, res) => {
    const { store_id, message } = req.body;
    if (!store_id || !message) {
        return res.status(400).json({
            message: "store_id ve message zorunludur.",
        });
    }
    try {
        const response = await getAIResponse(store_id, message);
        return res.json({ message: response });
    }
    catch (err) {
        console.error("Assistant Error:", err);
        return res.status(500).json({
            message: "Asistan şu anda yanıt veremiyor.",
        });
    }
});
export default router;
