// src/services/assistantService.ts

import {
  Product,
  getProductsForShop,
  normalizeText,
} from "./productService.js";

type Intent =
  | "GREETING"
  | "SMALL_TALK"
  | "ASK_PRICE"
  | "ASK_STOCK"
  | "ASK_COLOR"
  | "ASK_SIZE"
  | "ASK_MATERIAL"
  | "ASK_USAGE"
  | "ASK_SUITABILITY"
  | "ASK_RECOMMENDATION"
  | "ASK_COMBINATION"
  | "ASK_SHIPPING"
  | "ASK_RETURN"
  | "TRACK_ORDER"
  | "COMPLAINT"
  | "UNKNOWN";

// Kullanıcı absürt/uyumsuz kombin söylediğinde engelle
function rejectAbsurdIdeas(msg: string): string | null {
  const t = normalizeText(msg);
  if (t.includes("terlikle kaban")) return "Terlikle kaban uymaz 😅 Başka alternatif bakabiliriz.";
  if (t.includes("montla sandalet")) return "Bu kombin açıkçası pek olmamış 😄 Daha iyilerini öneririm.";
  if (t.includes("botla kırmızı çorap")) return "Bot ile kırmızı çorap uymaz bence 😅 Başka renk öneriyim istersen.";
  return null;
}

// Müşteri satın alma niyet derecesi
function detectPurchaseIntent(msg: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(msg);
  if (t.includes("alacağım") || t.includes("satın") || t.includes("sepete"))
    return "HIGH";
  if (t.includes("düşünüyorum") || t.includes("bakarım"))
    return "MID";
  return "LOW";
}

const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|ne haber|nabersin|ne yapıyorsun|napıyon)/i,
    answer: "Çok iyiyim 😊 Sen nasılsın?",
  },
  {
    regex: /(gerçek misin|bot musun|yapay zeka)/i,
    answer: "Ben FlowAI 🤖 gerçek bir asistana benzer şekilde çalışıyorum.",
  },
  {
    regex: /(canım sıkıldı|canim sıkıldı)/i,
    answer:
      "Üzülme 😌 Yeni ürünler bakmak iyi gelir, dilersen öneri yapabilirim!",
  },
];

const NAME_PATTERN =
  /(benim adım|adım|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

let knownCustomerName: string | null = null;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const clean =
    m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  knownCustomerName = clean;
  return clean;
}

function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";
  const allText = products.map(p => p.title.toLowerCase()).join(" ");
  if (allText.includes("pantolon") || allText.includes("kazak") || allText.includes("gömlek")) return "giyim";
  if (allText.includes("ayakkabı") || allText.includes("sneaker")) return "ayakkabı";
  if (allText.includes("bilgisayar") || allText.includes("telefon")) return "elektronik";
  if (allText.includes("vida") || allText.includes("matkap") || allText.includes("hırdavat")) return "hırdavat";
  if (allText.includes("oyuncak")) return "oyuncak";
  return "genel";
}
function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  if (t.includes("nasilsin") || t.includes("napıyorsun") || t.includes("gerçek misin")) return "SMALL_TALK";
  if (t.includes("merhaba") || t.includes("selam")) return "GREETING";
  if (t.includes("fiyat") || t.includes("kaç")) return "ASK_PRICE";
  if (t.includes("stok") || t.includes("kalmış")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("beden") || t.includes("numara")) return "ASK_SIZE";
  if (t.includes("malzeme") || t.includes("kalite")) return "ASK_MATERIAL";
  if (t.includes("nerede kullanılır") || t.includes("hangi amaçla")) return "ASK_USAGE";
  if (t.includes("uygun mu")) return "ASK_SUITABILITY";
  if (t.includes("öner") || t.includes("tavsiye") || t.includes("hangi ürünü alayım")) return "ASK_RECOMMENDATION";
  if (t.includes("kombin") || t.includes("ne ile gider")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("ne zaman gelir")) return "ASK_SHIPPING";
  if (t.includes("iade") || t.includes("değişim")) return "ASK_RETURN";
  if (t.includes("kargom") || t.includes("siparişim nerede")) return "TRACK_ORDER";
  if (t.includes("şikayet")) return "COMPLAINT";

  return "UNKNOWN";
}

function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const n = normalizeText(msg)
    .split(" ")
    .filter((x) => x.length > 2);

  const matches = products.filter((p) => {
    const name = normalizeText(p.title);
    return n.some((token) => name.includes(token));
  });

  return matches.length ? matches.slice(0, 3) : products.slice(0, 1);
}

