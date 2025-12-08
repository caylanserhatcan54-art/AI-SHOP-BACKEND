import { getProductsForShop } from "./productService.js";

const keywords = {
  quality: ["kalite", "iyi mi", "dayanıklı mı", "nasıl ürün", "sağlam mı"],
  material: ["malzeme", "ne kumaş", "hangi malzeme", "kumaşı nedir", "neyden"],
  usage: ["nerede kullanılır", "hangi amaçla", "hangi iş için"],
  alternative: ["alternatif", "başka", "benzeri", "farklı renk", "uygun fiyat"],
  combine: ["kombin", "uyumlu", "ne ile gider", "neyle yakışır"]
};

function findMatches(products, msg) {
  const words = msg.toLowerCase().split(" ");
  return products.filter(p =>
    words.some(w => p.name.toLowerCase().includes(w))
  );
}

function recommendCombine(product) {
  if (!product) return null;

  if (product.category?.includes("tişört") || product.name.toLowerCase().includes("tişört")) {
    return [
      "Kot pantolon",
      "Keten şort",
      "Sneakers ayakkabı",
      "Mevsimlik ceket"
    ];
  }

  if (product.category?.includes("pantolon")) {
    return [
      "Basic tişört",
      "Triko kazak",
      "Spor ayakkabı"
    ];
  }

  if (product.category?.includes("elbise")) {
    return [
      "Askılı çanta",
      "Topuklu ayakkabı",
      "Hırka"
    ];
  }

  return null;
}

function generateUsage(product) {
  if (!product) return null;

  if (product.material?.toLowerCase().includes("pamuk")) {
    return "Pamuk yapısı sayesinde nefes alır, terletmez. Günlük kullanım için idealdir.";
  }

  if (product.name.toLowerCase().includes("spor")) {
    return "Spor aktiviteleri, yürüyüş ve günlük kullanım için uygundur.";
  }

  return "Günlük kullanım ve normal şartlarda rahatlıkla tercih edilebilir.";
}

export async function generateSmartReply(shopId, msg) {
  const products = await getProductsForShop(shopId);

  msg = msg.toLowerCase();
  const matches = findMatches(products, msg);

  // Eğer hiç ürün eşleşmiyorsa genel cevap
  if (matches.length === 0) {
    return "Tam anlamadım 😊 Lütfen ürün ismini tekrar söyler misiniz?";
  }

  const product = matches[0];

  let reply = `🛍 *${product.name}*\n💰 ${product.price}\n📎 Bağlantı: ${product.productUrl}\n\n`;

  if (keywords.quality.some(k => msg.includes(k))) {
    reply += "Bu üründe kalite olarak gayet memnun kalınmaktadır. Müşteri geri dönüşleri oldukça olumlu 👍\n";
  }

  if (keywords.material.some(k => msg.includes(k))) {
    reply += product.material
      ? `Ürünün ana malzemesi **${product.material}**'dır.\n`
      : "Ürün kaliteli kumaş içermektedir.\n";
  }

  if (keywords.usage.some(k => msg.includes(k))) {
    reply += generateUsage(product) + "\n";
  }

  if (keywords.combine.some(k => msg.includes(k))) {
    const combos = recommendCombine(product);
    if (combos) {
      reply += "\n🪄 Kombin önerisi:\n";
      reply += combos.map(c => `⭐ ${c}`).join("\n") + "\n";
    }
  }

  if (keywords.alternative.some(k => msg.includes(k))) {
    const cheap = products.filter(p => p.price < product.price).slice(0, 2);

    if (cheap.length > 0) {
      reply += "\nDaha uygun fiyatlı seçenekler 👇\n";
      cheap.forEach(p => {
        reply += `👉 ${p.name} - ${p.price}\n`;
      });
    }
  }

  return reply;
}
