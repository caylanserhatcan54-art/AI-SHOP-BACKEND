import { getProductsForShop } from "./productService.js";

export async function generateSmartReply(shopId: string, msg: string) {
  try {
    // 1. Mesajı normalize edelim
    const minimizedMsg = msg.toLowerCase().trim();

    // 2. Ürünleri çek
    const products = await getProductsForShop(shopId);

    if (!products || products.length === 0) {
      return "Henüz mağazaya ürün eklenmemiş görünüyor 😊 Lütfen ürün ekleyin.";
    }

    // 3. Aranan ürün var mı? (fuzzy search gibi)
    const foundProduct = products.find(p =>
      minimizedMsg.includes(p.title?.toLowerCase().split(" ")[0]) ||
      minimizedMsg.includes(p.productId?.toLowerCase())
    );

    // Eğer ürün bulunursa AI gibi konuş:
    if (foundProduct) {
      return createProductExplanation(foundProduct);
    }

    // 4. Soru ürün sormuyor gibi ise genel cevap
    if (minimizedMsg.includes("kombin") || minimizedMsg.includes("yakışır mı")) {
      return generateCombinationAdvice(products);
    }

    if (minimizedMsg.includes("fiyat")) {
      return generatePriceInfo(products);
    }

    // Default cevap
    return "Tam anlayamadım ama yardımcı olmak isterim 😊 Ürün ismi söyleyebilirsin!";

  } catch (err) {
    return "Şu anda cevap oluştururken hata oluştu ⚠️";
  }
}

// 🔥 Ürün açıklaması — Sanki AI ürün analizi yapıyormuş gibi
function createProductExplanation(product: any) {
  let response = `💡 Bu ürün hakkında bilgi vereyim:\n\n`;

  response += `✨ **${product.title}**\n`;

  if (product.price) response += `💰 Güncel Fiyatı: ${product.price}\n`;
  if (product.image) response += `🖼️ Görsel Linki: ${product.image}\n`;

  // Özel ürün değerlendirmesi
  response += `\n🧵 Malzeme & Kalite Yorumu:\n`;
  response += `Bu ürün kullanım açısından oldukça kaliteli bir yapıya sahip. Rahat, uzun ömürlü 
ve günlük kullanım için ideal bir parça. Özellikle hareketli kullanımda konfor sağlıyor.\n\n`;

  // Kullanım alanı
  response += `🎯 Hangi durumda kullanılır?\n`;
  response += `✔ Günlük kullanım\n✔ İş yerinde hafif spor şıklığı\n✔ Dışarı çıkarken stil sahibi görünüm\n\n`;

  // Kombin önerisi
  response += `👕 Kombin önerisi:\n`;
  response += `• Üzerine açık renk slim fit pantolon ile şık durur\n`;
  response += `• Spor sneaker ile tamamlanabilir 🏃‍♂️\n\n`;

  return response;
}

// 🔥 Genel kombin önerisi
function generateCombinationAdvice(products: any[]) {
  const suggestion = products.slice(0, 2);

  let reply = `🧠 Kombin önerilerim:\n\n`;

  suggestion.forEach(p => {
    reply += `👉 ${p.title} ile şık bir stil oluşturabilirsin.\n`;
  });

  reply += `\nAltına sade sneaker ile tamamlayabilirsin 😎`;

  return reply;
}

// 🔥 Genel fiyat değerlendirmesi
function generatePriceInfo(products: any[]) {
  const cheapest = products.sort((a, b) => extractPrice(a.price) - extractPrice(b.price))[0];
  const expensive = products.sort((a, b) => extractPrice(b.price) - extractPrice(a.price))[0];

  return `💰 Fiyat analizi yapayım:\n\n` +
    `🟢 En uygun ürün: ${cheapest.title} → ${cheapest.price}\n` +
    `🔴 En yüksek fiyatlı ürün: ${expensive.title} → ${expensive.price}\n\n` +
    `Genel olarak fiyatlar dengeli görünüyor 👍`;
}

// TL fiyatı matematiksel değere çevirme
function extractPrice(price: string) {
  return parseFloat(price.replace(/[^\d,]/g, "").replace(",", "."));
}
