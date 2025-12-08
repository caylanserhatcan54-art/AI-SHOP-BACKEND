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

// Günlük konuşma patternleri – ChatGPT vari his için
const DAILY_TALK_PATTERNS: { regex: RegExp; answer: string }[] = [
  {
    regex: /(nasılsın|nasilsin|naber|naber|napıyorsun|napıyon|ne yapıyorsun)/i,
    answer: "Çok iyiyim, seninle ilgilenmekle meşgulüm 😊 Sen nasılsın?",
  },
  {
    regex: /(iyiyim|idare eder|fena degil|fena değil)/i,
    answer:
      "İyi olmana sevindim 🙌 Peki bugün ne tarz bir ürün arıyorsun, nasıl yardımcı olabilirim?",
  },
  {
    regex: /(sıkıldım|canım sıkıldı|canim sıkıldı)/i,
    answer:
      "Anlıyorum, bazen hepimizin canı sıkılıyor 😌 İstersen beraber güzel bir ürün/kombin bakalım, belki biraz iyi gelir.",
  },
  {
    regex: /(bot musun|yapay zeka misin|yapay zeka mısın|gerçek misin)/i,
    answer:
      "Ben FlowAI 🤖 Bu mağazanın ürünleri hakkında ihtiyacın olan her konuda yardımcı olmak için buradayım.",
  },
];

// İsim yakalama – “benim adım Ayla”, “adım Burak” gibi
const NAME_PATTERN =
  /(benim adım|benim adim|adım|adim|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;

function extractCustomerName(msg: string): string | null {
  const m = msg.match(NAME_PATTERN);
  if (!m) return null;
  const raw = m[2];
  // İlk harf büyük, diğerleri küçük yapalım
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

// Mağaza kategorisini tahmin et (ürünlere bakarak)
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
    all.includes("etek")
  )
    return "giyim";
  if (all.includes("ayakkabı") || all.includes("ayakkabi") || all.includes("sneaker"))
    return "ayakkabı";
  if (
    all.includes("bilgisayar") ||
    all.includes("laptop") ||
    all.includes("telefon") ||
    all.includes("kulaklık") ||
    all.includes("kulaklik") ||
    all.includes("televizyon")
  )
    return "elektronik";
  if (
    all.includes("matkap") ||
    all.includes("vida") ||
    all.includes("şarjlı tornavida") ||
    all.includes("sarik tornavida") ||
    all.includes("hırdavat") ||
    all.includes("hirdavat")
  )
    return "hırdavat";
  if (all.includes("çadır") || all.includes("cadir") || all.includes("kamp"))
    return "kamp-outdoor";
  if (all.includes("oyuncak") || all.includes("lego") || all.includes("figür"))
    return "oyuncak";
  if (
    all.includes("dumbbell") ||
    all.includes("halter") ||
    all.includes("koşu bandı") ||
    all.includes("kosu bandi")
  )
    return "spor";

  return "genel";
}

/**
 * Kullanıcının mesajından intent çıkar
 */
