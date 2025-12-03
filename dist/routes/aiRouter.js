"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const aiService_1 = require("../services/aiService");
exports.aiRouter = (0, express_1.Router)();
exports.aiRouter.post("/chat", async (req, res) => {
    try {
        const { shopId, message, history } = req.body;
        console.log("📩 AI CHAT REQUEST:", { shopId, message });
        const reply = await (0, aiService_1.generateAIReply)(shopId, message, history);
        return res.json({ ok: true, reply });
    }
    catch (err) {
        console.error("🔥 AI CHAT ERROR:", err?.message || err);
        // Eğer LMStudio response error döndüyse logla
        if (err?.response) {
            const text = await err.response.text();
            console.error("🔥 LMSTUDIO RAW ERROR:", text);
        }
        return res.json({ ok: false, error: "chat_failed" });
    }
});
