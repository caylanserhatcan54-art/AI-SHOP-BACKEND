// src/services/assistantService.ts

import {
  Product,
  getProductsForShop,
  normalizeText,
} from "./productService.js";

/**
 * Kullanıcı konuşma niyeti
 */
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

/**
 * Türkçe anlamsız kelimeler
 */
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

/**
 * Absürt kombin engelleme
 */
function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);

  const absurdCombos = [
    {
      keywords: ["terlik", "kaban"],
      msg: "Terlikle kaban çok uymaz 😊 Daha dengeli bir kombin öneririm."
    },
    {
      keywords: ["bot", "kırmızı çorap"],
      msg: "Botla kırmızı çorap pek gitmez 😄 Daha sade bir ton daha iyi olur."
    },
    {
      keywords: ["mont", "sandalet"],
      msg: "Mont ile sandalet uyumlu durmuyor 😅 istersen alternatif kombin yapayım."
    }
  ];

  for (const r of absurdCombos) {
    if (r.keywords.every((w) => t.includes(normalizeText(w)))) {
      return r.msg;
    }
  }

  return null;
}


/**
 * Müşteri satın alma niyeti tespiti
 */
function detectPurchaseIntent(message: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(message);

  // yüksek niyet
  if (
    t.includes("sepete attım") ||
    t.includes("sepete ekledim") ||
    t.includes("alacağım") ||
    t.includes("satın") ||
    t.includes("kesin alacağım")
  ) {
    return "HIGH";
  }

  // orta niyet
  if (
    t.includes("düşünüyorum") ||
    t.includes("bakarım") ||
    t.includes("kararsızım") ||
    t.includes("inceleyeceğim")
  ) {
    return "MID";
  }

  return "LOW";
}


/**
 * Günlük konuşma cevapları
 */
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|napıyorsun|ne yapıyorsun)/i,
    answer: "İyiyim ve buradayım 😊 Sen nasılsın?"
  },
  {
    regex: /(canım sıkıldı|sıkıldım|fenayım)/i,
    answer: "Moral bozma 😊 İstersen sana güzel ürünler göstereyim, belki modun yükselir!"
  },
  {
    regex: /(bot musun|yapay zeka mısın|gerçek misin)/i,
    answer: "Ben FlowAI 🤖 Ürün konusunda sana gerçek öneriler vermek için buradayım!"
  }
];


/**
 * Kullanıcı adını yakalama
 */
const NAME_PATTERN =
  /(benim adım|adım|ben)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;

  const raw = m[2];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

let KNOWN_NAME: string | null = null;
/**
 * Mağaza kategorisini ürünlerden tahmin et
 */
function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const all = products
    .map((p) => (p.title || "").toLowerCase())
    .join(" ");

  if (
    all.includes("pantolon") ||
    all.includes("elbise") ||
    all.includes("kazak") ||
    all.includes("gömlek") ||
    all.includes("gomlek") ||
    all.includes("etek") ||
    all.includes("tunik") ||
    all.includes("ceket")
  ) {
    return "giyim";
  }

  if (
    all.includes("ayakkabı") ||
    all.includes("ayakkabi") ||
    all.includes("sneaker") ||
    all.includes("bot") ||
    all.includes("spor ayakkabı") ||
    all.includes("spor ayakkabi")
  ) {
    return "ayakkabı";
  }

  if (
    all.includes("bilgisayar") ||
    all.includes("laptop") ||
    all.includes("notebook") ||
    all.includes("telefon") ||
    all.includes("kulaklık") ||
    all.includes("kulaklik") ||
    all.includes("televizyon") ||
    all.includes("monitor") ||
    all.includes("monitör") ||
    all.includes("tablet")
  ) {
    return "elektronik";
  }

  if (
    all.includes("matkap") ||
    all.includes("vida") ||
    all.includes("şarjlı tornavida") ||
    all.includes("sarik tornavida") ||
    all.includes("hırdavat") ||
    all.includes("hirdavat") ||
    all.includes("anahtar takımı") ||
    all.includes("ingiliz anahtarı")
  ) {
    return "hırdavat";
  }

  if (
    all.includes("çadır") ||
    all.includes("cadir") ||
    all.includes("kamp sandalyesi") ||
    all.includes("kamp masası") ||
    all.includes("uyku tulumu") ||
    all.includes("kamp")
  ) {
    return "kamp-outdoor";
  }

  if (
    all.includes("oyuncak") ||
    all.includes("lego") ||
    all.includes("figür") ||
    all.includes("figür") ||
    all.includes("bebek") ||
    all.includes("oyun hamuru")
  ) {
    return "oyuncak";
  }

  if (
    all.includes("dumbbell") ||
    all.includes("halter") ||
    all.includes("koşu bandı") ||
    all.includes("kosu bandi") ||
    all.includes("pilates") ||
    all.includes("yoga matı") ||
    all.includes("yoga mat")
  ) {
    return "spor";
  }

  if (
    all.includes("yüzücü gözlüğü") ||
    all.includes("palet") ||
    all.includes("şnorkel") ||
    all.includes("deniz gözlüğü")
  ) {
    return "su-sporlari";
  }

  return "genel";
}