function detectIntent(msg: string): Intent {
  const t = normalizeText(msg);

  // SMALL TALK – önce yakala
  if (
    t.includes("nasilsin") ||
    t.includes("naber") ||
    t.includes("napıyorsun") ||
    t.includes("ne yapiyorsun") ||
    t.includes("bot musun") ||
    t.includes("yapay zeka")
  ) {
    return "SMALL_TALK";
  }

  // Greeting
  if (
    t.includes("merhaba") ||
    t.includes("selam") ||
    t.includes("iyi gunler") ||
    t.includes("iyi günler") ||
    t.includes("slm")
  ) {
    return "GREETING";
  }

  if (
    t.includes("fiyat") ||
    t.includes("kaca") ||
    t.includes("kaça") ||
    t.includes("ne kadar") ||
    t.includes("ucret") ||
    t.includes("ücret")
  ) {
    return "ASK_PRICE";
  }

  if (
    t.includes("stok") ||
    t.includes("var mi") ||
    t.includes("kalmis mi") ||
    t.includes("kalmış mı") ||
    t.includes("tukendi mi") ||
    t.includes("tükendi mi")
  ) {
    return "ASK_STOCK";
  }

  if (
    t.includes("renk") ||
    t.includes("baska renk") ||
    t.includes("başka renk") ||
    t.includes("hangi renk")
  ) {
    return "ASK_COLOR";
  }

  if (
    t.includes("beden") ||
    t.includes("numara") ||
    t.includes("kac beden") ||
    t.includes("kaç beden") ||
    t.includes("36 olur mu") ||
    t.includes("small") ||
    t.includes("medium") ||
    t.includes("large")
  ) {
    return "ASK_SIZE";
  }

  if (
    t.includes("malzeme") ||
    t.includes("kumastan") ||
    t.includes("kumaştan") ||
    t.includes("icerik") ||
    t.includes("içerik") ||
    t.includes("kalite") ||
    t.includes("dayanikli") ||
    t.includes("dayanıklı")
  ) {
    return "ASK_MATERIAL";
  }

  if (
    t.includes("ne icin kullanilir") ||
    t.includes("ne için kullanılır") ||
    t.includes("nerede kullanilir") ||
    t.includes("nerede kullanılır") ||
    t.includes("kullanim amaci") ||
    t.includes("kullanım amacı")
  ) {
    return "ASK_USAGE";
  }

  if (
    t.includes("kosu icin") ||
    t.includes("koşu için") ||
    t.includes("denizde kullanilir mi") ||
    t.includes("uygun mu") ||
    t.includes("uyar mi") ||
    t.includes("uyar mı") ||
    t.includes("uygun olur mu")
  ) {
    return "ASK_SUITABILITY";
  }

  if (
    t.includes("oneri") ||
    t.includes("öneri") ||
    t.includes("ne önerirsin") ||
    t.includes("hangi urunu") ||
    t.includes("hangi ürünü") ||
    t.includes("bana bir sey öner") ||
    t.includes("bana bir şey öner")
  ) {
    return "ASK_RECOMMENDATION";
  }

  if (
    t.includes("kombin") ||
    t.includes("yanina ne gider") ||
    t.includes("yanına ne gider") ||
    t.includes("neyle giyilir") ||
    t.includes("neyle kullanilir") ||
    t.includes("takim yap") ||
    t.includes("takım yap")
  ) {
    return "ASK_COMBINATION";
  }

  if (
    t.includes("kargo") ||
    t.includes("teslimat") ||
    t.includes("kac gunde gelir") ||
    t.includes("kaç günde gelir") ||
    t.includes("ne zaman gelir")
  ) {
    return "ASK_SHIPPING";
  }

  if (
    t.includes("iade") ||
    t.includes("degisim") ||
    t.includes("değişim") ||
    t.includes("geri gonder") ||
    t.includes("geri gönder")
  ) {
    return "ASK_RETURN";
  }

  if (
    t.includes("kargom nerede") ||
    t.includes("siparisim nerede") ||
    t.includes("siparişim nerede") ||
    t.includes("takip numarasi") ||
    t.includes("takip numarası")
  ) {
    return "TRACK_ORDER";
  }

  if (
    t.includes("sikayet") ||
    t.includes("şikayet") ||
    t.includes("memnun degil") ||
    t.includes("memnun değil") ||
    t.includes("cok kotu") ||
    t.includes("çok kötü") ||
    t.includes("hayal kirikligi") ||
    t.includes("hayal kırıklığı")
  ) {
    return "COMPLAINT";
  }

  return "UNKNOWN";
}

/**
 * Kullanıcının yazdığı metinle ürün başlıklarını eşleştir,
 * en alakalı ürünleri bul.
 */
