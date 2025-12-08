// src/services/assistantService.ts
import {
  Product,
  getProductsForShop,
  normalizeText,
} from "./productService.js";

// 👉 Yeni ekleme: Fiyat segmenti algılama
function detectPriceSegment(priceText: string | undefined): "LOW" | "MID" | "HIGH" | null {
  if (!priceText) return null;

  const onlyNumber = priceText.replace(/[₺,.]/g, "").trim();
  const price = parseInt(onlyNumber);

  if (!price || isNaN(price)) return null;

  if (price < 300) return "LOW";
  if (price < 1000) return "MID";
  return "HIGH";
}

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

function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);

  if (t.includes("terlikle kaban") || t.includes("botla kırmızı çorap"))
    return "🤨 Bu öneri biraz ters köşe oldu diyebilirim. Daha uyumlu seçimler yapalım istersen 😊";

  if (t.includes("montla sandalet"))
    return "🧐 Sence de bu kombin biraz tuhaf değil mi? Aynı mevsime ait ürünlerle kombin yapalım.";

  return null;
}

function detectPurchaseIntent(msg: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(msg);

  if (t.includes("alacağım") || t.includes("satın") || t.includes("sepete"))
    return "HIGH";

  if (t.includes("bakacağım") || t.includes("düşünüyorum"))
    return "MID";

  return "LOW";
}

const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|naber|napıyorsun|napıyon)/i,
    answer: "Çok iyiyim 😊 Sana yardımcı olmak için buradayım. Sen nasılsın?",
  },
  {
    regex: /(iyiyim|fena değil)/i,
    answer:
      "Harika! 🙌 Peki şimdi hangi ürüne bakıyoruz, nasıl yardımcı olabilirim?",
  },
  {
    regex: /(canım sıkıldı|sıkıldım)/i,
    answer:
      "Anlıyorum 😌 İstersen sana tarzına uygun birkaç ürün önereyim, moral yükseltelim 🎁",
  },
  {
    regex: /(gerçek misin|yapay zeka)/i,
    answer:
      "Ben FlowAI 🤖 Mağazanın akıllı asistanıyım. Ürün tavsiyesi, kombin, kalite analizi her şey bende ✨",
  },
];

const NAME_PATTERN =
  /(benim adım|benim adim|adım|adim|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

let knownCustomerName: string | null = null;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const raw = m[2];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const all = products.map(p => (p.title || "").toLowerCase()).join(" ");

  if (all.includes("pantolon") || all.includes("kazak") || all.includes("gömlek")) return "giyim";
  if (all.includes("ayakkabı") || all.includes("sneaker")) return "ayakkabı";
  if (all.includes("bilgisayar") || all.includes("telefon")) return "elektronik";
  if (all.includes("matkap") || all.includes("tornavida")) return "hırdavat";
  if (all.includes("çadır") || all.includes("kamp")) return "kamp";
  if (all.includes("oyuncak")) return "oyuncak";
  return "genel";
}

function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  if (t.includes("nasilsin") || t.includes("napıyorsun")) return "SMALL_TALK";
  if (t.includes("merhaba") || t.includes("selam")) return "GREETING";
  if (t.includes("fiyat") || t.includes("kaç")) return "ASK_PRICE";
  if (t.includes("stok")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("numara") || t.includes("beden")) return "ASK_SIZE";
  if (t.includes("malzeme") || t.includes("kalite")) return "ASK_MATERIAL";
  if (t.includes("kullanılır")) return "ASK_USAGE";
  if (t.includes("uygun mu")) return "ASK_SUITABILITY";
  if (t.includes("öner")) return "ASK_RECOMMENDATION";
  if (t.includes("kombin")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("teslimat")) return "ASK_SHIPPING";
  if (t.includes("iade") || t.includes("değişim")) return "ASK_RETURN";
  if (t.includes("takip") || t.includes("sipariş")) return "TRACK_ORDER";
  if (t.includes("şikayet") || t.includes("kötü")) return "COMPLAINT";

  return "UNKNOWN";
}

function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const t = normalizeText(msg);
  const words = t.split(" ");

  return products.filter((p) =>
    normalizeText(p.title).includes(words[0])
  ).slice(0, 5);
}
function formatProductSummary(p: Product): string {
  const lines: string[] = [];

  lines.push(`✨ **${p.title}**`);

  if (p.price) lines.push(`💰 Fiyat: ${p.price}`);
  else lines.push(`💰 Fiyat: Ürün sayfasında güncel görünebilir`);

  if ((p as any).imageUrl) lines.push(`🖼️ Görsel: ${(p as any).imageUrl}`);
  else if ((p as any).image) lines.push(`🖼️ Görsel: ${(p as any).image}`);

  if (p.category) lines.push(`📂 Kategori: ${p.category}`);
  if (p.url) lines.push(`🔗 Link: ${p.url}`);

  // Yeni ekleme → Fiyat segment yorumu
  const seg = detectPriceSegment(p.price);
  if (seg === "LOW") lines.push("💸 Uygun fiyatlı ekonomik bir model 👍");
  if (seg === "MID") lines.push("💳 Fiyat / performans olarak dengeli bir ürün 👌");
  if (seg === "HIGH") lines.push("💎 Kalite segmentinde bir ürün 🌟");

  return lines.join("\n");
}

