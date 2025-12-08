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

const TURKISH_STOP_WORDS = [
  "ve",
  "ya",
  "mi",
  "mu",
  "mü",
  "de",
  "da",
  "ile",
  "bu",
  "şu",
  "o",
  "bir",
  "icin",
  "için",
  "gibi",
  "ne",
  "kadar",
  "var",
];

// ❗ Absürt kombin engelleme — EKLENDİ
function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);

  if (
    t.includes("terlikle mont") ||
    t.includes("terlikle kaban") ||
    t.includes("botla kırmızı çorap") ||
    t.includes("sandalet ile mont")
  ) {
    return "Bu kombin açıkçası pek uyumlu olmadı 😄 Sana daha iyi yakışacak bir öneri sunayım istersen.";
  }

  return null;
}

// ❗ Müşterinin satın alma ciddiyeti — EKLENDİ
function detectPurchaseIntent(msg: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(msg);

  if (t.includes("alacağım") || t.includes("sepete") || t.includes("satın"))
    return "HIGH";

  if (t.includes("düşünüyorum") || t.includes("bakacağım"))
    return "MID";

  return "LOW";
}

// Konuşma diyaloğu
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasilsin|nasılsın|napıyorsun|naber)/i,
    answer: "Harikayım! 🤖 Sen nasılsın? Bugün ne bakıyoruz 😊",
  },
  {
    regex: /(canim sıkıldı|canım sıkıldı)/i,
    answer: "Morali düzeltmek için güzel ürünlere bakabiliriz 😌",
  },
  {
    regex: /(gerçek misin|bot musun|yapay zeka)/i,
    answer: "Ben gerçek değilim ama bilgim gerçek 😄 FlowAI burada 💛",
  },
];

const NAME_PATTERN =
  /(benim adım|adım|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

let knownCustomerName: string | null = null;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const raw = m[2];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const titles = products.map(p => (p.title || "").toLowerCase()).join(" ");

  if (titles.includes("pantolon") || titles.includes("kazak") || titles.includes("gömlek"))
    return "giyim";

  if (titles.includes("ayakkabı") || titles.includes("sneaker"))
    return "ayakkabı";

  if (titles.includes("bilgisayar") || titles.includes("telefon"))
    return "elektronik";

  if (titles.includes("matkap") || titles.includes("vida"))
    return "hırdavat";

  return "genel";
}

function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  if (t.includes("nasilsin") || t.includes("naber")) return "SMALL_TALK";
  if (t.includes("selam") || t.includes("merhaba")) return "GREETING";
  if (t.includes("fiyat") || t.includes("kaç") || t.includes("ücret")) return "ASK_PRICE";
  if (t.includes("stok") || t.includes("kalmış mı")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("numara") || t.includes("beden")) return "ASK_SIZE";
  if (t.includes("malzeme") || t.includes("kalite")) return "ASK_MATERIAL";
  if (t.includes("nerede kullanılır") || t.includes("nasıl kullanılır")) return "ASK_USAGE";
  if (t.includes("uygun mu")) return "ASK_SUITABILITY";
  if (t.includes("öner") || t.includes("hangisini alayım")) return "ASK_RECOMMENDATION";
  if (t.includes("kombin") || t.includes("neyle gider")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("ne zaman gelir")) return "ASK_SHIPPING";
  if (t.includes("iade") || t.includes("değişim")) return "ASK_RETURN";
  if (t.includes("kargom nerede") || t.includes("sipariş")) return "TRACK_ORDER";
  if (t.includes("memnun değilim") || t.includes("şikayet")) return "COMPLAINT";

  return "UNKNOWN";
}

function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const words = normalizeText(msg).split(" ");

  return products.filter(p =>
    words.some(w => normalizeText(p.title).includes(w))
  );
}

function formatProductSummary(p: Product): string {
  let txt = `✨ **${p.title}**\n`;

  if (p.price) txt += `💰 Fiyat: ${p.price}\n`;
  if ((p as any).imageUrl) txt += `🖼️ Görsel: ${(p as any).imageUrl}\n`;
  if (p.url) txt += `🔗 Link: ${p.url}\n`;

  return txt;
}

// ❗ Kombin Önerici Eklendi ❗
function buildCombinationSuggestion(mainProduct: Product | null, list: Product[]): string {
  const p = mainProduct || list[0];

  const lower = normalizeText(p.category ?? "");

  let suggestions = `🧩 Bu ürün için kombin önerisi:\n\n${formatProductSummary(p)}\n`;

  if (lower.includes("ayakkabı") || lower.includes("ayakkabi")) {
    suggestions += `👖 Basic kot + beyaz üst güzel gider\n`;
  }

  if (lower.includes("giyim")) {
    suggestions += `👟 Beyaz sneaker + sade çanta yakışır\n`;
  }

  if (lower.includes("elektronik")) {
    suggestions += `🔌 Mouse + kılıf + ekran koruyucu tamamlayıcı olur\n`;
  }

  if (lower.includes("hırdavat")) {
    suggestions += `🦺 Eldiven + gözlük ile güvenli kullanım önerilir\n`;
  }

  return suggestions;
}

function buildReplyForIntent(
  intent: Intent,
  message: string,
  products: Product[],
  name: string | null
): string {
  if (name) knownCustomerName = name;

  const purchasePower = detectPurchaseIntent(message);
  const absurd = rejectAbsurdIdeas(message);

  if (absurd) return absurd;

  const found = findMatchingProducts(message, products);
  const main = found[0] || products[0];

  switch (intent) {
    case "SMALL_TALK":
      return DAILY_TALK_PATTERNS.find(p => p.regex.test(message))?.answer ??
        "Buradayım 😊 ürünle ilgili konuşabiliriz.";

    case "GREETING":
      return `Merhaba ${knownCustomerName ?? ""} 👋 Ben FlowAI. Nasıl yardımcı olayım?`;

    case "ASK_COMBINATION":
      return buildCombinationSuggestion(main, products);

    case "ASK_RECOMMENDATION":
      return found.slice(0, 3).map(formatProductSummary).join("\n");

    case "ASK_PRICE":
      return formatProductSummary(main);

    case "ASK_RETURN":
      return "Her platformda iade şartları farklıdır fakat genelde 14 gün içinde iade mümkündür.";

    case "ASK_SHIPPING":
      return "Genelde ürünler 1-3 iş günü içinde kargoya verilir 🚚";

    case "COMPLAINT":
      return "Bunu yaşamana üzüldüm 😞 bana detay yaz, çözüme yönlendireyim.";

    default:
      return formatProductSummary(main) + "\n\nNasıl yardımcı olayım?";
  }
}

export async function generateSmartReply(shopId: string, userMessage: string): Promise<string> {
  if (!userMessage.trim()) return "Bir mesaj yaz, yardımcı olayım 😊";

  const name = extractCustomerName(userMessage);
  const products = await getProductsForShop(shopId);
  const intent = detectIntent(userMessage);

  return buildReplyForIntent(intent, userMessage, products, name);
}

export const getAIResponse = generateSmartReply;
export const getAssistantReply = generateSmartReply;