function formatProductSummary(p: Product): string {
  let out = `✨ **${p.title}**`;

  if (p.price) out += `\n💰 Fiyat: ${p.price}`;
  if ((p as any).imageUrl) out += `\n🖼️ Görsel: ${(p as any).imageUrl}`;
  if ((p as any).image) out += `\n🖼️ Görsel: ${(p as any).image}`;
  if (p.url) out += `\n🔗 Link: ${p.url}`;
  if (p.category) out += `\n📂 Kategori: ${p.category}`;

  return out;
}
function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {
  const matches = findMatchingProducts(userMessage, products);
  const main = matches[0] || products[0];

  const storeType = detectStoreCategory(products);
  const absurdCheck = rejectAbsurdIdeas(userMessage);

  // Önce absürt fikir engelleme
  if (absurdCheck) {
    return absurdCheck +
      "\nAma seni yalnız bırakmam, sana güzel bir alternatif önereyim:\n\n" +
      formatProductSummary(main);
  }

  // Müşteri adı gösterimi 💬
  const namePrefix = customerName
    ? `${customerName.endsWith("a") || customerName.endsWith("e") ? customerName + " Hanım" : customerName + " Bey"} `
    : "";

  switch (intent) {
    case "GREETING":
      return (
        `Merhaba ${namePrefix}👋\nBen FlowAI 😊\nMağazadaki ürünler ile ilgili yardımcı olabilirim.\n\n` +
        "✨ Ürün önerisi isteyebilirsin\n" +
        "👗 Kombin sorabilirsin\n" +
        "📦 Kargo veya stok durumunu sorabilirsin\n"
      );

    case "SMALL_TALK":
      const foundPattern = DAILY_TALK_PATTERNS.find((p) => p.regex.test(userMessage));
      if (foundPattern) {
        return foundPattern.answer.replace("😊", `😊 ${namePrefix}`);
      }

      return (
        `Buradayım ${namePrefix}😇 Sana nasıl destek olabilirim?\n` +
        "Ürün fiyatı, stok, öneri, kombin gibi her konuda yazabilirsin."
      );

    case "ASK_PRICE":
      return formatProductSummary(main) +
        `\n\n💬 ${namePrefix}fiyatla ilgili başka bir ürün sorabilirsin.`;

    case "ASK_STOCK":
      return (
        formatProductSummary(main) +
        "\n\n📦 Stok bilgisi platform üzerinden anlık güncellenir."
      );

    case "ASK_COLOR":
      return (
        formatProductSummary(main) +
        "\n\n🎨 Renk seçenekleri varyasyon bölümünde yer alabilir."
      );

    case "ASK_SIZE":
      return (
        formatProductSummary(main) +
        "\n\n📏 İki beden arasında kaldıysan konfor için büyük tercih önerilir."
      );

    case "ASK_MATERIAL":
      return (
        formatProductSummary(main) +
        "\n\n🧵 Malzeme kalitesi kullanım deneyimini doğrudan etkiler."
      );

    case "ASK_USAGE":
    case "ASK_SUITABILITY":
      return (
        formatProductSummary(main) +
        "\n\n🔍 Kullanım amacına göre doğru ürün seçimi için ürün detaylarını inceleyebilirsin.\n"
      );

    case "ASK_RECOMMENDATION":
      return (
        `Sana harika öneriler buldum ${namePrefix}🌟\n\n` +
        matches.map((m) => formatProductSummary(m)).join("\n\n") +
        "\n\n👍 Bunlardan hangisi daha yakın, söyle ona göre kombin hazırlayayım."
      );

    case "ASK_COMBINATION":
      return buildCombinationSuggestion(main, products);

    case "ASK_SHIPPING":
      return (
        `🚚 Kargo süreci ile ilgili bilgi vereyim ${namePrefix}\n\n` +
        "Ürünler genelde 1-3 iş günü içinde kargoya verilir."
      );

    case "ASK_RETURN":
      return (
        "🔄 İade & Değişim Bilgisi:\n" +
        "Ürün kullanılmadan ve paketi bozulmadan iade edilebilir."
      );

    case "TRACK_ORDER":
      return (
        "📦 Sipariş takibi için sipariş geçmişinden takip numaranı görebilirsin."
      );

    case "COMPLAINT":
      return (
        "Üzgünüm böyle bir durum yaşaman kötü oldu 😔\n" +
        "Detay verdiğinde elimden geldiğince yönlendirebilirim."
      );

    case "UNKNOWN":
    default:
      return (
        formatProductSummary(main) +
        `\n\n${namePrefix}Tam olarak ne öğrenmek istiyorsun? 😊`
      );
  }
}
/**
 * DIŞA AÇTIĞIMIZ ASIL FONKSİYON
 * routes/assistant.ts burayı çağırıyor
 */
export async function generateSmartReply(
  shopId: string,
  userMessage: string
): Promise<string> {
  const trimmed = (userMessage || "").trim();

  if (!trimmed) {
    return "Merhaba 👋 Ne hakkında yardımcı olmamı istersin? Ürün, kombin, fiyat, stok veya kargo hakkında soru sorabilirsin.";
  }

  // Müşteri adını yakala
  const customerName = extractCustomerName(trimmed);

  // Mağaza ürünlerini çek
  const products = await getProductsForShop(shopId);

  // Intent tespiti
  const intent = detectIntent(trimmed);

  // Nihai cevap üret
  const reply = buildReplyForIntent(intent, trimmed, products, customerName);

  return reply;
}

/**
 * Geriye dönük uyumluluk için eklenmiş wrapper fonksiyonlar
 * (aiRouter, webhook, eski sürüm entegrasyonları çalışsın diye)
 */
export async function getAssistantReply(
  shopId: string,
  userMessage: string
): Promise<string> {
  return generateSmartReply(shopId, userMessage);
}

export async function getAIResponse(
  shopId: string,
  userMessage: string
): Promise<string> {
  return generateSmartReply(shopId, userMessage);
}