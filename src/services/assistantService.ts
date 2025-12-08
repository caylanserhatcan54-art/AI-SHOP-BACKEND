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

// 👉 EKLENDİ: Absürt istek kontrolü
function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);
  if (t.includes("terlikle kaban") || t.includes("botla kırmızı çorap"))
    return "Bence pek uygun değil 😅 Daha dengeli bir kombin yapalım.";
  if (t.includes("montla sandalet"))
    return "Bu açıkçası çok uyumlu olmadı 😄 daha stil sahibi bir kombin önerim istersen.";
  return null;
}

// 👉 EKLENDİ: satın alma niyeti analizi
function analyzeCustomerIntent(message: string) {
  const t = normalizeText(message);

  if (
    t.includes("alacağım") ||
    t.includes("satın") ||
    t.includes("sepete") ||
    t.includes("kaç günde gelir") ||
    t.includes("sipariş")
  ) {
    return { level: "HOT", motivation: "high" };
  }

  if (
    t.includes("düşünüyorum") ||
    t.includes("alternatif") ||
    t.includes("indirim olur mu") ||
    t.includes("kararsız")
  ) {
    return { level: "MED", motivation: "mid" };
  }

  return { level: "LOW", motivation: "low" };
}

// Günlük sohbet için sabitler
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|naber|napıyorsun|napıyon|ne yapıyorsun)/i,
    answer: "Çok iyiyim, seninle ilgileniyorum 😊 Sen nasılsın?",
  },
  {
    regex: /(iyiyim|idare eder|fena degil|fena değil)/i,
    answer: "Harika! Bugün ne bakıyoruz? 😊 ürün mü arıyorsun?",
  },
  {
    regex: /(sıkıldım|canım sıkıldı)/i,
    answer: "Moral bozma 😌 güzel ürünler bakabiliriz istersen 💫",
  },
  {
    regex: /(bot musun|robot musun|yapay zeka misin|gerçek misin)/i,
    answer: "Ben FlowAI 🤖 Mağazanın dijital danışmanıyım ✨",
  },
];

const NAME_PATTERN =
  /(benim adım|benim adim|adım|adim|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;

  const name = m[2];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// kullanıcının adını hafızada tutma (tek session boyunca)
let knownCustomerName: string | null = null;

// kategori tespiti
function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const all = products.map(p => p.title?.toLowerCase() ?? "").join(" ");

  if (all.includes("pantolon") || all.includes("kazak") || all.includes("gömlek")) return "giyim";
  if (all.includes("ayakkabı") || all.includes("spor ayakkabı") || all.includes("sneaker")) return "ayakkabı";
  if (all.includes("telefon") || all.includes("bilgisayar") || all.includes("kulaklık")) return "elektronik";
  if (all.includes("matkap") || all.includes("vida") || all.includes("vidalama")) return "hırdavat";

  return "genel";
}

function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  if (t.includes("nasilsin") || t.includes("naber")) return "SMALL_TALK";
  if (t.includes("merhaba") || t.includes("selam")) return "GREETING";
  if (t.includes("fiyat") || t.includes("kaça") || t.includes("kaç")) return "ASK_PRICE";
  if (t.includes("stok") || t.includes("var mı")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("beden") || t.includes("numara")) return "ASK_SIZE";
  if (t.includes("malzeme")) return "ASK_MATERIAL";
  if (t.includes("nerede kullanılır")) return "ASK_USAGE";
  if (t.includes("uygun mu") || t.includes("uyar mı")) return "ASK_SUITABILITY";
  if (t.includes("öneri") || t.includes("hangisini")) return "ASK_RECOMMENDATION";
  if (t.includes("kombin") || t.includes("ne ile gider")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("ne zaman gelir")) return "ASK_SHIPPING";
  if (t.includes("iade") || t.includes("değişim")) return "ASK_RETURN";
  if (t.includes("kargom nerede") || t.includes("sipariş")) return "TRACK_ORDER";
  if (t.includes("şikayet") || t.includes("kötü")) return "COMPLAINT";

  return "UNKNOWN";
}

function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const norm = normalizeText(msg);
  return products.filter(p => normalizeText(p.title).includes(norm.split(" ")[0])).slice(0, 5);
}

function formatProductSummary(p: Product): string {
  const lines: string[] = [];

  lines.push(`✨ **${p.title}**`);
  if (p.price) lines.push(`💰 Fiyat: ${p.price}`);
  if ((p as any).image) lines.push(`🖼️ Görsel: ${(p as any).image}`);
  if (p.category) lines.push(`📂 Kategori: ${p.category}`);
  if (p.url) lines.push(`🔗 Ürün linki: ${p.url}`);

  return lines.join("\n");
}

function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {

  if (customerName) knownCustomerName = customerName;

  const matches = findMatchingProducts(userMessage, products);
  const main = matches[0] || products[0];
  const intentScore = analyzeCustomerIntent(userMessage);

  const absurdBlock = rejectAbsurdIdeas(userMessage);
  if (absurdBlock) return absurdBlock;

  let reply = "";

  switch (intent) {
    case "GREETING":
      reply = `Merhaba ${knownCustomerName ?? ""} 👋✨ Nasıl yardımcı olabilirim?`;
      break;

    case "SMALL_TALK":
      reply = DAILY_TALK_PATTERNS.find(p => p.regex.test(userMessage))?.answer
      || "Buradayım 😊 Nasıl yardımcı olabilirim?";
      break;

    case "ASK_PRICE":
      reply = formatProductSummary(main);
      break;

    case "ASK_RECOMMENDATION":
      reply = "Sana güzel önerilerim var 🌟\n\n" +
        findMatchingProducts(userMessage, products)
        .slice(0, 3)
        .map(formatProductSummary)
        .join("\n\n");
      break;

    case "ASK_COMBINATION":
      reply = `Bu ürün + sade üst + düz pantolon + beyaz sneaker çok iyi gider 😌`;
      break;

    case "ASK_SHIPPING":
      reply = "Genelde 1-3 iş gününde teslim ediliyor 🚚💨";
      break;

    case "ASK_RETURN":
      reply = "İade süreci platform koşullarına bağlıdır 🙂
Genelde 14 gün içinde iade olur.";
      break;

    case "COMPLAINT":
      reply = "Üzgünüm 😞 detay yaz yardımcı olayım.";
      break;

    default:
      reply = formatProductSummary(main) + "\n\nNasıl yardımcı olayım? 😊";
  }

  // 👉 EKLEDİK: satın alma niyeti cümlesi
  if (intentScore.level === "HOT") {
    reply += "\n🔥 Seçimin gerçekten şahane! Bitmeden değerlendir bence 😊";
  }

  if (intentScore.level === "MED") {
    reply += "\n✨ Kararsız kalman normal, özelliklerine göre fiyatı gayet iyi 👍";
  }

  if (intentScore.level === "LOW") {
    reply += "\nBilgi istersen detay detay açıklayabilirim 😊";
  }

  return reply;
}

export async function generateSmartReply(
  shopId: string,
  userMessage: string
): Promise<string> {

  const trimmed = userMessage.trim();
  const name = extractCustomerName(trimmed);
  const products = await getProductsForShop(shopId);
  const intent = detectIntent(trimmed);

  return buildReplyForIntent(intent, trimmed, products, name);
}

export async function getAssistantReply(shopId: string, userMessage: string) {
  return generateSmartReply(shopId, userMessage);
}

export async function getAIResponse(shopId: string, userMessage: string) {
  return generateSmartReply(shopId, userMessage);
}