/**
 * Kullanıcının mesajından intent (niyet) çıkar
 */
function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  // günlük konuşmalar
  if (/(nasılsın|nasilsin|napıyorsun|ne yapıyorsun)/i.test(msg)) return "SMALL_TALK";
  if (/(canım sıkıldı|sıkıldım|modum düşük)/i.test(msg)) return "SMALL_TALK";
  if (/(bot musun|gerçek misin|yapay zeka)/i.test(msg)) return "SMALL_TALK";

  // isim verme
  if (/benim adım/i.test(msg) || /adım/i.test(msg)) return "SMALL_TALK";

  // satın alma niyeti
  if (/(sepete attım|sepete ekledim|alayım mı|satın alacağım|sipariş veriyorum)/i.test(msg))
    return "ASK_RECOMMENDATION";

  // net tavsiye isteyen
  if (/(hangisi mantıklı|hangisini alayım|karşılaştır|kıyasla|sen olsan hangisini alırdın)/i.test(msg))
    return "ASK_RECOMMENDATION";

  // 3 ürün isterse
  if (/(3 ürün|üç ürün|bana üç tane öner|öneri ver)/i.test(msg))
    return "ASK_RECOMMENDATION";

  if (t.includes("fiyat") || t.includes("kaç lira")) return "ASK_PRICE";
  if (t.includes("stok") || t.includes("var mı")) return "ASK_STOCK";
  if (t.includes("renk")) return "ASK_COLOR";
  if (t.includes("beden") || t.includes("numara")) return "ASK_SIZE";
  if (t.includes("malzeme") || t.includes("kalite")) return "ASK_MATERIAL";
  if (t.includes("nerede kullanılır") || t.includes("ne için")) return "ASK_USAGE";
  if (t.includes("uygun mu")) return "ASK_SUITABILITY";
  if (t.includes("kombin")) return "ASK_COMBINATION";
  if (t.includes("kargo") || t.includes("ne zaman gelir")) return "ASK_SHIPPING";
  if (t.includes("iade")) return "ASK_RETURN";
  if (t.includes("kargom nerede") || t.includes("sipariş takip")) return "TRACK_ORDER";
  if (t.includes("kötü") || t.includes("şikayet")) return "COMPLAINT";

  return "UNKNOWN";
}
/**
 * Kullanıcı mesajından ürün adına benzeyen kelimeleri çıkarır
 */
