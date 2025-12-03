"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIReply = generateAIReply;
const node_fetch_1 = __importDefault(require("node-fetch"));
// AI Yanıt Üretici Servis
async function generateAIReply(shopId, message, history) {
    try {
        const LM_URL = process.env.LMSTUDIO_API_URL;
        const MODEL = process.env.LM_MODEL;
        console.log("🚀 LMStudio'ya istek gönderiliyor...");
        console.log("📡 URL:", LM_URL);
        console.log("🤖 MODEL:", MODEL);
        // Mesaj formatı LMStudio için
        const formattedHistory = history.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
        }));
        const body = {
            model: MODEL,
            messages: [
                { role: "system", content: "You are FlowAI Assistant" },
                ...formattedHistory,
                { role: "user", content: message }
            ]
        };
        console.log("📤 SEND BODY:", JSON.stringify(body, null, 2));
        const response = await (0, node_fetch_1.default)(LM_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        console.log("📡 LMStudio STATUS:", response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ LMStudio RESPONSE ERROR:", errorText);
            throw new Error("LMStudio API error");
        }
        const data = await response.json();
        console.log("📥 LMStudio RAW RESPONSE:", data);
        const reply = data?.choices?.[0]?.message?.content || "Bir yanıt üretilemedi.";
        return reply;
    }
    catch (err) {
        console.error("🔥 generateAIReply ERROR:", err);
        throw err;
    }
}