function findMatchingProducts(msg: string, products: Product[]): Product[] {
  const normMsg = normalizeText(msg);
  const tokens = normMsg
    .split(" ")
    .filter((t) => t && !TURKISH_STOP_WORDS.includes(t) && t.length > 2);

  if (!tokens.length) return [];

  const scored: { product: Product; score: number }[] = [];

  for (const p of products) {
    const normTitle = normalizeText(p.title || "");
    let score = 0;
    for (const token of tokens) {
      if (normTitle.includes(token)) {
        score += 2;
      }
    }
    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.product);
}

/**
 * Ürünü özetleyen küçük blok
 */
function formatProductSummary(p: Product): string {
  const lines: string[] = [];

  lines.push(`✨ **${p.title}**`);

  if (p.price) {
    lines.push(`💰 Fiyat: ${p.price}`);
  } else {
    lines.push(`💰 Fiyat: Güncel fiyat ürün sayfasında yer alıyor.`);
  }

  if (p.color) {
    lines.push(`🎨 Renk: ${p.color}`);
  }

  if (p.category) {
    lines.push(`📂 Kategori: ${p.category}`);
  }

  if ((p as any).imageUrl) {
    lines.push(`🖼️ Görsel: ${(p as any).imageUrl}`);
  } else if ((p as any).image) {
    lines.push(`🖼️ Görsel: ${(p as any).image}`);
  }

  if (p.url) {
    lines.push(`🔗 Ürün linki: ${p.url}`);
  }

  return lines.join("\n");
}

/**
 * Kategoriye göre genel kullanım / kalite yorumu
 */
function usageAndQualityComment(p: Product): string {
  const cat = p.category || "genel";
  const hints: string[] = [];

  if ((p as any).materialGuess) {
    hints.push(`🧵 Malzeme yorumu: ${(p as any).materialGuess}`);
  }

  switch (cat) {
    case "giyim":
      hints.push(
        "👚 Günlük kullanım, işe giderken ya da hafif spor şıklığı için oldukça uygun görünüyor."
      );
      hints.push(
        "📌 Doğru bedenle tercih edildiğinde rahatlık ve konfor açısından tatmin edici olacaktır."
      );
      break;

    case "ayakkabi":
    case "ayakkabı":
      hints.push(
        "👟 Gün boyu kullanımda konfor sunmak üzere tasarlanmış gibi görünüyor, doğru numara seçimi önemli."
      );
      hints.push(
        "🏃‍♂️ Yürüyüş ve günlük kullanım için ideal bir model izlenimi veriyor."
      );
      break;

    case "elektronik":
      hints.push(
        "💻 Performans ve kullanım amacı ürün detaylarına göre değişir; ofis, oyun veya günlük kullanım için tercih edilebilir."
      );
      hints.push(
        "⚙️ Ürünün teknik özellikleri, kullanım deneyimini önemli ölçüde etkiler; ihtiyacına göre seçim yapmak önemli."
      );
      break;

    case "oyuncak":
      hints.push(
        "🧸 Çocukların motor becerilerini ve hayal gücünü destekleyebilecek eğlenceli bir ürün gibi görünüyor."
      );
      hints.push(
        "📌 Yaş grubu ve güvenlik sertifikalarına dikkat ederek kullanılması tavsiye edilir."
      );
      break;

    case "kamp-outdoor":
      hints.push(
        "🏕️ Kamp ve outdoor aktiviteleri için pratik ve dayanıklı bir ekipman gibi duruyor."
      );
      hints.push(
        "🌧️ Zor hava koşullarında kullanılacaksa su geçirmezlik ve dayanıklılık detayları önemli."
      );
      break;

    case "su-sporlari":
      hints.push(
        "🌊 Su sporları için tasarlanmış, deniz/havuz kullanımında konfor ve güvenlik sağlamayı hedefleyen bir ürün gibi görünüyor."
      );
      break;

    case "hirdavat":
    case "hırdavat":
      hints.push(
        "🔧 Tamir, montaj ve inşaat işlerinde pratik kullanım sağlayacak bir el aleti / ekipman izlenimi veriyor."
      );
      hints.push(
        "📌 Doğru uç, aparat ve koruyucu ekipmanla birlikte kullanılması hem verim hem güvenlik için önemli."
      );
      break;

    case "spor":
      hints.push(
        "🏋️‍♂️ Spor ve egzersiz amaçlı kullanım için tasarlanmış gibi duruyor, düzenli kullanımda performansa katkı sağlayabilir."
      );
      break;

    default:
      hints.push(
        "ℹ️ Günlük ihtiyaçlarını karşılamak üzere tasarlanmış pratik bir ürün gibi görünüyor."
      );
      break;
  }

  return hints.join("\n");
}

