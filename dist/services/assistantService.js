import { getProductsForShop } from "./productService.js";
export async function getAssistantReply(shopId, userMessage) {
    const products = await getProductsForShop(shopId);
    if (!products || products.length === 0) {
        return "Henüz mağazaya ürün eklenmemiş görünüyor 😊 Lütfen ürün ekleyin.";
    }
    const msgLower = userMessage.toLowerCase();
    // Basit ürün eşleştirme
    const found = products.find(p => msgLower.includes(p.title.toLowerCase().split(" ")[0]));
    if (found) {
        return `
🛍️ **${found.title}**
💰 Fiyat: ${found.price}

🖼️ Ürün Görseli:
${found.image}

🔗 Link:
${found.url}

Bu ürün aradığınıza gerçekten uygun 👍
`;
    }
    // Kombin öner
    if (msgLower.includes("kombin")) {
        const sample = products.slice(0, 3);
        return `
🧵 Kombin önerisi:

${sample.map(p => `⭐ ${p.title} — ${p.price}`).join("\n")}

Tarzınıza uygun öneri gibi duruyor ✨
`;
    }
    // Genel fallback
    return "Tam anlamadım fakat yardımcı olmak isterim 😊";
}
