import { getProductsForShop } from "./productService.js";

export async function getAssistantReply(shopId: string, message: string) {
  const products = await getProductsForShop(shopId);

  if (!products || products.length === 0) {
    return "Mağazanızda ürün bulunamadı. Lütfen ürün ekleyin 😊";
  }

  const msgLower = message.toLowerCase();

  // Ürün arama
  const found = products.find(p => msgLower.includes(p.title.toLowerCase().split(" ")[0]));

  if (found) {
    return `
${found.title}
Fiyat: ${found.price}
Görsel:
${found.image}
Link:
${found.url}

Bu ürün tam aradığınıza uygun 👍
`;
  }

  // Kombin önerisi
  if (msgLower.includes("kombin")) {
    const sample = products.slice(0, 3);

    return `
Size şahane bir kombin öneriyorum 🧵✨

${sample.map(p => `⭐ ${p.title} — ${p.price}`).join("\n")}

👉 Bu kombin günlük kullanım için harika!
`;
  }

  return "Tam anlamadım fakat yardımcı olmak isterim 😊";
}
