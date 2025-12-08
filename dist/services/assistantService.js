import { getProductsForShop } from "./productService.js";
export async function generateSmartReply(shopId, text) {
    const products = await getProductsForShop(shopId);
    if (products.length === 0) {
        return "Henüz mağazaya ürün eklenmemiş 😊 Lütfen ürün ekleyin.";
    }
    // Eğer ürün önerisi isteniyorsa
    if (text.toLowerCase().includes("öner") ||
        text.toLowerCase().includes("ürün") ||
        text.toLowerCase().includes("tavsiye")) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        return `
🛍️ Sana harika bir ürün öneriyorum:

📌 Ürün: ${randomProduct.baslik || randomProduct.title}
💰 Fiyat: ${randomProduct.fiyat || randomProduct.price}
🛒 Platform: ${randomProduct.platform}
🔗 Link: ${randomProduct.URL || "Bulunamadı"}

😉 Başka ürün arıyorsan söyle!
    `;
    }
    // Basit cevap
    return "Tam anlayamadım ama yardımcı olmak isterim 😊 Ürün ismi söyleyebilirsin!";
}