function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const normMsg = normalizeText(msg);

  const tokens = normMsg
    .split(" ")
    .filter(
      (t) => t.length > 2 && !["ve", "için", "gibi", "bir", "ile"].includes(t)
    );

  if (!tokens.length) return [];

  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    const titleNorm = normalizeText(product.title);

    let score = 0;
    for (const token of tokens) {
      if (titleNorm.includes(token)) score += 2;
    }

    if (score > 0) scored.push({ product, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map((s) => s.product);
}

/**
 * Ürün sunum formatı
 */
function formatProductSummary(p: Product): string {
  const lines: string[] = [];

  lines.push(`✨ **${p.title}**`);

  if (p.price) lines.push(`💰 Fiyat: ${p.price}`);
  else lines.push("💰 Fiyat: Platformda güncel fiyat yazmaktadır");

  if ((p as any).image || (p as any).imageUrl) {
    lines.push(
      `🖼️ Görsel: ${(p as any).image || (p as any).imageUrl}`
    );
  }

  if (p.category) lines.push(`📂 Kategori: ${p.category}`);
  if (p.color) lines.push(`🎨 Renk: ${p.color}`);
  if (p.url) lines.push(`🔗 Link: ${p.url}`);

  return lines.join("\n");
}

/**
 * Otomatik malzeme / kalite tahmini
 */
function usageAndQualityComment(product: Product): string {
  const name = product.title.toLowerCase();
  const comments: string[] = [];

  // 💡 otomatik fikir üretme
  if (name.includes("deri") || name.includes("leather")) {
    comments.push("🧵 Malzeme olarak oldukça dayanıklı bir yapısı var.");
  }

  if (name.includes("polar") || name.includes("kadife")) {
    comments.push("🧵 Yumuşak ve sıcak tutan bir dokuya sahip görünüyor.");
  }

  if (name.includes("spor") || name.includes("running")) {
    comments.push("🏃 Hareketli kullanımda rahatlık sağlar.");
  }

  if (name.includes("bot") || name.includes("kış") || name.includes("neopren")) {
    comments.push("❄️ Soğuk havalar için oldukça uygun gözüküyor.");
  }

  if (name.includes("pamuk") || name.includes("cotton")) {
    comments.push("🧵 Cildi tahriş etmeyen, nefes alan bir yapısı var.");
  }

  if (name.includes("su geçirmez") || name.includes("waterproof")) {
    comments.push("💧 Yağmur ve dış ortam için ideal bir seçenek.");

  }

  // kategori bazlı özel yorum
  switch (product.category) {
    case "elektronik":
      comments.push("⚙️ Teknik özellikleri kullanım performansını etkiler.");
      comments.push("🔌 Uyumlu aksesuarlarla daha verimli olur (kılıf, şarj adaptörü vb.)");
      break;

    case "ayakkabı":
      comments.push("📌 Doğru numarayı seçmek konfor için önemli.");
      comments.push("🎯 Günlük kullanımda konforlu duruyor.");
      break;

    case "kamp-outdoor":
      comments.push("🏕️ Dış mekan dayanıklılığı önemlidir.");
      comments.push("🌧️ Su geçirmezlik seviyesine bakmanı öneririm.");
      break;

    case "oyuncak":
      comments.push("🧸 Motor becerilere katkı sağlayabilir.");
      comments.push("📌 Yaş grubuna uygunluk önemli.");
      break;

    case "hırdavat":
      comments.push("🛠️ Montaj ve tamir işlerinde pratik kullanım sunabilir.");
      comments.push("🦺 Güvenlik ekipmanlarıyla kullanılması önerilir.");
      break;

    case "spor":
      comments.push("💪 Egzersiz için ideal bir ürün izlenimi veriyor.");
      comments.push("📌 Düzenli kullanım performansı artırabilir.");
      break;

    default:
      comments.push("ℹ️ Günlük kullanım için uygun görünüyor.");
      break;
  }

  return comments.join("\n");
}

/**
 * Kullanıcıya ek sorular sorarak konuşmayı geliştirme
 */
function buildFollowUpQuestions(userMessage: string, category: string): string {
  const t = normalizeText(userMessage);

  // Açıkça aydınlatma ürünü
  if (t.includes("lamba") || t.includes("avize") || t.includes("aydınlatma")) {
    return `
🔍 Daha doğru öneri yapabilmem için:
- Nerede kullanacaksın? (salon, mutfak, yatak odası)
- Işık rengi tercihin var mı? (gün ışığı, loş, beyaz)
- Enerji tasarrufu senin için önemli mi?`;
  }

  // Bilgisayar toplama ya da PC sorusu
  if (t.includes("bilgisayar") || t.includes("ekran kartı") || t.includes("ram")) {
    return `
🖥️ Sana en uygun sistemi önermem için:
- Ağırlıklı kullanım ne? (oyun/ofis/tasarım)
- Ekran kartı tercihin var mı?
- Yaklaşık bütçen nedir?`;
  }

  // Kombin isteği varsa
  if (category === "giyim" || category === "ayakkabı") {
    return `
💬 Sana özel kombin çıkarabilirim:
- Günlük mi yoksa özel bir gün için mi?
- Daha spor mu, klasik mi seviyorsun?
- Renk tercihin var mı?`;
  }

  return "";
}


/**
 * Ürün kategorisine göre kombin / tamamlayıcı ürün öneren sistem
 */
function buildCombinationSuggestion(mainProduct: Product, allProducts: Product[]): string {
  const cat = mainProduct.category || "genel";
  const norm = (v: string) => normalizeText(v || "");

  const suggestions: string[] = [];
  suggestions.push("🧩 Sana birkaç uyumlu öneri hazırladım:");

  // Kombin sistemini geniş kategori bazlı yaptık
  if (cat === "giyim") {
    suggestions.push("\n🧥 Üst–Alt kombin:");
    const pants = allProducts.find(p => norm(p.title).includes("pantolon") || norm(p.title).includes("etek"));
    if (pants) suggestions.push(formatProductSummary(pants));

    const shoes = allProducts.find(p => norm(p.title).includes("ayakkabı") || norm(p.title).includes("bot"));
    if (shoes) {
      suggestions.push("\n👟 Uyumlu ayakkabı:");
      suggestions.push(formatProductSummary(shoes));
    }

    suggestions.push("\n💡 Renk uyumu açısından ton yakınlığı daha hoş olur.");
  }

  else if (cat.includes("ayakkabi") || cat.includes("ayakkabı") || cat.includes("bot")) {
    suggestions.push("\n👖 Bu ayakkabıyla iyi gidebilecek ürün:");
    const match = allProducts.find(p => norm(p.title).includes("pantolon") || norm(p.title).includes("kot"));
    if (match) suggestions.push(formatProductSummary(match));

    suggestions.push("\n💡 Slim fit kesimler ayakkabıyı daha şık gösterir.");
  }

  else if (cat === "elektronik") {
    suggestions.push("\n🔌 Tamamlayıcı aksesuar önerileri:");

    const accessories = allProducts.find(p =>
      norm(p.title).includes("kılıf") ||
      norm(p.title).includes("powerbank") ||
      norm(p.title).includes("kulaklık")
    );

    if (accessories) suggestions.push(formatProductSummary(accessories));

    suggestions.push("\n💡 Teknik aksesuarlar performans artışı sağlar.");
  }

  else if (cat === "hırdavat") {
    suggestions.push("\n🛠️ Uyumlu bir ürün önerisi:");

    const gloves = allProducts.find(p => norm(p.title).includes("eldiven"));
    if (gloves) suggestions.push(formatProductSummary(gloves));

    suggestions.push("\n💡 Güvenlik ekipmanları ile kullanmanı öneririm.");
  }

  else if (cat.includes("kamp")) {
    suggestions.push("\n🏕️ Kamp ekipmanı önerisi:");

    const mat = allProducts.find(p => norm(p.title).includes("mat"));
    if (mat) suggestions.push(formatProductSummary(mat));

    suggestions.push("\n💡 Su geçirmeme & izolasyon kritik.");
  }

  else {
    suggestions.push("\n🔗 Tamamlayıcı ürün önerisi:");

    const alt = allProducts.find(p => p.id !== mainProduct.id);
    if (alt) suggestions.push(formatProductSummary(alt));
  }

  return suggestions.join("\n");
}

/**
 * “Hangisini almalıyım?”, “En mantıklısı hangisi?” gibi soruları çözer
 */
function smartProductDecision(products: Product[]): string {
  if (!products.length) return "Net bir ürün bulamadım 😅";

  if (products.length === 1) {
    return `Bence mantıklı seçim bu olur:\n\n${formatProductSummary(products[0])}`;
  }

  // Eğer 2 ürün varsa tek tek avantaj yaz
  if (products.length === 2) {
    const p1 = products[0];
    const p2 = products[1];

    return `
🧠 İkisi arasından seçim yapmak istersen şöyle:

👉 **${p1.title}**
+ Tasarım & kalite açısından daha premium
+ Çoğu kullanıcı tarafından tercih edilmiş görünüyorsa

👉 **${p2.title}**
+ Daha uygun fiyatlı olabilir
+ Günlük kullanım için avantajlı olabilir

Bence uzun vadede **${p1.title}** daha iyi seçim olabilir 😉`;
  }

  // 3 ten fazlaysa tek net öneri sun
  const top = products[0];

  return `
Epey seçenek var ama benim fikrim:
⭐ **En mantıklı tercih bu ürün olur:**
${formatProductSummary(top)}

Daha az riskli, daha dengeli ve fiyat/performans açısından güçlü 👍`;
}


/**
 * İsme göre hitap şekli
 * Örn: Ayla → Ayla Hanım
 * Burak → Burak Bey
 */
function formatCustomerName(name: string | null): string {
  if (!name) return "";
  const lower = name.toLowerCase();
  const honor =
    lower.endsWith("a") ||
    lower.endsWith("e") ||
    lower.endsWith("ı") ||
    lower.endsWith("i") ||
    lower.endsWith("u") ||
    lower.endsWith("ü")
      ? "Hanım"
      : "Bey";

  return `${name} ${honor}`;
}


/**
 * Daha net, akıllı yanıt oluşturma helper’ı
 */
function buildIntentAwareLine(intent: "HIGH" | "MID" | "LOW"): string {
  if (intent === "HIGH") {
    return "\nBu arada, dilersen sana hemen en uygun seçimi net şekilde söyleyebilirim 👍";
  }

  if (intent === "MID") {
    return "\nKararsızsan sorun değil, sana ürünlerin artı–eksi yönlerini de açıklayabilirim.";
  }

  return "\nİstersen sadece bakınabilir, istediğinde soru sorabilirsin 😊";
}
/**
 * Kullanıcı duygu durumunu analiz eder ve etkileşime göre ton belirler
 */
function detectSentiment(message: string): "NEGATIVE" | "POSITIVE" | "NEUTRAL" {
  const t = normalizeText(message);

  // NEGATIVE
  if (
    t.includes("çok kötü") ||
    t.includes("berbat") ||
    t.includes("hiç beğenmedim") ||
    t.includes("rezalet") ||
    t.includes("sinirlendim") ||
    t.includes("pişman oldum") ||
    t.includes("mutsuzum") ||
    t.includes("canım sıkıldı")
  ) {
    return "NEGATIVE";
  }

  // POSITIVE
  if (
    t.includes("harika") ||
    t.includes("bayıldım") ||
    t.includes("çok iyi") ||
    t.includes("mükemmel") ||
    t.includes("süper")
  ) {
    return "POSITIVE";
  }

  return "NEUTRAL";
}


/**
 * Kullanıcının duygusuna göre yanıt tonunu şekillendirir
 */
function sentimentTone(sentiment: string): string {
  if (sentiment === "NEGATIVE") {
    return "\nAnladım 😔 Bu konuda yanında olmak isterim. İstersen beraber daha iyi bir alternatif bulalım.";
  }

  if (sentiment === "POSITIVE") {
    return "\nHarikaaa! 😍 Böyle sevmen beni mutlu etti, istersen biraz daha benzer ürün önerebilirim.";
  }

  return "";
}


/**
 * Ürün kötü ihtimali varsa dürüst ama yapıcı dönüş sağlar
 */
function buildHonestOpinion(p: Product): string {
  const t = normalizeText(p.title);

  if (t.includes("no name") || t.includes("plastik") || t.includes("eski model")) {
    return (
      "\n👀 Dürüst olayım; üründe kalite olarak ufak soru işaretleri olabilir." +
      "\nİstersen fiyat-performans açısından biraz daha güçlü ürünlere bakalım 👍"
    );
  }

  if (p.price && parseFloat(p.price) > 15000) {
    return "\n💰 Fiyat biraz yüksek, ama uzun ömürlü kullanım için mantıklı olabilir.";
  }

  return "";
}


/**
 * Kullanıcı agresif veya sert konuşursa sakinleştiren yanıt üretir
 */
function calmResponse(message: string): string | null {
  const t = normalizeText(message);

  if (
    t.includes("rezalet") ||
    t.includes("çok kötü hizmet") ||
    t.includes("nefret ettim") ||
    t.includes("aptal bot")
  ) {
    return (
      "Böyle hissetmene gerçekten üzüldüm 😞 " +
      "Amacım yardımcı olmak. Ne yaşadığını biraz anlatırsan senin adına çözelim 🙏"
    );
  }

  return null;
}


/**
 * Kullanıcı ilgi bekliyorsa biraz daha sosyal yanıt üretme
 */
function empathyLine(message: string): string | null {
  const t = normalizeText(message);

  if (t.includes("sıkıldım")) {
    return "İstersen birlikte biraz gezinelim 😊 Güzel ürünler gösterebilirim.";
  }

  if (t.includes("kararsızım") || t.includes("emin değilim")) {
    return "Kararsız olman çok normal 😊 Beraber netleştirelim, sorun değil.";
  }

  return null;
}
/**
 * Kullanıcının tercihlerini akılda tutma
 * (kalıcı değil — konuşma bazlı hafıza)
 */
let userPreferences: {
  size?: string;
  color?: string;
  budget?: string;
  category?: string;
} = {};


/**
 * Kullanıcının cevabından tercih çıkarır
 */
function extractPreferences(message: string) {
  const t = normalizeText(message);

  if (t.includes("40") || t.includes("41") || t.includes("42") || t.includes("43")) {
    userPreferences.size = message;
  }

  if (t.includes("siyah") || t.includes("kırmızı") || t.includes("beyaz")) {
    userPreferences.color = message;
  }

  if (t.includes("300 tl") || t.includes("500 tl")) {
    userPreferences.budget = message;
  }

  if (t.includes("bot") || t.includes("spor ayakkabı") || t.includes("hırdavat")) {
    userPreferences.category = message;
  }
}


/**
 * Kullanıcı geçmişini ve tercihlerini kullanarak öneri üretme
 */
function smartRecommendation(
  products: Product[],
  message: string
): string | null {
  extractPreferences(message);

  const matches: Product[] = [];

  for (const p of products) {
    const title = normalizeText(p.title);

    if (userPreferences.color && title.includes(userPreferences.color.split(" ")[0])) {
      matches.push(p);
    }

    if (userPreferences.category && title.includes(userPreferences.category.split(" ")[0])) {
      matches.push(p);
    }
  }

  if (matches.length > 0) {
    return (
      "Senin önceki tercihlerini baz alarak şunlar tam sana uygun görünüyor 😌\n\n" +
      matches.slice(0, 3).map(formatProductSummary).join("\n\n") +
      "\n\nDilersen sepete eklemeden önce beden ya da renk teyidi isteyebilirsin."
    );
  }

  return null;
}


/**
 * Tek ürün yerine “mantık yürüten” cevap
 */
function logicBasedResponse(
  intent: Intent,
  message: string,
  products: Product[]
): string | null {
  const t = normalizeText(message);

  // Kullanıcı fiyat odaklı ise:
  if (intent === "ASK_PRICE" && t.includes("hangisi mantıklı")) {
    const sorted = [...products].sort((a, b) => {
      const pa = parseFloat(a.price || "0");
      const pb = parseFloat(b.price || "0");
      return pa - pb; // ucuzdan pahalıya
    });

    const cheapest = sorted[0];
    const mid = sorted[Math.floor(sorted.length / 2)];
    const expensive = sorted[sorted.length - 1];

    return (
      "Senin için üç bütçede seçenek hazırladım 👇\n\n" +
      "💸 Ekonomik seçenek:\n" +
      formatProductSummary(cheapest) +
      "\n\n💛 Dengeli fiyat/performans:\n" +
      formatProductSummary(mid) +
      "\n\n🔥 Premium yüksek kalite:\n" +
      formatProductSummary(expensive) +
      "\n\nBütçeni yazarsan sana en uygun olanı netleştirelim 😊"
    );
  }

  // Kullanıcı sadece "öner" dediyse ama niyet yoksa
  if (intent === "ASK_RECOMMENDATION") {
    const general = smartRecommendation(products, message);
    if (general) return general;
  }

  return null;
}

/**
 * Kullanıcıyı satın almaya yönlendiren cümleler
 */
function persuasiveEnding(purchaseIntent: "LOW" | "MID" | "HIGH"): string {
  if (purchaseIntent === "HIGH") {
    return "\n⭐ Dilersen hemen sipariş adımına geçebilirsin, stok tükenmeden almak iyi olur.";
  }

  if (purchaseIntent === "MID") {
    return "\n💡 Bence bugün değerlendirmen iyi olur, fiyatlar değişebiliyor.";
  }

  return "\nİstersen benzer ürünleri de gösterebilirim 😊";
}


/**
 * Tüm sistemi bağlayan ve nihai akıllı cevap üretimini yapan yapı
 */
export function buildFullSmartResponse(
  intent: Intent,
  message: string,
  products: Product[],
  customerName: string | null
): string {
  const sentiment = detectSentiment(message);
  const moodTone = sentimentTone(sentiment);

  const calm = calmResponse(message);
  if (calm) return calm;

  const logic = logicBasedResponse(intent, message, products);
  if (logic) return logic;

  const baseResponse = buildReplyForIntent(
    intent,
    message,
    products,
    customerName
  );

  const nameSub = customerName
    ? `\n${customerName.endsWith("a") || customerName.endsWith("e") ? "Hanım" : "Bey"}`
    : "";

  const persuasion = persuasiveEnding(detectPurchaseIntent(message));

  const empathy = empathyLine(message);

  const main = baseResponse + moodTone + persuasion;

  if (empathy) return main + "\n\n" + empathy;

  return main;
}

function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {

  const nameSuffix = customerName ? ` ${customerName}` : "";
  const matches = findMatchingProducts(userMessage, products);
  const mainProduct = matches[0] || products[0] || null;
  const purchaseIntent = detectPurchaseIntent(userMessage);
  const absurdIdea = rejectAbsurdIdeas(userMessage);

  // Absürt kombin engellemesi
  if (absurdIdea) {
    return absurdIdea;
  }

  // 3 ürün isteği
  if (
    /3 ürün|üç ürün|3 tane öner|3 tane ürün|üç öner|3 öner/i.test(userMessage)
  ) {
    const list = products.slice(0, 3);

    if (!list.length) {
      return "🛍️ Şu an önerilecek ürün bulamadım 😔 Mağazada ürün ekli değil.";
    }

    return (
      "🛒 Senin için 3 ürün seçtim:\n\n" +
      list.map((p) => formatProductSummary(p)).join("\n\n") +
      "\n\nİçlerinden hangisini daha detaylı incelemek istersin?"
    );
  }

  // Hangisi mantıklı → kıyaslama
  if (/hangisi mantıklı|mantıklı hangisi|karşılaştır/i.test(userMessage)) {
    const list = products.slice(0, 2);

    if (list.length < 2) {
      return "Karşılaştırma yapacak 2 ürün bulamadım 😕";
    }

    const A = list[0];
    const B = list[1];

    return (
      "🧠 Senin için kıyasladım:\n\n" +
      `👉 **${A.title}**\n- Daha uygun fiyatlı: ${A.price ?? "--"}\n\n` +
      `👉 **${B.title}**\n- Model olarak daha yeni\n\n` +
      `🎯 Ben olsam **${A.title}** alırdım. Çünkü daha mantıklı duruyor. 👍`
    );
  }

  // satın alma niyeti yüksek
  if (purchaseIntent === "HIGH" && mainProduct) {
    return (
      `🛍️ Bence iyi tercih olur${nameSuffix}! ` +
      `"${mainProduct.title}" kullanıcılar tarafından sık tercih ediliyor.\n\n` +
      `⭐ Eğer aklındaysa kaçırma derim.\n\n${formatProductSummary(mainProduct)}`
    );
  }

  // satın alma niyeti kararsız
  if (purchaseIntent === "MID" && mainProduct) {
    return (
      `🧠 Kararsız olman normal${nameSuffix}.` +
      ` "${mainProduct.title}" gerçekten tercih edilen bir ürün.\n\n` +
      "İstersen sepete ekle, sonra karar verirsin 😊"
    );
  }

  // fallback: ürün varsa
  if (mainProduct) {
    return (
      formatProductSummary(mainProduct) +
      "\n\nDetay istersen ayrıca sorabilirsin 😊"
    );
  }

  // fallback: ürün yoksa
  return "Şu anda anlattığın ürüne uygun ürün bulamadım 😔 Daha net marka/model söyleyebilirsin.";
}

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