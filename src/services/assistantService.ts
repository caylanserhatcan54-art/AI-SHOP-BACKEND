// src/services/assistantService.ts

import {
  Product,
  getProductsForShop,
  normalizeText,
} from "./productService.js";

/* -------------------------------------------------
 * FRONTEND İÇİN ÜRÜN FORMATLAMA + YENİ EXPORT
 * ------------------------------------------------- */

// Kullanıcıya göstereceğimiz sade ürün formatı
function formatProductsForFrontend(products: Product[]): {
  id: string;
  title: string;
  price: string;
  url: string;
  imageUrl: string;
  category?: string;
}[] {
  return products.slice(0, 6).map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price ? String(p.price) : "",
    url: p.url || "",
    imageUrl:
      (p as any).imageUrl ||
      (p as any).image ||
      (p as any).image_url ||
      (p as any).images ||
      "",
    category: p.category,
  }));
}

// Basit bir eşleştirme: mesajdaki kelimelere göre ürün bulma
function findMatchingProductsForFrontend(
  msg: string,
  products: Product[]
): Product[] {
  const t = normalizeText(msg);

  if (!products.length) return [];

  // Kategori anahtar kelimeleri
  const isAyakkabi = /(ayakkabı|ayakkabi|spor ayakkabı|spor ayakkabi|sneaker|bot)/i.test(msg);
  const isMont = /(mont|kaban|sisme mont|şişme mont|kaban)/i.test(msg);
  const isKazak = /(kazak|sweat|sweatshirt|hoodie)/i.test(msg);
  const isPantolon = /(pantolon|jean|kot)/i.test(msg);

  let filtered = products;

  if (isAyakkabi) {
    filtered = products.filter(
      (p) => (p.category || "").toLowerCase() === "ayakkabi"
    );
  } else if (isMont) {
    filtered = products.filter(
      (p) => normalizeText(p.title || "").includes("mont") ||
             normalizeText(p.title || "").includes("kaban")
    );
  } else if (isKazak) {
    filtered = products.filter(
      (p) =>
        normalizeText(p.title || "").includes("kazak") ||
        normalizeText(p.title || "").includes("sweat")
    );
  } else if (isPantolon) {
    filtered = products.filter(
      (p) =>
        normalizeText(p.title || "").includes("pantolon") ||
        normalizeText(p.title || "").includes("jean")
    );
  }

  // Hiç eşleşme yoksa tüm ürünlerden random 6 tane
  if (!filtered.length) {
    filtered = [...products];
  }

  // Basit shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return filtered.slice(0, 6);
}

/**
 * YENİ: Hem akıllı metin cevabı, hem de ürün listesi dönen fonksiyon
 */
export async function getAssistantReplyWithProducts(
  shopId: string,
  userMessage: string
): Promise<{ reply: string; products: ReturnType<typeof formatProductsForFrontend> }> {
  // Eski akıllı cevabı kullan
  const reply = await getAssistantReply(shopId, userMessage);

  // Mağaza ürünleri
  const allProducts = await getProductsForShop(shopId);
  const matched = findMatchingProductsForFrontend(userMessage, allProducts);
  const formatted = formatProductsForFrontend(matched);

  return { reply, products: formatted };
}


/* ----------------------------------------------------
   FRONTEND’E JSON FORMATINDA CEVAP DÖNEN YENİ FUNK.
---------------------------------------------------- */
export async function processChatMessage(shopId: string, message: string) {
  const products = await getProductsForShop(shopId);

  // 🔥 Asıl akıllı cevap motoru
  const aiReply = await generateSmartReply(shopId, message);

  // 🔥 Frontend ürün kartları
  let matchedProducts = [];

  if (products && products.length > 0) {
    matchedProducts = formatProductsForFrontend(products);
  }

  return {
    reply: aiReply,
    products: matchedProducts,
  };
}


/* ----------------------------------------------
 * CUSTOMER MEMORY ENGINE
 * ---------------------------------------------- */
type MemoryStore = {
  lastSeenProduct: Product | null;
  lastSeenCategory: string | null;
  lastColor: string | null;
  lastSize: string | null;
  lastBudget: number | null;
  lastTargetPerson: "SELF" | "ANNEM" | "BABAM" | "COCUK" | null;
  lastUserMessage: string | null;
  lastTimestamp: number;
};

let CUSTOMER_MEMORY: MemoryStore = {
  lastSeenProduct: null,
  lastSeenCategory: null,
  lastColor: null,
  lastSize: null,
  lastBudget: null,
  lastTargetPerson: null,
  lastUserMessage: null,
  lastTimestamp: Date.now(),
};

let DYNAMIC_PROFILE = {
  lastFavoriteColor: null as string | null,
  lastBudget: null as number | null,
  lastSize: null as string | null,
  lastInterestCategory: null as string | null,
};

/**
 * Bu fonksiyon her mesajdan sonra hafızayı günceller
 */
function updateMemory(userMsg: string, products: Product[], main: Product | null) {
  const t = normalizeText(userMsg);

  CUSTOMER_MEMORY.lastUserMessage = userMsg;
  CUSTOMER_MEMORY.lastTimestamp = Date.now();

  // Bütçe yakalama
  const budgetMatch = t.match(/\b(\d{3,5})\b/);
  if (budgetMatch) CUSTOMER_MEMORY.lastBudget = parseInt(budgetMatch[1]);

  // Renk yakalama
  if (t.includes("siyah")) CUSTOMER_MEMORY.lastColor = "siyah";
  if (t.includes("beyaz")) CUSTOMER_MEMORY.lastColor = "beyaz";
  if (t.includes("kırmızı") || t.includes("kirmizi")) CUSTOMER_MEMORY.lastColor = "kırmızı";
  if (t.includes("mavi")) CUSTOMER_MEMORY.lastColor = "mavi";

  // Numara yakalama
  const sizeMatch = userMsg.match(/\b(36|37|38|39|40|41|42|43|44)\b/);
  if (sizeMatch) CUSTOMER_MEMORY.lastSize = sizeMatch[0];

  // Hedef kişi yakalama
  if (t.includes("kendime") || t.includes("beni için")) CUSTOMER_MEMORY.lastTargetPerson = "SELF";
  if (t.includes("anneme") || t.includes("anneye")) CUSTOMER_MEMORY.lastTargetPerson = "ANNEM";
  if (t.includes("babam") || t.includes("babaya")) CUSTOMER_MEMORY.lastTargetPerson = "BABAM";
  if (t.includes("kızıma") || t.includes("oğluma") || t.includes("çocuğuma"))
    CUSTOMER_MEMORY.lastTargetPerson = "COCUK";

  // Son kategori
  if (products.length)
    CUSTOMER_MEMORY.lastSeenCategory = products[0].category ?? CUSTOMER_MEMORY.lastSeenCategory;

  // Son ürün kaydı
  if (main) CUSTOMER_MEMORY.lastSeenProduct = main;
}

