import { getProductsForShop } from "./productService.js";
export async function generateSmartReply(shopId, msg) {
    msg = msg.toLowerCase();
    const products = await getProductsForShop(shopId);
    if (!products || products.length === 0) {
        return "Mağazada kayıtlı ürün bulunamadı 😔";
    }
    // Ürün eşleşmesi
    const found = products.find(p => msg.includes(p.name.toLowerCase().split(" ")[0]));
    if (!found) {
        return "Tam anlayamadım, lütfen ürün adını tekrar söyler misiniz? 😊";
    }
    // Basit zeka cevabı
    const reply = `
🛍 *${found.name}*
💰 Fiyat: ${found.price}
🔗 Link: ${found.productUrl}

Bu ürün gayet kaliteli bir üründür. Kullanıcı geri dönüşleri oldukça olumlu. Tavsiye ederim 😊`;
    return reply;
}
