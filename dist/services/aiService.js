import fetch from "node-fetch";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export async function askAI(prompt) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        const result = aiResponse?.choices?.[0]?.message?.content ||
            aiResponse?.text ||
            JSON.stringify(aiResponse);
        return result;
    }
    catch (err) {
        console.error("🔥 AI ERROR:", err);
        return "Şu anda yanıt veremiyorum, lütfen tekrar deneyin.";
    }
}
