import axios from "axios";
export const chatController = async (req, res) => {
    try {
        const { shopId, message } = req.body;
        if (!shopId || !message) {
            return res.json({
                ok: false,
                error: "shopId ve message zorunludur!",
            });
        }
        // mağazanın ürünlerini çek
        const shopResponse = await axios.get(`https://ai-shop-backend-2.onrender.com/api/public/shop/${shopId}`);
        const products = shopResponse.data.platforms?.flatMap((p) => p.products) ?? [];
        // mesaj içeriğine göre basit yapay cevap
        let reply = "";
        if (products.length > 0) {
            reply = `
Bu mağazada **${products.length} ürün** buldum 🎯.

En çok satabilecek ürün önerim:
👉 **${products[0].title}**
💰 ${products[0].price}
🔗 ${products[0].url}

İstersen şu şekilde sorabilirsin:
- “Bana mont öner”
- “Spor tarz bir şey var mı?”
- “Hediye ne önerirsin?”
- “Bu ürünle kombin yap”
`;
        }
        else {
            reply = `
Şu anda mağazada ürün bulunamadı 😕  
Chrome uzantısını kurarak ürün ekleyebilirsin. 🎯
`;
        }
        return res.json({
            ok: true,
            reply,
            products,
        });
    }
    catch (err) {
        console.log("Chat error:", err);
        return res.json({
            ok: false,
            error: "Chat işleminde hata oluştu",
        });
    }
};
