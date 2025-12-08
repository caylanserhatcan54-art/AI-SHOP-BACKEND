import { getProductsForShop } from "./productService.js";
export async function generateSmartReply(shopId, text) {
    const products = await getProductsForShop(shopId);
    if (products.length === 0) {
        return "Henüz ürün bulunamadı 😊 Lütfen ürün ekleyin.";
    }
    // Kullanıcının ürün isteme ihtimali
    if (text.toLowerCase().includes("öner")) {
        const product = products[Math.floor(Math.random() * products.length)];
        return `Sana ${product.title} önerebilirim 😍\nFiyatı: ${product.price}\nPlatform: ${product.platform}`;
    }
    // Basit fallback gibi
    return "Tam anlamadım ama ürünler hakkında yardımcı olabilirim 😊";
}
