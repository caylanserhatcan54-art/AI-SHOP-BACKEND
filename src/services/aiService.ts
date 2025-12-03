import { db } from "../config/firebase-admin";
import { getProductsForPlatform } from "./productService";

export async function generateAIResponse(shopId: string, userMessage: string) {
  try {
    // 1) Mağaza ayarlarını çek
    const settingsSnap = await db.collection("shops").doc(shopId).collection("settings").doc("general").get();
    const settings = settingsSnap.exists ? settingsSnap.data() : null;

    // 2) Platform listesini çek
    const platformsSnap = await db.collection("shops").doc(shopId).collection("platforms").get();
    const platforms = platformsSnap.docs.map((d) => d.id);

    // 3) İlk platformdan ürünleri çek
    const platform = platforms.length > 0 ? platforms[0] : "manual";

    // ❗ IMPORTANT — getProductsForPlatform sadece 1 argüman alır
    const products = await getProductsForPlatform(platform);

    // 4) Basit AI cevabı (sen sonra LMStudio bağlayacaksın)
    const aiReply = `
Mağaza: ${settings?.storeName || "Bu mağaza"}

Mesaj: ${userMessage}

Toplam ürün sayısı: ${products.length}
İlk ürün: ${products[0]?.title || "Ürün bulunamadı"}
    `;

    return {
      success: true,
      reply: aiReply.trim(),
    };
  } catch (err: any) {
    console.error("AI Service Error →", err);
    return {
      success: false,
      error: err.message,
    };
  }
}
