import { getProductListByStore, getStoreDetails } from "./dbService.js";
export async function getAIResponse(storeId, message) {
    const products = await getProductListByStore(storeId);
    const store = await getStoreDetails(storeId);
    if (!products.length) {
        return "Bu mağazada ürün bulunamadı.";
    }
    // Örnek basit öneri:
    if (message.includes("kazak") || message.includes("tişört")) {
        const firstItem = products[0];
        return `
Önerim: ${firstItem.name}
Fiyatı: ${firstItem.price || "Belirtilmemiş"}
Ürün Linki: ${firstItem.link || "-"}
`.trim();
    }
    return "Sorunu tam anlamadım, ürün ile ilgili tekrar sorabilirsin.";
}