/**
 * Kullanıcıya ek soru soran, daha “akıllı” hissettiren ufak fonksiyon
 */
function buildFollowUpQuestions(
  userMessage: string,
  storeCategory: string
): string {
  const t = normalizeText(userMessage);

  // Lamba / aydınlatma
  if (t.includes("lamba") || t.includes("aydinlatma") || t.includes("avize")) {
    return (
      "\n💡 Daha iyi yönlendirebilmem için birkaç soru:\n" +
      "- Evin hangi alanında kullanacaksın? (salon, mutfak, çalışma odası)\n" +
      "- Işık renginde tercihin var mı? (gün ışığı, beyaz, sarı)\n" +
      "- Enerji tasarrufu senin için önemli mi?\n"
    );
  }

  // Bilgisayar toplama
  if (
    t.includes("bilgisayar toplamak") ||
    t.includes("bilgisayar topluyorum") ||
    t.includes("oyun bilgisayari") ||
    t.includes("oyun bilgisayarı")
  ) {
    return (
      "\n🖥️ Sana daha doğru öneri verebilmem için:\n" +
      "- Bütçen yaklaşık ne kadar?\n" +
      "- Oyun ağırlıklı mı, yoksa iş/ofis kullanımı mı?\n" +
      "- Ekran kartı, işlemci markasında özel bir tercihin var mı?\n"
    );
  }

  // Giyim / kombin genel sorular
  if (storeCategory === "giyim" || storeCategory === "ayakkabı") {
    return (
      "\n🧥 Kombin için:\n" +
      "- Günlük mi yoksa özel gün için mi düşündün?\n" +
      "- Renk tercihin var mı?\n" +
      "- Daha spor mu, daha klasik mi seviyorsun?\n"
    );
  }

  return "";
}

/**
 * Kategoriye göre kombin / birlikte kullanılacak ürün önerileri
 */