/**
 * Memory tabanlı ek hatırlatma satırı
 */
function replyWithMemoryHints(): string {
  const lines: string[] = [];

  if (CUSTOMER_MEMORY.lastColor)
    lines.push(`🎨 Son sefer **${CUSTOMER_MEMORY.lastColor}** renk istemiştin.`);

  if (CUSTOMER_MEMORY.lastSize)
    lines.push(`📏 Daha önce **${CUSTOMER_MEMORY.lastSize}** beden demiştin.`);

  if (CUSTOMER_MEMORY.lastBudget)
    lines.push(`💰 Bütçen yaklaşık **${CUSTOMER_MEMORY.lastBudget} TL** seviyesindeydi.`);

  if (CUSTOMER_MEMORY.lastSeenCategory)
    lines.push(`🛍️ Son baktığın kategori: **${CUSTOMER_MEMORY.lastSeenCategory}**`);

  if (CUSTOMER_MEMORY.lastTargetPerson === "ANNEM")
    lines.push("👩 Anne için bakıyordun, hâlâ onun için mi?");

  if (CUSTOMER_MEMORY.lastTargetPerson === "COCUK")
    lines.push("🧒 Çocuk için bakıyordun, yaş bilgisi de verirsen daha iyi öneririm.");

  return lines.length ? "\n\n🧠 Hatırladıklarım:\n" + lines.join("\n") : "";
}


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
 * Türkçe stop-word'ler
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
 * Günlük sohbet cevapları
 */
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|naber|nbr|ne yapıyorsun|napıyorsun)/i,
    answer:
      "İyiyim ve buradayım 😊 Sen nasılsın? Bugün ne bakıyoruz, ürün mü, kombin mi?",
  },
  {
    regex: /(canım sıkıldı|canim sikildi|sıkıldım|sikildim|moralim bozuk)/i,
    answer:
      "Üzülme, bazen hepimizin modu düşüyor 😌 İstersen sana birkaç güzel ürün ve kombin göstereyim, belki modun yerine gelir.",
  },
  {
    regex: /(bot musun|yapay zeka mısın|yapay zeka misin|gerçek misin|gercek misin)/i,
    answer:
      "Ben FlowAI 🤖 Bu mağazanın akıllı asistanıyım. Gerçek insan değilim ama ürün seçerken gerçekçi, mantıklı öneriler vermeye çalışıyorum 😊",
  },
];

/**
 * İsim yakalama
 */
