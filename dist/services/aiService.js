"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAI = askAI;
const node_fetch_1 = __importDefault(require("node-fetch"));
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
async function askAI(prompt) {
    var _a, _b, _c;
    try {
        const response = await (0, node_fetch_1.default)("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "Sen bir e-ticaret danışmanısın. Kısa, net ve çözüm odaklı cevaplar ver."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
            }),
        });
        const aiResponse = await response.json();
        // Model farklı format döndürebildiği için güvenli extraction
        const result = ((_c = (_b = (_a = aiResponse === null || aiResponse === void 0 ? void 0 : aiResponse.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) ||
            (aiResponse === null || aiResponse === void 0 ? void 0 : aiResponse.text) ||
            JSON.stringify(aiResponse);
        return result;
    }
    catch (err) {
        console.error("🔥 AI ERROR:", err);
        return "Şu anda yanıt veremiyorum, lütfen tekrar deneyin.";
    }
}