function buildCombinationSuggestion(
  mainProduct: Product | null,
  allProducts: Product[]
): string {
  const p = mainProduct || allProducts[0];
  const cat = p.category || "genel";

  const norm = (text: string | undefined) => normalizeText(text || "");
  const withCategory = (categoryKey: string) =>
    allProducts.filter((pr) => pr.category === categoryKey && pr.id !== p.id);

  const suggestions: string[] = [];
  suggestions.push(
    "🧩 **Sana birkaç kombin / birlikte kullanım önerisi hazırladım:**\n"
  );

  if (cat === "giyim") {
    const altGiyim = withCategory("giyim").filter((pr) => {
      const t = norm(pr.title);
      return (
        t.includes("pantolon") ||
        t.includes("etek") ||
        t.includes("sort") ||
        t.includes("şort")
      );
    });
    const ayakkabi = withCategory("ayakkabi").concat(
      withCategory("ayakkabı")
    );

    suggestions.push("👕 Ana ürün:");
    suggestions.push(formatProductSummary(p));

    if (altGiyim[0]) {
      suggestions.push("\n👖 Alt kombin önerisi:");
      suggestions.push(formatProductSummary(altGiyim[0]));
    }

    if (ayakkabi[0]) {
      suggestions.push("\n👟 Ayakkabı önerisi:");
      suggestions.push(formatProductSummary(ayakkabi[0]));
    }

    suggestions.push(
      "\n💡 Renk uyumu için; üst ürünle yakın tonlarda alt ve ayakkabı seçersen daha şık bir görüntü oluşur."
    );
    suggestions.push(
      "\nEğer çok uçuk, uyumsuz bir kombin düşünüyorsan dürüst olayım; bence sana pek yakışmazdı 😄 Daha dengeli bir kombin seçelim istersen."
    );
  } else if (cat === "ayakkabi" || cat === "ayakkabı") {
    const giyim = withCategory("giyim");
    suggestions.push("👟 Ana ürün (ayakkabı):");
    suggestions.push(formatProductSummary(p));

    if (giyim[0]) {
      suggestions.push("\n👖 Üst/alt kombin önerisi:");
      suggestions.push(formatProductSummary(giyim[0]));
    }

    suggestions.push(
      "\n💡 Günlük kullanımda sade renkli pantolon ve basic üstlerle rahatça kombinleyebilirsin."
    );
  } else if (cat === "elektronik") {
    suggestions.push("💻 Ana ürün (elektronik):");
    suggestions.push(formatProductSummary(p));

    const accessories = allProducts.filter((pr) => {
      const t = norm(pr.title);
      return (
        t.includes("kılıf") ||
        t.includes("kilif") ||
        t.includes("mouse") ||
        t.includes("klavye") ||
        t.includes("kulaklik") ||
        t.includes("kulaklık") ||
        t.includes("powerbank") ||
        t.includes("sarj") ||
        t.includes("şarj")
      );
    });

    if (accessories[0]) {
      suggestions.push("\n🔌 Tamamlayıcı aksesuar önerisi:");
      suggestions.push(formatProductSummary(accessories[0]));
    }

    suggestions.push(
      "\n💡 Elektronik ürünlerde genelde kılıf, ekran koruyucu, mouse/klavye gibi aksesuarlar kullanım konforunu ciddi şekilde artırır."
    );
  } else if (cat === "kamp-outdoor") {
    suggestions.push("🏕️ Ana ürün (kamp/outdoor):");
    suggestions.push(formatProductSummary(p));

    const sleeping = allProducts.filter((pr) => {
      const t = norm(pr.title);
      return (
        t.includes("uyku tulumu") ||
        t.includes("mat") ||
        t.includes("kamp lambasi") ||
        t.includes("kamp lambası") ||
        t.includes("fener")
      );
    });

    if (sleeping[0]) {
      suggestions.push("\n🛏️ Kamp ekipmanı önerisi:");
      suggestions.push(formatProductSummary(sleeping[0]));
    }

    suggestions.push(
      "\n💡 Kamp yaparken mutlaka iyi bir mat, uyku tulumu ve ışık kaynağı ile birlikte kullanmanı öneririm."
    );
  } else if (cat === "hirdavat" || cat === "hırdavat") {
    suggestions.push("🔧 Ana ürün (hırdavat / el aleti):");
    suggestions.push(formatProductSummary(p));

    const safety = allProducts.filter((pr) => {
      const t = norm(pr.title);
      return (
        t.includes("gozluk") ||
        t.includes("gözlük") ||
        t.includes("eldiven") ||
        t.includes("kulaklik") ||
        t.includes("kulaklık") ||
        t.includes("maske")
      );
    });

    if (safety[0]) {
      suggestions.push("\n🦺 Güvenlik ekipmanı önerisi:");
      suggestions.push(formatProductSummary(safety[0]));
    }

    suggestions.push(
      "\n💡 Hırdavat ürünlerinde daima eldiven, gözlük gibi koruyucu ekipmanlarla çalışmanı tavsiye ederim."
    );
  } else if (cat === "oyuncak") {
    suggestions.push("🧸 Ana ürün (oyuncak):");
    suggestions.push(formatProductSummary(p));

    const extraToys = allProducts.filter(
      (pr) => pr.category === "oyuncak" && pr.id !== p.id
    );

    if (extraToys[0]) {
      suggestions.push("\n🎲 Tamamlayıcı oyuncak önerisi:");
      suggestions.push(formatProductSummary(extraToys[0]));
    }

    suggestions.push(
      "\n💡 Aynı yaş grubuna hitap eden farklı oyuncak kombinleri, çocuğun ilgisini daha uzun süre canlı tutabilir."
    );
  } else {
    suggestions.push("📦 Ana ürün:");
    suggestions.push(formatProductSummary(p));

    if (allProducts.length > 1) {
      const extra = allProducts.find((pr) => pr.id !== p.id);
      if (extra) {
        suggestions.push("\n🔗 Birlikte alınabilecek başka bir ürün:");
        suggestions.push(formatProductSummary(extra));
      }
    }

    suggestions.push(
      "\n💡 Genelde ana ürünü destekleyen bir aksesuar ya da yedek parça ile birlikte almak daha avantajlı olabilir."
    );
  }

  return suggestions.join("\n");
}