const NAME_PATTERN =
  /(benim adım|benim adim|adım|adim|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const raw = m[2];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * Hitap biçimi
 */
function formatCustomerName(name: string | null): string {
  if (!name) return "";
  const lower = name.toLowerCase();
  const isFemale =
    lower.endsWith("a") ||
    lower.endsWith("e") ||
    lower.endsWith("ı") ||
    lower.endsWith("i") ||
    lower.endsWith("u") ||
    lower.endsWith("ü");
  return `${name} ${isFemale ? "Hanım" : "Bey"}`;
}

/**
 * Absürt / saçma kombinleri reddetme
 */
function rejectAbsurdIdeas(message: string): string | null {
  const t = normalizeText(message);

  const absurdCombos = [
    {
      keywords: ["terlik", "kaban"],
      msg: "Terlikle kaban çok uymaz 😊 Daha dengeli bir kombin yapalım istersen, sana uygun bir şeyler önerebilirim.",
    },
    {
      keywords: ["bot", "kirmizi corap"],
      msg: "Botla parlak kırmızı çorap biraz iddialı 😄 Daha sade tonlarla çok daha şık durur, istersen alternatif kombin söyleyeyim.",
    },
    {
      keywords: ["mont", "sandalet"],
      msg: "Mont ile sandalet çok farklı mevsimlere ait gibi duruyor 😅 Daha uyumlu bir kombin seçelim istersen.",
    },
  ];

  for (const r of absurdCombos) {
    const allMatch = r.keywords.every((w) => t.includes(w));
    if (allMatch) return r.msg;
  }

  return null;
}

/**
 * Satın alma niyeti tespiti
 */
function detectPurchaseIntent(message: string): "HIGH" | "MID" | "LOW" {
  const t = normalizeText(message);

  if (
    t.includes("sepete attim") ||
    t.includes("sepete ekledim") ||
    t.includes("sepete aticam") ||
    t.includes("alacam") ||
    t.includes("alacagim") ||
    t.includes("alıyorum") ||
    t.includes("aliyorum") ||
    t.includes("satin alayim") ||
    t.includes("siparis geciyorum")
  ) {
    return "HIGH";
  }

  if (
    t.includes("dusunuyorum") ||
    t.includes("kararsizim") ||
    t.includes("sonra bakarim") ||
    t.includes("bakarim belki") ||
    t.includes("simdilik bakiyorum")
  ) {
    return "MID";
  }

  return "LOW";
}

/**
 * Duygu analizi
 */
function detectSentiment(message: string): "NEGATIVE" | "POSITIVE" | "NEUTRAL" {
  const t = normalizeText(message);

  if (
    t.includes("cok kotu") ||
    t.includes("berbat") ||
    t.includes("hic begenmedim") ||
    t.includes("rezalet") ||
    t.includes("sinirliyim") ||
    t.includes("pisman oldum") ||
    t.includes("moralim bozuk") ||
    t.includes("canim sikildi")
  ) {
    return "NEGATIVE";
  }

  if (
    t.includes("harika") ||
    t.includes("bayildim") ||
    t.includes("cok iyi") ||
    t.includes("mukemmel") ||
    t.includes("super")
  ) {
    return "POSITIVE";
  }

  return "NEUTRAL";
}

/**
 * Duyguya göre ek satır
 */
function sentimentTone(sentiment: "NEGATIVE" | "POSITIVE" | "NEUTRAL"): string {
  if (sentiment === "NEGATIVE") {
    return (
      "\nAnladım, pek iç açıcı bir modda değilsin 😔 " +
      "İstersen beraber daha iyi bir seçenek bulalım, yanında olmaya çalışırım."
    );
  }

  if (sentiment === "POSITIVE") {
    return "\nSüper! Böyle düşünmene sevindim 😍 İstersen buna benzer birkaç ürün daha önerebilirim.";
  }

  return "";
}

/**
 * Sert / agresif şikayetlerde sakinleştiren cevap
 */
function calmResponse(message: string): string | null {
  const t = normalizeText(message);

  if (
    t.includes("rezalet") ||
    t.includes("nefret ettim") ||
    t.includes("aptal bot") ||
    t.includes("cok kotu hizmet")
  ) {
    return (
      "Böyle hissetmene gerçekten üzüldüm 😞 Amacım seni sinirlendirmek değil, yardımcı olmak." +
      "\nNe yaşadığını biraz anlatırsan, elimden geldiğince çözüm için yönlendireyim 🙏"
    );
  }

  return null;
}

/**
 * Kullanıcı ilgi beklediğinde empati satırı
 */
function empathyLine(message: string): string | null {
  const t = normalizeText(message);

  if (t.includes("sikildim") || t.includes("canim sikildi")) {
    return "İstersen birlikte biraz ürün gezelim 😊 Beğendiğin tarzı söyle, ona göre öneri yapayım.";
  }

  if (t.includes("kararsizim") || t.includes("emin degilim")) {
    return "Kararsız olman çok normal 😊 Artı–eksi yönlerini beraber tartışabiliriz, rahat ol.";
  }

  return null;
}

/**
 * Mağaza kategorisini ürünlerden tahmin et
 */
function detectStoreCategory(products: Product[]): string {
  if (!products.length) return "genel";

  const all = products
    .map((p) => normalizeText(p.title || ""))
    .join(" ");

  const has = (words: string[]) => words.some(w => all.includes(w));

  if (has(["elbise", "pantolon", "kazak", "gomlek", "etek", "tunik", "ceket", "sweat", "eşofman"]))
    return "giyim";

  if (has(["ayakkabi", "sneaker", "bot", "sandlet", "terlik", "topuklu"]))
    return "ayakkabi";

  if (has(["telefon", "laptop", "bilgisayar", "kulaklik", "televizyon", "monitor", "tablet", "powerbank"]))
    return "elektronik";

  if (has(["kilif", "kılıf", "case", "koruyucu", "aksesuar"]))
    return "telefon-aksesuari";

  if (has(["parfum", "parfüm", "edp", "edt", "kokusu"]))
    return "parfum";

  if (has(["sampuan", "şampuan", "sabun", "deo", "deo", "kolonya", "temizleme", "cilt", "yuz krem", "serum"]))
    return "kozmetik-bakim";

  if (has(["deterjan", "yuzey temizleyici", "camasir", "bulaşık", "temizlik", "kir çözücü"]))
    return "temizlik";

  if (has(["fırın", "buzdolabi", "çamaşır makinesi", "beyaz esya", "kurutma"]))
    return "beyaz-esya";

  if (has(["matkap", "tornavida", "hirdavat", "vida", "anahtar", "pense", "rulo", "macun"]))
    return "hirdavat";

  if (has(["cadir", "kamp", "ocak", "kamp sandalye", "kamp masa"]))
    return "kamp-outdoor";

  if (has(["tencere", "bardak", "tabak", "mutfak", "cakmak", "çatal kaşık"]))
    return "mutfak";

  if (has(["oyuncak", "lego", "bebek", "figür", "oyun seti"]))
    return "oyuncak";

  if (has(["dumbbell", "halter", "fitness", "koşu", "yoga"]))
    return "spor";

  if (has(["paspas", "hali", "kilim", "perde", "dekor", "vazo", "çerçeve"]))
    return "ev-dekorasyon";

  if (has(["koltuk", "masa", "sandalye", "gardrop", "yatak"]))
    return "mobilya";

  return "genel";
}

/**
 * Intent tespiti
 */
function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  // SMALL TALK
  if (
    t.includes("nasilsin") ||
    t.includes("naber") ||
    t.includes("napıyorsun") ||
    t.includes("napyorsun") ||
    t.includes("ne yapiyorsun") ||
    t.includes("canim sikildi") ||
    t.includes("sikildim") ||
    t.includes("moralim bozuk") ||
    t.includes("bot musun") ||
    t.includes("yapay zeka") ||
    t.includes("gercek misin")
  ) {
    return "SMALL_TALK";
  }

  // SELAMLAMA
  if (
    t.includes("merhaba") ||
    t.includes("selam") ||
    t.includes("iyi gunler") ||
    t.includes("slm")
  ) {
    return "GREETING";
  }

  // Mantıklı hangisi? / karar
  if (
    t.includes("hangisi mantikli") ||
    t.includes("mantikli hangisi") ||
    t.includes("hangisini alayim") ||
    t.includes("hangisini secmeliyim")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // 3 ürün isteği
  if (
    t.includes("3 urun") ||
    t.includes("uc urun") ||
    t.includes("3 tane oner") ||
    t.includes("uc tane oner") ||
    t.includes("bana uc oner") ||
    t.includes("bana uc tane oner")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // sepete attım alayım mı?
  if (t.includes("sepete attim") || t.includes("alayim mi")) {
    return "ASK_RECOMMENDATION";
  }

  // Sezon soruları yine öneriye gider
  if (
    t.includes("kis icin") ||
    t.includes("kış icin") ||
    t.includes("yaz icin") ||
    t.includes("havalar soguyor") ||
    t.includes("hava sogudu") ||
    t.includes("yaz yaklasiyor") ||
    t.includes("kis sezonu") ||
    t.includes("kış sezonu")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // Ürün odaklı klasik intentler
  if (
    t.includes("fiyat") ||
    t.includes("kaca") ||
    t.includes("kaça") ||
    t.includes("ne kadar") ||
    t.includes("ucret") ||
    t.includes("ücret")
  )
    return "ASK_PRICE";

  if (
    t.includes("stok") ||
    t.includes("var mi") ||
    t.includes("kalmis mi") ||
    t.includes("kalmis") ||
    t.includes("tukendi mi") ||
    t.includes("tukendi")
  )
    return "ASK_STOCK";

  if (
    t.includes("renk") ||
    t.includes("baska renk") ||
    t.includes("hangi renk")
  )
    return "ASK_COLOR";

  if (
    t.includes("beden") ||
    t.includes("numara") ||
    t.includes("kac beden") ||
    t.includes("ayak numarasi") ||
    t.includes("ayak numarası") ||
    t.includes("36 olur mu") ||
    t.includes("43 olur mu")
  )
    return "ASK_SIZE";

  if (
    t.includes("malzeme") ||
    t.includes("kumastan") ||
    t.includes("kumas") ||
    t.includes("icerik") ||
    t.includes("icindekiler") ||
    t.includes("kalite") ||
    t.includes("dayanikli")
  )
    return "ASK_MATERIAL";

  if (
    t.includes("ne icin kullanilir") ||
    t.includes("ne icin kullanirim") ||
    t.includes("nerede kullanilir") ||
    t.includes("hangi amacla") ||
    t.includes("kullanim amaci")
  )
    return "ASK_USAGE";

  if (
    t.includes("uygun mu") ||
    t.includes("uyar mi") ||
    t.includes("uyar mı") ||
    t.includes("uygun olur mu") ||
    t.includes("ofis icin uygun mu") ||
    t.includes("denizde kullanilir mi")
  )
    return "ASK_SUITABILITY";

  if (
    t.includes("oner") ||
    t.includes("öner") ||
    t.includes("onerir misin") ||
    t.includes("ne onerirsin") ||
    t.includes("hangi urunu alayim") ||
    t.includes("hangi ürünü alayım")
  )
    return "ASK_RECOMMENDATION";

  if (
    t.includes("kombin") ||
    t.includes("yanina ne gider") ||
    t.includes("yanina ne olur") ||
    t.includes("neyle giyilir") ||
    t.includes("neyle kullanilir")
  )
    return "ASK_COMBINATION";

  if (
    t.includes("kargo") ||
    t.includes("teslimat") ||
    t.includes("ne zaman gelir") ||
    t.includes("kac gunde gelir")
  )
    return "ASK_SHIPPING";

  if (
    t.includes("iade") ||
    t.includes("degisim") ||
    t.includes("degistirmek istiyorum") ||
    t.includes("geri gondermek istiyorum")
  )
    return "ASK_RETURN";

  if (
    t.includes("kargom nerede") ||
    t.includes("kargo nerede") ||
    t.includes("siparisim nerede") ||
    t.includes("siparis takip") ||
    t.includes("takip numarasi")
  )
    return "TRACK_ORDER";

  if (
    t.includes("sikayet") ||
    t.includes("şikayet") ||
    t.includes("memnun degil") ||
    t.includes("memnun değil") ||
    t.includes("cok kotu") ||
    t.includes("hayal kirikligi")
  )
  // Ek niyetler — benzer ürün, daha ucuz, daha iyi, hediye vb.

  // Benzer / alternatif ürün isteği
  if (
    t.includes("benzer") ||
    t.includes("alternatif") ||
    t.includes("baska model") ||
    t.includes("baska urun") ||
    t.includes("baska ne var")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // Daha ucuz ürün isteği
  if (
    t.includes("daha ucuz") ||
    t.includes("ucuz olan") ||
    t.includes("fiyati dusuk") ||
    t.includes("butceme uygun")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // Daha kaliteli / üst seviye istek
  if (
    t.includes("daha iyi") ||
    t.includes("daha kaliteli") ||
    t.includes("ust seviye") ||
    t.includes("bir ust model")
  ) {
    return "ASK_RECOMMENDATION";
  }

  // Aynı ürünün farklı rengi
  if (
    (t.includes("aynisi") || t.includes("ayni urun")) &&
    (t.includes("rengi") || t.includes("renk"))
  ) {
    return "ASK_COLOR";
  }

  // Hediye niyeti
  if (
    t.includes("hediye") ||
    t.includes("hediyelik") ||
    t.includes("hediye alinirmi") ||
    t.includes("hediye olur mu")
  ) {
    return "ASK_SUITABILITY";
  }

  return "UNKNOWN";
}
/* ----------------------------------------------
 * Çoklu Intent Tespit
 * ---------------------------------------------- */
function detectMultipleIntents(msg: string): Intent[] {
  const intents: Intent[] = [];
  const t = normalizeText(msg);

  if (/fiyat|kaca|ne kadar|ucret/.test(t)) intents.push("ASK_PRICE");
  if (/stok|var mi|tukendi/.test(t)) intents.push("ASK_STOCK");
  if (/renk|hangi renk/.test(t)) intents.push("ASK_COLOR");
  if (/beden|numara|kac beden/.test(t)) intents.push("ASK_SIZE");
  if (/malzeme|icerik|kumas/.test(t)) intents.push("ASK_MATERIAL");
  if (/ne icin|nerede kullan/.test(t)) intents.push("ASK_USAGE");
  if (/uyar mi|uygun mu/.test(t)) intents.push("ASK_SUITABILITY");
  if (/kombin|yanina ne olur|neyle olur/.test(t)) intents.push("ASK_COMBINATION");
  if (/kargo|teslimat|ne zaman gelir/.test(t)) intents.push("ASK_SHIPPING");
  if (/iade|degisim/.test(t)) intents.push("ASK_RETURN");
  if (/takip|nerede|kargom/.test(t)) intents.push("TRACK_ORDER");

  if (!intents.length) intents.push(detectIntent(msg));

  return intents;
}


/**
 * Kullanıcının metniyle ürün eşleştirme
 */
function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const normMsg = normalizeText(msg);

  if (!products.length) return [];

  const tokens = normMsg.split(" ").filter(t => t.length > 2);

  // Müşteri hiç ürün ismi belirtmediyse → en popüler 5 ürünü ver
  if (tokens.length === 0) return products.slice(0, 5);

  const scored: { product: Product; score: number }[] = [];

  for (const p of products) {
    const title = normalizeText(p.title || "");
    const category = normalizeText(p.category || "");
    const price = p.price ? parseInt(String(p.price).replace(/\D/g, "")) : 0;

    let score = 0;

    // Başlık eşleşmesi — en yüksek puan
    for (const token of tokens) {
      if (title.includes(token)) score += 10;
    }

    // Kategori eşleşmesi
    for (const token of tokens) {
      if (category.includes(token)) score += 6;
    }

    // Renk kelimeleri
    if (normMsg.includes("siyah") && title.includes("siyah")) score += 4;
    if (normMsg.includes("beyaz") && title.includes("beyaz")) score += 4;
    if (normMsg.includes("gri") && title.includes("gri")) score += 4;
    if (normMsg.includes("kirmizi") && title.includes("kirmizi")) score += 4;

    // Fiyat niyeti (ucuz / pahalı)
    if (normMsg.includes("ucuz") && price < 300) score += 3;
    if (normMsg.includes("pahali") && price > 1500) score += 3;

    // Genel kelimeler
    if (normMsg.includes("ayakkabi") && title.includes("spor")) score += 5;
    if (normMsg.includes("kazan") && title.includes("kazak")) score += 5;

    // Benzersiz puan
    if (score > 0) scored.push({ product: p, score });
  }

  // Puan sıralama
  scored.sort((a, b) => b.score - a.score);

  // En iyi 5 ürün
  return scored.slice(0, 5).map(s => s.product);
}

/**
 * Ürün özet formatı
 */
function formatProductSummary(p: Product): string {
  const lines: string[] = [];

  lines.push(`✨ **${p.title}**`);

  if (p.price) lines.push(`💰 Fiyat: ${p.price}`);
  else lines.push("💰 Fiyat: Güncel fiyat ürün sayfasında yer alıyor.");

  if ((p as any).imageUrl) {
    lines.push(`🖼️ Görsel: ${(p as any).imageUrl}`);
  } else if ((p as any).image) {
    lines.push(`🖼️ Görsel: ${(p as any).image}`);
  }

  if (p.category) lines.push(`📂 Kategori: ${p.category}`);
  if ((p as any).color) lines.push(`🎨 Renk: ${(p as any).color}`);
  if (p.url) lines.push(`🔗 Link: ${p.url}`);

  return lines.join("\n");
}

/**
 * Kullanım & kalite yorumu
 */
function usageAndQualityComment(p: Product): string {
  const title = (p.title || "").toLowerCase();
  const comments: string[] = [];

  // Materyal bazlı
  if (title.includes("deri") || title.includes("leather")) {
    comments.push("🧵 Deri yapısı sayesinde uzun süreli kullanım için dayanıklı görünüyor.");
  }
  if (title.includes("polar") || title.includes("kadife")) {
    comments.push("🧵 Yumuşak dokusu sayesinde sıcak ve konforlu bir kullanım sunar.");
  }
  if (title.includes("spor") || title.includes("running")) {
    comments.push("🏃 Hareketli kullanım ve günlük tempolu hayat için uygun bir model.");
  }
  if (title.includes("bot") || title.includes("kis") || title.includes("kış")) {
    comments.push("❄️ Soğuk havalarda koruma sağlamaya yönelik bir tasarım izlenimi veriyor.");
  }
  if (title.includes("waterproof") || title.includes("su gecirmez")) {
    comments.push("💧 Yağmur ve ıslak zeminlerde koruma sağlayan su geçirmez yapı bulunuyor.");
  }

  const cat = (p.category || "genel").toLowerCase();

  switch (cat) {
    case "elektronik":
      comments.push(
        "⚙️ Elektronik ürünlerde teknik özellikler kullanım deneyimini doğrudan etkiler; ihtiyacına göre seçim yapmak önemli."
      );
      break;
    case "ayakkabi":
      comments.push(
        "👟 Doğru numarayı seçtiğinde gün boyu konfor sağlayabilecek bir ayakkabı gibi görünüyor."
      );
      break;
    case "giyim":
      comments.push(
        "👚 Hem günlük kullanımda hem de kombinlerde rahatlıkla değerlendirebileceğin bir parça gibi duruyor."
      );
      break;
    case "kamp-outdoor":
      comments.push(
        "🏕️ Dış mekan şartlarına uygun olacak şekilde tasarlanmış izlenimi veriyor; dayanıklılık önemli bir avantajı olabilir."
      );
      break;
    case "hirdavat":
      comments.push(
        "🛠️ Hırdavat ürünlerinde sağlamlık ve güvenlik en önemli kriterlerdir; doğru kullanımda uzun ömürlü olabilir."
      );
      break;
    default:
      comments.push(
        "ℹ️ Genel kullanım için uygun, pratik ve işlevsel bir ürün gibi görünüyor."
      );
      break;
  }

  return comments.join("\n");
}

/**
 * Ek soru sorarak sohbeti ilerletme
 */
function buildFollowUpQuestions(
  userMessage: string,
  category: string
): string {
  const t = normalizeText(userMessage);

  if (
    t.includes("lamba") ||
    t.includes("avize") ||
    t.includes("aydinlatma")
  ) {
    return (
      "\n\n💡 Daha iyi yönlendirebilmem için:\n" +
      "- Hangi odada kullanacaksın? (salon, yatak odası, mutfak)\n" +
      "- Işık rengi tercihin var mı? (gün ışığı, beyaz, sarı)\n"
    );
  }

  if (t.includes("bilgisayar") || t.includes("oyun oynuyorum")) {
    return (
      "\n\n🖥️ Sana daha net öneri verebilmem için:\n" +
      "- Oyun mu, ofis mi ağırlıklı kullanacaksın?\n" +
      "- Yaklaşık bütçen ne kadar?\n"
    );
  }

  if (category === "giyim" || category === "ayakkabi") {
    return (
      "\n\n🧥 Kombin için birkaç soru:\n" +
      "- Günlük kullanım mı, özel gün mü?\n" +
      "- Daha spor mu seviyorsun yoksa klasik mi?\n"
    );
  }

  return "";
}

/**
 * Kombin / tamamlayıcı ürün önerisi
 */
function buildCombinationSuggestion(
  mainProduct: Product,
  allProducts: Product[]
): string {
  const cat = (mainProduct.category || "genel").toLowerCase();
  const norm = (s: string) => normalizeText(s || "");
  const lines: string[] = [];

  lines.push("🧩 Sana birkaç birlikte kullanılabilecek ürün önerisi hazırladım:\n");

  if (cat === "giyim") {
    const alt = allProducts.find((p) =>
      /pantolon|etek|kot|jean/.test(normalizeText(p.title || ""))
    );
    const ayakkabi = allProducts.find((p) =>
      /ayakkabi|ayakkabı|bot|sneaker/.test(normalizeText(p.title || ""))
    );

    lines.push("👕 Ana ürün:");
    lines.push(formatProductSummary(mainProduct));

    if (alt) {
      lines.push("\n👖 Alt kombin önerisi:");
      lines.push(formatProductSummary(alt));
    }

    if (ayakkabi) {
      lines.push("\n👟 Uygun ayakkabı önerisi:");
      lines.push(formatProductSummary(ayakkabi));
    }

    lines.push(
      "\n💡 Renklerde birbirine yakın tonları tercih edersen kombin çok daha şık durur."
    );
    return lines.join("\n");
  }

  if (cat === "ayakkabi") {
    const altGiyim = allProducts.find((p) =>
      /pantolon|kot|jean/.test(norm(p.title || ""))
    );

    lines.push("👟 Ana ürün:");
    lines.push(formatProductSummary(mainProduct));

    if (altGiyim) {
      lines.push("\n👖 Bu ayakkabıyla iyi gidecek alt giyim:");
      lines.push(formatProductSummary(altGiyim));
    }

    lines.push(
      "\n💡 Slim fit pantolonlarla daha modern, bol kesimlerle daha rahat bir stil yakalayabilirsin."
    );
    return lines.join("\n");
  }

  if (cat === "elektronik") {
    const aksesuar = allProducts.find((p) =>
      /kılıf|kilif|kulaklik|kulaklık|powerbank|sarj|şarj/.test(
        norm(p.title || "")
      )
    );

    lines.push("💻 Ana ürün:");
    lines.push(formatProductSummary(mainProduct));

    if (aksesuar) {
      lines.push("\n🔌 Tamamlayıcı aksesuar önerisi:");
      lines.push(formatProductSummary(aksesuar));
    }

    lines.push(
      "\n💡 Uyumlu kılıf, ekran koruyucu veya kulaklık gibi aksesuarlar kullanım deneyimini ciddi şekilde iyileştirir."
    );
    return lines.join("\n");
  }

  // Default
  lines.push("📦 Ana ürün:");
  lines.push(formatProductSummary(mainProduct));

  const extra = allProducts.find((p) => p.id !== mainProduct.id);
  if (extra) {
    lines.push("\n🔗 Birlikte alınabilecek alternatif bir ürün:");
    lines.push(formatProductSummary(extra));
  }

  lines.push(
    "\n💡 Genelde ana ürünü destekleyen küçük aksesuarlar hem kullanım hem de fiyat/performans açısından avantajlı olur."
  );
  return lines.join("\n");
}

/**
 * Satın alma niyetine göre ikna cümlesi
 */
function persuasiveEnding(intent: "LOW" | "MID" | "HIGH"): string {
  if (intent === "HIGH") {
    return "\n⭐ İstersen hiç uzatmadan siparişe geçebilirsin, stoklar tükenmeden almak mantıklı olur.";
  }
  if (intent === "MID") {
    return "\n💡 Bugün içinde değerlendirmen iyi olabilir, fiyat ve stok değişebiliyor.";
  }
  return "\nİstersen biraz daha bakınabilir, kafana takılan her şeyi sorabilirsin 😊";
}

/**
 * Intent + ürün listesine göre ana gövde cevap
 */
function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {
  const displayName = formatCustomerName(customerName);
  const matches = findMatchingProducts(userMessage, products);
  const mainProduct: Product | null = matches[0] || products[0] || null;
  const storeCategory = detectStoreCategory(products);
  const purchaseIntent = detectPurchaseIntent(userMessage);
  const absurd = rejectAbsurdIdeas(userMessage);

  // Absürt kombin yakalandıysa direkt onu döndür
  if (absurd) return absurd;

  // Ürün hiç yoksa
  if (!products.length && intent !== "SMALL_TALK" && intent !== "GREETING") {
    return (
      "Henüz bu mağazada ürün görünmüyor 😊 Önce mağazaya ürün eklenmesi gerekiyor." +
      (displayName ? ` ${displayName}` : "")
    );
  }

  // SMALL TALK
  if (intent === "SMALL_TALK") {
    for (const p of DAILY_TALK_PATTERNS) {
      if (p.regex.test(userMessage)) {
        let ans = p.answer;
        if (displayName) ans = ans.replace("😊", `😊 ${displayName}`);
        return ans;
      }
    }
    return displayName
      ? `Buradayım ${displayName} 😇 Ürün, kombin veya alışverişle ilgili ne konuşmak istersin?`
      : "Buradayım 😇 Ürün, kombin veya alışverişle ilgili ne konuşmak istersin?";
  }

  // GREETING
  if (intent === "GREETING") {
    return (
      (displayName ? `Merhaba ${displayName} 👋\n\n` : "Merhaba 👋\n\n") +
      "Ben FlowAI.\n" +
      "Bu mağazanın ürünleri hakkında sana yardımcı olabilirim.\n" +
      "- Ürün tavsiyesi alabilirsin\n" +
      "- Kombin önerisi isteyebilirsin\n" +
      "- Fiyat, beden, kullanım alanı gibi konularda soru sorabilirsin\n\n" +
      "Ne arıyorsun, nasıl yardımcı olayım? 😊"
    );
  }

  // Ürün bulunamadıysa ve niyet ürün değilse
  if (!mainProduct && intent !== "ASK_RECOMMENDATION") {
    return (
      "Şu anda anlattığın şeye birebir uyan bir ürün bulamadım 😔\n" +
      `Bu mağaza daha çok **${storeCategory}** ürünleri üzerine.\n\n` +
      "İstersen aradığın ürünü biraz daha marka / model / renk gibi detaylarla anlat, sana en yakın alternatifleri önereyim."
    );
  }

  // 3 ürün isteği açıkça varsa
  if (
    /3 ürün|3 urun|üç ürün|uc urun|3 tane oner|uc tane oner|bana üç öner|bana uc oner/i.test(
      userMessage
    )
  ) {
    const list = products.slice(0, 3);
    if (!list.length) {
      return "🛒 Şu an önerebileceğim ürün bulamadım 😔 Mağazada ürün görünmüyor.";
    }

    const mapped = list.map((p, idx) => `#${idx + 1}\n${formatProductSummary(p)}`).join("\n\n");
    return (
      "Sana ilk üç ürünü seçtim 🌟\n\n" +
      mapped +
      "\n\nİçlerinden hangisini daha detaylı incelemek istersin?"
    );
  }

  // Hangisi mantıklı → kıyaslama
  if (
    /hangisi mantıklı|hangisi mantikli|mantıklı hangisi|karşılaştır|karsilastir/i.test(
      userMessage
    )
  ) {
    const list = matches.length >= 2 ? matches.slice(0, 2) : products.slice(0, 2);

    if (list.length < 2) {
      if (mainProduct) {
        return (
          "Karşılaştırma yapacak kadar ürün bulamadım ama bence şu seçenek mantıklı duruyor 👇\n\n" +
          formatProductSummary(mainProduct)
        );
      }
      return "Karşılaştırma yapacak ürün bulamadım 😕";
    }

    const A = list[0];
    const B = list[1];

    return (
      "🧠 Senin için iki ürünü kıyasladım:\n\n" +
      `👉 **${A.title}**\n` +
      `- Fiyat: ${A.price || "belirtilmemiş"}\n` +
      "- Daha sade ve kullanımı rahat bir seçenek olabilir.\n\n" +
      `👉 **${B.title}**\n` +
      `- Fiyat: ${B.price || "belirtilmemiş"}\n` +
      "- Tasarım olarak biraz daha iddialı duruyor.\n\n" +
      `🎯 Ben olsam **${A.title}** tercih ederdim, fiyat/performans olarak daha dengeli görünüyor.`
    );
  }

  // satın alma niyeti yüksek / orta ise özel konuşma
  if (mainProduct && purchaseIntent === "HIGH") {
    return (
      `🛍️ Bence güzel bir tercih olur${
        displayName ? ` ${displayName}` : ""
      }!\n` +
      `"${mainProduct.title}" modeli kullanıcılar tarafından sık tercih edilen bir ürün gibi duruyor.\n\n` +
      formatProductSummary(mainProduct) +
      "\n\n⭐ İçine siniyorsa çok beklemeden almanı öneririm."
    );
  }

  if (mainProduct && purchaseIntent === "MID") {
    return (
      `🧠 Kararsız olman normal${
        displayName ? ` ${displayName}` : ""
      }.\n` +
      `"${mainProduct.title}" oldukça mantıklı bir tercih gibi görünüyor.\n\n` +
      formatProductSummary(mainProduct) +
      "\n\nİstersen sepete ekleyip biraz daha düşünebilirsin, acele etmene gerek yok 😊"
    );
  }

  // Sezon bazlı öneri
  const t = normalizeText(userMessage);
  if (
    intent === "ASK_RECOMMENDATION" &&
    (t.includes("kis icin") ||
      t.includes("kış icin") ||
      t.includes("kisin") ||
      t.includes("havalar soguyor") ||
      t.includes("yaz icin") ||
      t.includes("yaz geliyor") ||
      t.includes("yaz yaklasiyor"))
  ) {
    const top = matches.length ? matches : products.slice(0, 3);
    if (!top.length) {
      return "Sezona uygun ürün bulamadım 😔 Ama genel tarzını söylersen sana fikir verebilirim.";
    }

    const items = top
      .slice(0, 3)
      .map((p, i) => `#${i + 1}\n${formatProductSummary(p)}`)
      .join("\n\n");

    return (
      "Sezona göre sana uygun olabilecek birkaç ürün buldum ❄️🌞\n\n" +
      items +
      "\n\nHangisine daha çok yakın hissediyorsun?"
    );
  }

  // Klasik intentler
  switch (intent) {
    case "ASK_PRICE":
      if (!mainProduct) {
        return "Hangi ürünün fiyatına bakmak istediğini biraz daha net yazabilir misin? (ürün adı veya link)";
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n💬 Fiyatla ilgili daha detaylı bilgi istersen sorabilirsin." +
        buildFollowUpQuestions(userMessage, storeCategory)
      );

    case "ASK_STOCK":
      if (!mainProduct) {
        return "Hangi üründe stok durumunu merak ediyorsun? Ürün adını veya linkini yazarsan kontrol mantığını anlatabilirim.";
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n📦 Stok bilgisi platform üzerinde anlık olarak güncelleniyor. Ürün sayfasındaki stok durumunu kontrol etmeni öneririm."
      );

    case "ASK_COLOR":
      if (!mainProduct) {
        return "Renk bilgisini merak ettiğin ürünü biraz daha net tarif edebilir misin?";
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n🎨 Varyasyonlarda farklı renk seçenekleri varsa ürün sayfasında görebilirsin."
      );

    case "ASK_SIZE":
      if (!mainProduct) {
        return "Beden/numara sormak istediğin ürünü biraz daha detaylı yazar mısın?";
      }
      if (
        (mainProduct.category || "").toLowerCase() === "giyim" ||
        (mainProduct.category || "").toLowerCase() === "ayakkabi"
      ) {
        return (
          formatProductSummary(mainProduct) +
          "\n\n📏 Beden/numara seçimi için:\n" +
          "- Arada kaldıysan daha rahat kullanım için bir beden/numara büyük tercih edebilirsin.\n" +
          "- Ürün yorumlarına da bakmanı öneririm, kalıbı dar mı geniş mi olduğu genelde yazılır.\n"
        );
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n📏 Bu üründe klasik beden yerine ölçüler (boy, en, hacim vb.) daha önemli olabilir. Ürün açıklamasındaki ölçü detaylarına bakmanı öneririm."
      );

    case "ASK_MATERIAL":
      if (!mainProduct) {
        return "Hangi ürünün malzeme/kalitesini merak ediyorsun? Ürün başlığını veya linkini yazarsan yorum yapabilirim.";
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n🔍 Kullanım & kalite yorumu:\n" +
        usageAndQualityComment(mainProduct)
      );

    case "ASK_USAGE":
    case "ASK_SUITABILITY":
      if (!mainProduct) {
        return "Hangi ürünün nerede/nasıl kullanılabileceğini merak ediyorsun? Biraz daha detay verebilir misin?";
      }
      return (
        formatProductSummary(mainProduct) +
        "\n\n🔍 Kullanım & uygunluk yorumu:\n" +
        usageAndQualityComment(mainProduct) +
        "\n\nSpesifik bir kullanım alanı varsa (ofis, günlük, spor, deniz vs.) yazarsan ona göre daha net yorum yapabilirim." +
        buildFollowUpQuestions(userMessage, storeCategory)
      );

    case "ASK_RECOMMENDATION": {
      const list = matches.length ? matches.slice(0, 3) : products.slice(0, 3);
      if (!list.length) {
        return "Şu anda sana önerebileceğim ürün bulamadım 😔 Mağazada ürün görünmüyor.";
      }
      const mapped = list
        .map((p, i) => `#${i + 1}\n${formatProductSummary(p)}`)
        .join("\n\n");
      return (
        "Sana birkaç ürün öneriyorum 🌟\n\n" +
        mapped +
        "\n\nİçlerinden birini seçersen kombin, kullanım alanı veya alternatiflerini de söyleyebilirim."
      );
    }

    case "ASK_COMBINATION":
      if (!mainProduct) {
        return (
          "Kombin önerebilmem için hangi üründen bahsettiğini biraz daha netleştirebilir misin? (ürün adı/linki)"
        );
      }
      return buildCombinationSuggestion(mainProduct, products);

    case "ASK_SHIPPING":
      return (
        "🚚 **Kargo & Teslimat Bilgisi**\n\n" +
        "Kargo süresi; satın aldığın platformun (Trendyol, Hepsiburada, N11, Amazon vb.) ve satıcının kendi ayarlarına göre değişir.\n\n" +
        "- Genelde 1–3 iş günü içinde kargoya verilir.\n" +
        "- Tahmini teslim tarihi sipariş detaylarında yazar.\n" +
        "- Kargo firmasının takip sayfasından da güncel durumu görebilirsin.\n"
      );

    case "ASK_RETURN":
      return (
        "🔄 **İade & Değişim Bilgisi**\n\n" +
        "İade ve değişim; alışveriş yaptığın platformun koşullarına göre ilerler.\n\n" +
        "- Çoğu platformda 14 gün cayma hakkı vardır (koşulları platform belirler).\n" +
        "- Ürünü mümkünse kullanılmamış ve orijinal paketiyle göndermen gerekir.\n" +
        "- Detaylar siparişlerim / iade–değişim sayfasında yazar.\n"
      );

    case "TRACK_ORDER":
      return (
        "📦 **Kargo Takibi Nasıl Yapılır?**\n\n" +
        "- Satın aldığın platformdaki *Siparişlerim* bölümüne gir.\n" +
        "- İlgili siparişi seç, kargo firması ve takip numarasını görebilirsin.\n" +
        "- Takip numarası ile kargo şirketinin web sitesi veya mobil uygulamasından detaylı hareketleri inceleyebilirsin.\n"
      );

    case "COMPLAINT":
      return (
        "Üzgünüm böyle bir deneyim yaşaman hiç hoş olmamış 😔\n\n" +
        "Yaşadığın sorunu biraz detaylandırabilirsen; ürün, kargo veya satıcı kaynaklı mı anlamaya çalışırım ve seni doğru yönlendirebilirim.\n" +
        "Ayrıca alışveriş yaptığın platform üzerinden de resmi şikayet / destek kaydı açmanı öneririm.\n"
      );

    case "UNKNOWN":
    default:
      if (mainProduct) {
        return (
          formatProductSummary(mainProduct) +
          "\n\nTam olarak ne öğrenmek istediğini (fiyat, beden, kullanım alanı, kombin, vs.) yazarsan daha net yardımcı olabilirim 😊" +
          buildFollowUpQuestions(userMessage, storeCategory)
        );
      }
      return (
        "Tam anlayamadım ama yardımcı olmak isterim 😊 Ürün ismini, linkini veya ne tarz bir şey aradığını biraz daha detaylı yazabilir misin?" +
        (displayName ? ` ${displayName}` : "")
      );
  }
}
function buildMergedResponse(
  intents: Intent[],
  msg: string,
  products: Product[],
  main: Product | null
): string {
  let full = "";

  for (const intent of intents) {
    const part = buildReplyForIntent(intent, msg, products, null);
    full += "\n\n" + part;
  }

  return full.trim();
}
function buildPurchasePressure(mainProduct: Product | null) {
  if (!mainProduct) return "";

  const rnd = Math.random();

  if (rnd < 0.25)
    return "\n🔥 Bu ürün son 48 saatte çok görüntülenmiş. Bitmeden almak mantıklı.";

  if (rnd < 0.45)
    return "\n⏳ Bu beden/numarada stoklar hızlı tükeniyor olabilir.";

  if (rnd < 0.65)
    return "\n⭐ Aynı ürün kullanıcıların son dönem favorileri arasında görünüyor.";

  if (rnd < 0.85)
    return "\n💬 Son 1 hafta içinde olumlu geri bildirim fazlaymış.";

  return "\n💡 Ürün şu an iyi fiyat seviyesinde, fiyat artmadan almak mantıklı.";
}
function toneAdjust(message: string): "FORMAL"|"FRIENDLY"|"SOFT"|"FAST" {
  const t = normalizeText(message);

  if (t.includes("sinirlendim") || t.includes("rezalet") || t.includes("kotu"))
    return "SOFT";

  if (t.includes("acil") || t.includes("hemen") || t.includes("çabuk"))
    return "FAST";

  if (t.includes("teşekkür") || t.includes("tesekkur") || t.includes("süper"))
    return "FRIENDLY";

  if (t.includes("neden") || t.includes("açıkla") || t.includes("ozel olarak"))
    return "FORMAL";

  return "FRIENDLY";
}

function applyToneStyle(text: string, tone: "FORMAL"|"FRIENDLY"|"SOFT"|"FAST") {
  switch(tone) {
    case "FAST":
      return text + "\n⚡ Hızlı özetle yardımcı oldum.";
    case "SOFT":
      return "😌 Öncelikle sakin olmanı isterim.\n" + text;
    case "FORMAL":
      return "Eksiksiz açıklama 👇\n" + text;
    case "FRIENDLY":
    default:
      return "😊 " + text;
  }
}
function updateUserProfile(msg: string, products: Product[], main: Product | null) {
  const t = normalizeText(msg);

  if (t.includes("siyah")) DYNAMIC_PROFILE.lastFavoriteColor = "siyah";
  if (t.includes("kırmızı")) DYNAMIC_PROFILE.lastFavoriteColor = "kırmızı";
  if (t.includes("mavi")) DYNAMIC_PROFILE.lastFavoriteColor = "mavi";

  const priceMatch = msg.match(/(\d{3,5}) ?tl/);
  if (priceMatch) DYNAMIC_PROFILE.lastBudget = parseInt(priceMatch[1]);

  const sizeMatch = msg.match(/\b(36|37|38|39|40|41|42|43)\b/);
  if (sizeMatch) DYNAMIC_PROFILE.lastSize = sizeMatch[0];

  if (main && main.category)
    DYNAMIC_PROFILE.lastInterestCategory = main.category;
}

function profileHints() {
  let lines:string[] = [];

  if (DYNAMIC_PROFILE.lastFavoriteColor)
    lines.push(`🎨 Daha önce **${DYNAMIC_PROFILE.lastFavoriteColor}** rengi sevdiğini söylemiştin.`);

  if (DYNAMIC_PROFILE.lastBudget)
    lines.push(`💰 Geçmiş seçimlerin genelde **${DYNAMIC_PROFILE.lastBudget} TL civarıydı.**`);

  if (DYNAMIC_PROFILE.lastSize)
    lines.push(`📏 Bir önceki seçiminde **${DYNAMIC_PROFILE.lastSize}** düşünmüştün.`);

  if (DYNAMIC_PROFILE.lastInterestCategory)
    lines.push(`🛍️ Sen daha çok **${DYNAMIC_PROFILE.lastInterestCategory}** ürünlerine bakmıştın.`);

  if (!lines.length) return "";
  return "\n👇 Senin geçmiş seçimlerine göre:\n" + lines.join("\n");
}
function scoreProduct(p: Product) {
  let score = 50;

  const title = normalizeText(p.title || "");

  if (title.includes("premium")) score += 20;
  if (title.includes("su geçirmez") || title.includes("waterproof")) score += 15;
  if (title.includes("kış") || title.includes("kis")) score += 10;
  
  const priceValue = p.price ? parseInt(p.price.toString()) : 0;

// 1500 üstü
if (priceValue > 1500) score += 10;

// 800 altı uygun fiyat
if (priceValue < 800) score += 5;

  return score;
}

function compareProductsWithScore(products: Product[]) {
  const firstTwo = products.slice(0,2);

  if (firstTwo.length < 2) return "";

  const A = firstTwo[0];
  const B = firstTwo[1];

  const scoreA = scoreProduct(A);
  const scoreB = scoreProduct(B);

  return `
🧠 Puanlı kıyaslama

🏷 ${A.title}
⭐ Skor: ${scoreA}/100

VS

🏷 ${B.title}
⭐ Skor: ${scoreB}/100

🎯 Bana göre **${scoreA > scoreB ? A.title : B.title}** daha mantıklı tercih.
`;
}

/**
 * Tüm akıllı katmanları birleştiren ana fonksiyon
 */
function buildFullSmartResponse(
  intent: Intent,
  message: string,
  products: Product[],
  customerName: string | null
): string {
  // Önce çok sert / agresif durum varsa sakinleştir
  const calm = calmResponse(message);
  if (calm) return calm;

  const base = buildReplyForIntent(intent, message, products, customerName);

  const matches = findMatchingProducts(message, products);
  const mainProduct = matches[0] || products[0] || null;

  const sentiment = detectSentiment(message);
  const tone = sentimentTone(sentiment);

  const purchase = detectPurchaseIntent(message);
  const persuasion = persuasiveEnding(purchase);

  const empathy = empathyLine(message);

  let reply = base + tone + persuasion;
  if (empathy) reply += "\n\n" + empathy;

  updateUserProfile(message, products, mainProduct);
  reply += buildPurchasePressure(mainProduct);
  reply += profileHints();
  reply = applyToneStyle(reply, toneAdjust(message));
  reply += compareProductsWithScore(products);

  return reply;
}

/**
 * DIŞARI AÇILAN ANA FONKSİYON
 */
export async function generateSmartReply(
  shopId: string,
  userMessage: string
): Promise<string> {
  const msg = (userMessage || "").trim();
  if (!msg) return "Merhaba 👋 Nasıl yardımcı olayım?";

  const name = extractCustomerName(msg);
  const products = await getProductsForShop(shopId);

  const intents = detectMultipleIntents(msg);

  const main =
    findMatchingProducts(msg, products)[0] || products[0] || null;

  updateMemory(msg, products, main);

  let reply = buildMergedResponse(intents, msg, products, main);
  reply += replyWithMemoryHints();

  return reply;
}

/**
 * Geriye dönük uyumluluk için alias fonksiyonlar
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
