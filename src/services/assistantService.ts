// src/services/assistantService.ts
import {
  Product,
  getProductsForShop,
  normalizeText,
} from "./productService.js";

// Niyetler
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
  "ve", "ya", "mi", "mu", "mü", "de", "da", "ile", "bu", "şu",
  "o", "bir", "icin", "için", "gibi", "ne", "kadar", "var"
];

// Absürt kombin red
function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);
  if (t.includes("terlikle kaban"))
    return "Bu kombin açıkçası hiç olmamış 😄 Daha uygun kombin önereyim istersen.";
  if (t.includes("montla sandalet"))
    return "Bu uymaz gibi görünüyor 😅 Daha dengeli bir şey seçelim.";
  return null;
}

// Satın alma niyeti
function detectPurchaseIntent(msg: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(msg);
  if (t.includes("alacağım") || t.includes("satın") || t.includes("sepete"))
    return "HIGH";
  if (t.includes("bakacağım") || t.includes("incelerim"))
    return "MID";
  return "LOW";
}

// Sohbet cümleleri
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|naber|napıyorsun|napıyon)/i,
    answer: "Çok iyiyim 😊 Sen nasılsın?"
  },
  {
    regex: /(iyiyim|fena değil)/i,
    answer: "Harika 🎉 Bugün ne bakıyorsun, nasıl yardımcı olayım?"
  },
  {
    regex: /(sıkıldım|moralim bozuk)/i,
    answer: "Üzülme 😌 Birlikte güzel ürünlere bakalım mı?"
  },
  {
    regex: /(bot musun|yapay zeka|gerçek misin)/i,
    answer: "Ben FlowAI 🤖 Mağazanın akıllı danışmanıyım!"
  }
];

// İsim yakalama
const NAME_PATTERN = /(adım|benim adım|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const raw = m[2];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

// İsim hatırlama
let knownCustomerName: string | null = null;

function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const all = products.map(p => (p.title ?? "").toLowerCase()).join(" ");

  if (all.includes("pantolon") || all.includes("kazak") || all.includes("gömlek")) return "giyim";
  if (all.includes("ayakkabı")) return "ayakkabı";
  if (all.includes("telefon") || all.includes("bilgisayar")) return "elektronik";
  if (all.includes("matkap") || all.includes("vida")) return "hırdavat";
  if (all.includes("çadır") || all.includes("kamp")) return "kamp";
  if (all.includes("oyuncak")) return "oyuncak";

  return "genel";
}

function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  if (t.includes("nasilsin") || t.includes("napıyorsun")) return "SMALL_TALK";
  if (t.includes("merhaba") || t.includes("selam")) return "GREETING";
  if (t.includes("fiyat") || t.includes("kaç")) return "ASK_PRICE";
  if (t.includes("stok") || t.includes("kalmış")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("beden") || t.includes("numara")) return "ASK_SIZE";
  if (t.includes("malzeme") || t.includes("kalite")) return "ASK_MATERIAL";
  if (t.includes("nerede kullanılır") || t.includes("hangi amaçla")) return "ASK_USAGE";
  if (t.includes("uygun mu") || t.includes("olur mu")) return "ASK_SUITABILITY";
  if (t.includes("öneri") || t.includes("hangisini") || t.includes("ne önerirsin")) return "ASK_RECOMMENDATION";
  if (t.includes("kombin") || t.includes("ne ile gider")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("ne zaman gelir")) return "ASK_SHIPPING";
  if (t.includes("iade") || t.includes("değişim")) return "ASK_RETURN";
  if (t.includes("kargom nerede") || t.includes("sipariş")) return "TRACK_ORDER";
  if (t.includes("şikayet") || t.includes("kötü")) return "COMPLAINT";

  return "UNKNOWN";
}

function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const norm = normalizeText(msg);
  const firstToken = norm.split(" ")[0];
  return products.filter(p => normalizeText(p.title).includes(firstToken)).slice(0, 5);
}

function formatProductSummary(p: Product): string {
  let lines = `✨ **${p.title}**\n`;

  if (p.price) lines += `💰 Fiyat: ${p.price}\n`;
  if ((p as any).image) lines += `🖼️ Görsel: ${(p as any).image}\n`;
  if (p.url) lines += `🔗 Link: ${p.url}\n`;

  return lines;
}

function buildReplyForIntent(
  intent: Intent,
  message: string,
  products: Product[],
  customerName: string | null
): string {

  if (customerName) knownCustomerName = customerName;
  const matches = findMatchingProducts(message, products);
  const main = matches[0] || products[0];
  const category = detectStoreCategory(products);

  const absurdityCheck = rejectAbsurdIdeas(message);
  if (absurdityCheck) return absurdityCheck;

  switch (intent) {

    case "GREETING":
      return `Merhaba ${knownCustomerName ?? ""} 👋
Ben FlowAI. Ne arıyorsun?`;

    case "SMALL_TALK":
      return DAILY_TALK_PATTERNS.find(pt => pt.regex.test(message))?.answer
        ?? "Buradayım 😊 Ürün istersen söyle!";

    case "ASK_PRICE":
      return formatProductSummary(main);

    case "ASK_RECOMMENDATION":
      return `Sana birkaç ürün öneriyorum 🌟\n\n` +  
        findMatchingProducts(message, products).slice(0, 3).map(formatProductSummary).join("\n");

    case "ASK_COMBINATION":
      return `Bu ürünle şunlar uyumlu olur 👇
👚 Sade üst  
👖 Tek renk pantolon  
👟 Açık renk sneaker`;

    case "ASK_USAGE":
      return formatProductSummary(main) +  
        `\nBu ürün kullanım amacına göre oldukça uygun 👍`;

    case "ASK_SHIPPING":
      return `🚚 **Kargo Bilgisi**
Ürünler genelde 1-3 iş günü içinde kargolanır.
Kesin süre platform sipariş sayfasında görünür.`;

    case "ASK_RETURN":
      return `🔄 **İade & Değişim Bilgisi**

İade süreci platformun kurallarına göre işler.
📌 Genel olarak:
• Ürünü kullanmadan iade edebilirsin  
• Çoğu platformda **14 gün içinde iade hakkı vardır**  
• Fatura ve ambalajı saklamanı öneririm`;

    case "COMPLAINT":
      return `Üzgünüm bunu yaşamana 😔  
Detay yaz, yardımcı olmaya çalışayım.`

    default:
      return formatProductSummary(main) + "\n\nNasıl yardımcı olayım?";
  }
}

export async function generateSmartReply(
  shopId: string,
  message: string
) {
  const name = extractCustomerName(message);
  const products = await getProductsForShop(shopId);
  const intent = detectIntent(message);
  return buildReplyForIntent(intent, message, products, name);
}

export async function getAssistantReply(shopId: string, message: string) {
  return generateSmartReply(shopId, message);
}

export async function getAIResponse(shopId: string, message: string) {
  return generateSmartReply(shopId, message);
}