/**
 * Intent + ürün listesine göre cevap üret
 */
function buildReplyForIntent(
  intent: Intent,
  userMessage: string,
  products: Product[],
  customerName: string | null
): string {
  const matches = findMatchingProducts(userMessage, products);
  const mainProduct: Product | null = matches[0] || null;
  const storeCategory = detectStoreCategory(products);

  const nameSuffix = customerName
    ? `\n\nSana nasıl hitap edeyim ${customerName} ${customerName.endsWith("a") || customerName.endsWith("e") ? "Hanım" : "Bey"}?`
    : "";

  // Ürün yoksa
  if (!products.length) {
    return (
      "Henüz mağazaya ürün eklenmemiş görünüyor 😊 Lütfen önce ürünlerinizi ekleyin." +
      (customerName ? ` ${customerName} ${customerName.endsWith("a") || customerName.endsWith("e") ? "Hanım" : "Bey"}` : "")
    );
  }

  // SMALL TALK – direkt dönüş
  if (intent === "SMALL_TALK") {
    for (const p of DAILY_TALK_PATTERNS) {
      if (p.regex.test(userMessage)) {
        const base = p.answer;
        if (customerName) {
          return base.replace(
            "😊",
            `😊 ${customerName.endsWith("a") || customerName.endsWith("e") ? customerName + " Hanım" : customerName + " Bey"}`
          );
        }
        return base;
      }
    }
    return customerName
      ? `İyi ki yazdın ${customerName} 😇 Bugün sana hangi konuda yardım edebilirim?`
      : "Buradayım, sohbet etmeye hazırım 😇 Peki ürün, kombin veya alışverişle ilgili ne konuşmak istersin?";
  }

  // Ürün bulunamadıysa ama intent başka bir şeyse
  if (!mainProduct && intent !== "GREETING" && intent !== "ASK_RECOMMENDATION") {
    return (
      `Şu anda anlattığın ürüne birebir uyan bir ürün mağazamda bulamadım 😔\n` +
      `Bu mağaza daha çok **${storeCategory}** ürünleri üzerine.\n\n` +
      `İstersen aradığın ürünü biraz daha detaylı anlat, ben de sana en yakın alternatifleri önereyim.` +
      buildFollowUpQuestions(userMessage, storeCategory)
    );
  }

  switch (intent) {
    case "GREETING":
      return (
        (customerName
          ? `Merhaba ${customerName} ${
              customerName.endsWith("a") || customerName.endsWith("e") ? "Hanım" : "Bey"
            } 👋\n\n`
          : "Merhaba 👋\n\n") +
        "Ben FlowAI.\n" +
        "Bu mağazanın ürünleri hakkında sana yardımcı olabilirim.\n" +
        "- Ürün tavsiyesi isteyebilirsin\n" +
        "- Kombin önerisi alabilirsin\n" +
        "- Fiyat, malzeme, kullanım alanı hakkında soru sorabilirsin\n\n" +
        "Ne arıyorsun, nasıl yardımcı olayım? 😊"
      );

    case "ASK_PRICE":
      if (mainProduct) {
        return (
          formatProductSummary(mainProduct) +
          "\n\n💬 Fiyatla ilgili başka merak ettiğin bir şey varsa sorabilirsin." +
          buildFollowUpQuestions(userMessage, storeCategory)
        );
      }
      return (
        "Hangi ürünün fiyatını merak ediyorsun? Ürün adını veya linkini yazabilirsin." +
        nameSuffix
      );

    case "ASK_STOCK":
      return (
        formatProductSummary(mainProduct!) +
        "\n\n📦 Stok bilgisi platform üzerinden anlık olarak güncellenir. " +
        "Ürünün sayfasındaki stok durumunu kontrol etmeni öneririm. " +
        "Stokla ilgili özel bir durum varsa, mağaza satıcısı tarafından güncellenecektir."
      );

    case "ASK_COLOR":
      if (mainProduct?.color) {
        return (
          formatProductSummary(mainProduct) +
          `\n\n🎨 Bu ürün için öne çıkan renk: **${mainProduct.color}**.\n` +
          "Farklı renk seçenekleri varsa, ürün sayfasında varyasyonlar bölümünde görüntüleyebilirsin."
        );
      }
      return (
        formatProductSummary(mainProduct!) +
        "\n\n🎨 Başlıkta net bir renk bilgisi görünmüyor, ürün sayfasındaki renk seçeneklerini kontrol edebilirsin."
      );

    case "ASK_SIZE":
      if (mainProduct?.category === "giyim" || mainProduct?.category === "ayakkabi" || mainProduct?.category === "ayakkabı") {
        return (
          formatProductSummary(mainProduct!) +
          "\n\n📏 Beden/numara seçimi için:\n" +
          "- Kalıp genelde standart kabul edilir, fakat ürün yorumlarına da göz atmanı öneririm.\n" +
          "- İki beden arasında kalıyorsan, daha çok rahatlık istiyorsan bir beden büyük tercih edebilirsin.\n"
        );
      }
      return (
        formatProductSummary(mainProduct!) +
        "\n\n📏 Bu ürün için beden/numara yerine teknik ölçüler (boyut, hacim, uzunluk vb.) önemli olabilir. " +
        "Ürün açıklamasındaki ölçü detaylarını incelemeni öneririm."
      );

    case "ASK_MATERIAL":
      return (
        formatProductSummary(mainProduct!) +
        "\n\n" +
        usageAndQualityComment(mainProduct!)
      );

    case "ASK_USAGE":
    case "ASK_SUITABILITY":
      return (
        formatProductSummary(mainProduct!) +
        "\n\n🔍 Kullanım ve uygunluk yorumu:\n" +
        usageAndQualityComment(mainProduct!) +
        "\n\nSpesifik bir kullanım alanı soruyorsan (örneğin: denizde, dağda, profesyonel işte vb.), " +
        "detay yazarsan daha net yönlendirebilirim." +
        buildFollowUpQuestions(userMessage, storeCategory)
      );

    case "ASK_RECOMMENDATION": {
      let picked: Product[] = [];

      if (matches.length) {
        picked = matches.slice(0, 3);
      } else {
        // Eşleşme yoksa mağazadaki ilk ürünlerden öner
        picked = products.slice(0, Math.min(3, products.length));
      }

      const lines: string[] = [];
      lines.push("Sana birkaç ürün önerebilirim 🌟\n");

      picked.forEach((p, idx) => {
        lines.push(`\n#${idx + 1}`);
        lines.push(formatProductSummary(p));
      });

      lines.push(
        "\nİstersen bu ürünlerden birini seç, ben de kombin ya da daha detaylı bilgilendirme yapayım. 😊"
      );

      return lines.join("\n");
    }

    case "ASK_COMBINATION":
      return buildCombinationSuggestion(mainProduct, products);

    case "ASK_SHIPPING":
      return (
        "🚚 **Kargo & Teslimat Bilgisi**\n\n" +
        "Kargo süresi ve teslimat koşulları, ürünün bulunduğu platformun (Trendyol, Hepsiburada, N11, Amazon, Çiçeksepeti vb.) " +
        "ve mağaza ayarlarının politikasına göre değişir.\n\n" +
        "- Genelde ürünler 1-3 iş günü içinde kargoya verilir.\n" +
        "- Kesin teslimat tarihini sipariş sayfanda ya da kargo takip ekranında görebilirsin.\n"
      );

    case "ASK_RETURN":
      return (
        "🔄 **İade & Değişim Bilgisi**\n\n" +
        "İade ve değişim süreçleri, alışveriş yaptığın platformun standart prosedürlerine göre yürütülür.\n\n" +
        "- Çoğu platformda 14 gün içinde cayma hakkın bulunur (koşulları platform belirler).\n" +
        "- Ürünü kullanmadan, mümkünse orijinal kutusu ve faturasıyla birlikte iade etmen gerekir.\n" +
        "- Detaylı şartları sipariş detayları ve 'İade/Değişim' sayfasında görebilirsin.\n"
      );

    case "TRACK_ORDER":
      return (
        "📦 **Kargo Takibi**\n\n" +
        "Kargonun nerede olduğunu en sağlıklı şekilde öğrenmek için:\n" +
        "- Sipariş verdiğin platformdaki *siparişlerim* bölümüne girip ilgili siparişi seçmelisin.\n" +
        "- Orada kargo firması ve takip numarasını görebilirsin.\n" +
        "- Takip numarası ile kargo şirketinin sitesinden veya mobil uygulamasından da detay görebilirsin.\n"
      );

    case "COMPLAINT":
      return (
        "Üzgünüm, böyle bir deneyim yaşaman hiç hoş olmamış 😔\n\n" +
        "Şikayetini detaylıca yazarsan elimden geldiğince yardımcı olmaya çalışırım. " +
        "Ayrıca ürün ya da satıcıyla ilgili yaşadığın sorunu, alışveriş yaptığın platform üzerinden de bildirerek " +
        "destek talebi oluşturabilirsin.\n"
      );

    case "UNKNOWN":
    default:
      if (mainProduct) {
        return (
          formatProductSummary(mainProduct) +
          "\n\nTam olarak ne öğrenmek istediğini yazarsan (fiyat, beden, kullanım alanı, kombin, vb.) " +
          "daha net yardımcı olabilirim 😊" +
          buildFollowUpQuestions(userMessage, storeCategory)
        );
      }
      return (
        "Tam anlayamadım ama yardımcı olmak isterim 😊 Ürün ismini veya linkini biraz daha detaylı yazabilir misin?" +
        nameSuffix
      );
  }
}

/**
 * DIŞARI AÇTIĞIMIZ ASIL FONKSİYON
 * routes/assistant.ts burayı çağırıyor
 */
export async function generateSmartReply(
  shopId: string,
  userMessage: string
): Promise<string> {
  const trimmed = (userMessage || "").trim();

  if (!trimmed) {
    return "Merhaba 👋 Ne hakkında yardımcı olmamı istersin? Ürün, kombin, fiyat veya kargo hakkında soru sorabilirsin.";
  }

  // İsim yakala
  const customerName = extractCustomerName(trimmed);

  // Ürünleri çek
  const products = await getProductsForShop(shopId);

  // Intent bul
  const intent = detectIntent(trimmed);

  // Cevabı oluştur
  const reply = buildReplyForIntent(intent, trimmed, products, customerName);

  return reply;
}

/**
 * GERİYE DÖNÜK UYUMLULUK:
 * Daha önceki kodlarda kullanılan isimler
 * (aiRouter, assistant.ts vs. bozulmasın diye)
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