function buildCombinationSuggestion(mainProduct: Product, allProducts: Product[]): string {
  const p = mainProduct;

  const norm = (t: string | undefined) => normalizeText(t || "");

  const others = allProducts.filter(x => x.id !== p.id);

  let result = "🧩 Şu ürünle kombin edebilirsin:\n";

  if (p.category === "giyim") {
    const shoes = others.find(x => normalizeText(x.title).includes("ayakkabı"));
    const pant = others.find(x => normalizeText(x.title).includes("pantolon"));

    if (pant) {
      result += `\n👖 Alt kombin:\n${formatProductSummary(pant)}\n`;
    }
    if (shoes) {
      result += `\n👟 Ayakkabı önerisi:\n${formatProductSummary(shoes)}\n`;
    }
  }

  if (p.category === "elektronik") {
    const cable = others.find(x =>
      norm(x.title).includes("sarj") || norm(x.title).includes("kablosuz")
    );

    const case_ = others.find(x =>
      norm(x.title).includes("kılıf")
    );

    if (cable) result += `\n🔌 Tamamlayıcı ürün:\n${formatProductSummary(cable)}`;
    if (case_) result += `\n📱 Aksesuar önerisi:\n${formatProductSummary(case_)}`;
  }

  return result;
}

function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {

  if (customerName) knownCustomerName = customerName;

  const matches = findMatchingProducts(userMessage, products);
  const mainProduct = matches[0] || products[0];
  const category = detectStoreCategory(products);

  const absurd = rejectAbsurdIdeas(userMessage);
  if (absurd) return absurd;

  const purchaseIntent = detectPurchaseIntent(userMessage);

  // Yeni ekleme → satın alma isteğine göre yaklaşım
  let emotionalPush = "";
  if (purchaseIntent === "HIGH")
    emotionalPush = "\n✨ Bence kaçırma fırsat güzel 👍";
  if (purchaseIntent === "MID")
    emotionalPush = "\n👀 İstersen alternatif de söyleyebilirim";
  if (purchaseIntent === "LOW")
    emotionalPush = "\n😊 Bakmak istersen detay verebilirim";

  switch (intent) {
    case "GREETING":
      return `Merhaba ${knownCustomerName ?? ""} 👋
Ben FlowAI. Sana ürün, öneri ve bilgi konusunda yardımcı olabilirim.
Ne arıyorsun? 😊`;

    case "SMALL_TALK":
      return DAILY_TALK_PATTERNS.find(pt => pt.regex.test(userMessage))?.answer
        || "Buradayım 😊 Ürün bakmak ister misin?";
        case "ASK_PRICE":
      return formatProductSummary(mainProduct) + emotionalPush;

    case "ASK_STOCK":
      return (
        formatProductSummary(mainProduct) +
        "\n📦 Stok bilgisi platform üzerinden anlık güncellenir."
      );

    case "ASK_COLOR":
      return (
        formatProductSummary(mainProduct) +
        "\n🎨 Varyasyon seçenekleri ürün sayfasında yer alır."
      );

    case "ASK_SIZE":
      if (category === "giyim" || category === "ayakkabı") {
        return (
          formatProductSummary(mainProduct) +
          "\n📏 Beden seçimi için yorumlara göz atmanı öneririm." +
          emotionalPush
        );
      }
      return formatProductSummary(mainProduct) + "\n📐 Teknik ölçüler önemlidir.";

    case "ASK_MATERIAL":
      return (
        formatProductSummary(mainProduct) +
        "\n🧵 Malzeme bilgisi ürün detayında listelenmiştir." +
        emotionalPush
      );

    case "ASK_USAGE":
    case "ASK_SUITABILITY":
      return (
        formatProductSummary(mainProduct) +
        "\n🔍 Kullanım amacın neyse ona göre öneride bulunabilirim." +
        emotionalPush
      );

    case "ASK_RECOMMENDATION": {
      const results = matches.length ? matches : products.slice(0, 3);

      return (
        "Sana özel ürünler önerebilirim 🌟\n\n" +
        results
          .slice(0, 3)
          .map((p, idx) => `#${idx + 1}\n${formatProductSummary(p)}\n`)
          .join("\n") +
        "\nBeğenirsen buna uygun kombin de önerebilirim 😊"
      );
    }

    case "ASK_COMBINATION":
      return buildCombinationSuggestion(mainProduct, products);

    case "ASK_SHIPPING":
      return (
        "🚚 Kargo bilgisi\n\n" +
        "- Çoğu ürün 1-3 iş günü içinde kargoya teslim edilir.\n" +
        "- Kesin teslim tarihini sipariş panelinden görebilirsin.\n"
      );

    case "ASK_RETURN":
      return (
        "🔄 İade & Değişim\n\n" +
        "İade koşulları satın alma yapılan platforma göre değişebilir.\n" +
        "Genelde kutusu ve içeriği tam olduğunda 14 gün içinde iade hakkın bulunur 😊"
      );

    case "TRACK_ORDER":
      return (
        "📦 Kargon nerede?\n\n" +
        "Sipariş verdiğin platformdaki 'Siparişlerim' sayfasından takip numarasını görebilirsin.\n"
      );

    case "COMPLAINT":
      return (
        "Üzgünüm bunu yaşaman hiç hoş olmamış 😞\n" +
        "Sorunu detaylı yaz, yardımcı olmaya çalışayım.\n"
      );

    case "UNKNOWN":
    default:
      return (
        formatProductSummary(mainProduct) +
        "\nTam olarak ne öğrenmek istiyorsun? (fiyat, beden, kullanım, kombin vb.)"
      );
  }
}

/**
 * Ana çalışma fonksiyonu
 */
export async function generateSmartReply(
  shopId: string,
  userMessage: string
): Promise<string> {
  const trimmed = (userMessage || "").trim();
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