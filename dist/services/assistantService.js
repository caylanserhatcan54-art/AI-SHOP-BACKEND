// src/services/assistantService.ts
import { getProductsForShop, normalizeText, } from "./productService.js";
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
const DAILY_TALK_PATTERNS = [
    {
        regex: /(nasılsın|nasilsin|naber|nbr|ne yapıyorsun|napıyorsun)/i,
        answer: "İyiyim ve buradayım 😊 Sen nasılsın? Bugün ne bakıyoruz, ürün mü, kombin mi?",
    },
    {
        regex: /(canım sıkıldı|canim sikildi|sıkıldım|sikildim|moralim bozuk)/i,
        answer: "Üzülme, bazen hepimizin modu düşüyor 😌 İstersen sana birkaç güzel ürün ve kombin göstereyim, belki modun yerine gelir.",
    },
    {
        regex: /(bot musun|yapay zeka mısın|yapay zeka misin|gerçek misin|gercek misin)/i,
        answer: "Ben FlowAI 🤖 Bu mağazanın akıllı asistanıyım. Gerçek insan değilim ama ürün seçerken gerçekçi, mantıklı öneriler vermeye çalışıyorum 😊",
    },
];
/**
 * İsim yakalama
 */
const NAME_PATTERN = /(benim adım|benim adim|adım|adim|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;
function extractCustomerName(msg) {
    const m = msg.match(NAME_PATTERN);
    if (!m)
        return null;
    const raw = m[2];
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
/**
 * Hitap biçimi
 */
function formatCustomerName(name) {
    if (!name)
        return "";
    const lower = name.toLowerCase();
    const isFemale = lower.endsWith("a") ||
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
function rejectAbsurdIdeas(message) {
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
        if (allMatch)
            return r.msg;
    }
    return null;
}
/**
 * Satın alma niyeti tespiti
 */
function detectPurchaseIntent(message) {
    const t = normalizeText(message);
    if (t.includes("sepete attim") ||
        t.includes("sepete ekledim") ||
        t.includes("sepete aticam") ||
        t.includes("alacam") ||
        t.includes("alacagim") ||
        t.includes("alıyorum") ||
        t.includes("aliyorum") ||
        t.includes("satin alayim") ||
        t.includes("siparis geciyorum")) {
        return "HIGH";
    }
    if (t.includes("dusunuyorum") ||
        t.includes("kararsizim") ||
        t.includes("sonra bakarim") ||
        t.includes("bakarim belki") ||
        t.includes("simdilik bakiyorum")) {
        return "MID";
    }
    return "LOW";
}
/**
 * Duygu analizi
 */
function detectSentiment(message) {
    const t = normalizeText(message);
    if (t.includes("cok kotu") ||
        t.includes("berbat") ||
        t.includes("hic begenmedim") ||
        t.includes("rezalet") ||
        t.includes("sinirliyim") ||
        t.includes("pisman oldum") ||
        t.includes("moralim bozuk") ||
        t.includes("canim sikildi")) {
        return "NEGATIVE";
    }
    if (t.includes("harika") ||
        t.includes("bayildim") ||
        t.includes("cok iyi") ||
        t.includes("mukemmel") ||
        t.includes("super")) {
        return "POSITIVE";
    }
    return "NEUTRAL";
}
/**
 * Duyguya göre ek satır
 */
function sentimentTone(sentiment) {
    if (sentiment === "NEGATIVE") {
        return ("\nAnladım, pek iç açıcı bir modda değilsin 😔 " +
            "İstersen beraber daha iyi bir seçenek bulalım, yanında olmaya çalışırım.");
    }
    if (sentiment === "POSITIVE") {
        return "\nSüper! Böyle düşünmene sevindim 😍 İstersen buna benzer birkaç ürün daha önerebilirim.";
    }
    return "";
}
/**
 * Sert / agresif şikayetlerde sakinleştiren cevap
 */
function calmResponse(message) {
    const t = normalizeText(message);
    if (t.includes("rezalet") ||
        t.includes("nefret ettim") ||
        t.includes("aptal bot") ||
        t.includes("cok kotu hizmet")) {
        return ("Böyle hissetmene gerçekten üzüldüm 😞 Amacım seni sinirlendirmek değil, yardımcı olmak." +
            "\nNe yaşadığını biraz anlatırsan, elimden geldiğince çözüm için yönlendireyim 🙏");
    }
    return null;
}
/**
 * Kullanıcı ilgi beklediğinde empati satırı
 */
function empathyLine(message) {
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
function detectStoreCategory(products) {
    if (!products.length)
        return "genel";
    const all = products
        .map((p) => (p.title || "").toLowerCase())
        .join(" ");
    if (all.includes("pantolon") ||
        all.includes("elbise") ||
        all.includes("kazak") ||
        all.includes("gomlek") ||
        all.includes("gömlek") ||
        all.includes("etek") ||
        all.includes("tunik") ||
        all.includes("ceket"))
        return "giyim";
    if (all.includes("ayakkabi") ||
        all.includes("ayakkabı") ||
        all.includes("sneaker") ||
        all.includes("bot") ||
        all.includes("topuklu"))
        return "ayakkabi";
    if (all.includes("bilgisayar") ||
        all.includes("laptop") ||
        all.includes("telefon") ||
        all.includes("kulaklik") ||
        all.includes("kulaklık") ||
        all.includes("televizyon") ||
        all.includes("monitor") ||
        all.includes("monitör"))
        return "elektronik";
    if (all.includes("matkap") ||
        all.includes("vida") ||
        all.includes("hirdavat") ||
        all.includes("hırdavat") ||
        all.includes("tornavida"))
        return "hirdavat";
    if (all.includes("cadir") || all.includes("çadır") || all.includes("kamp"))
        return "kamp-outdoor";
    if (all.includes("oyuncak") ||
        all.includes("lego") ||
        all.includes("figür") ||
        all.includes("figuru") ||
        all.includes("bebek"))
        return "oyuncak";
    if (all.includes("dumbbell") ||
        all.includes("halter") ||
        all.includes("kosu bandi") ||
        all.includes("koşu bandı") ||
        all.includes("fitness"))
        return "spor";
    return "genel";
}
/**
 * Intent tespiti
 */
function detectIntent(msg) {
    const t = normalizeText(msg);
    // SMALL TALK
    if (t.includes("nasilsin") ||
        t.includes("naber") ||
        t.includes("napıyorsun") ||
        t.includes("napyorsun") ||
        t.includes("ne yapiyorsun") ||
        t.includes("canim sikildi") ||
        t.includes("sikildim") ||
        t.includes("moralim bozuk") ||
        t.includes("bot musun") ||
        t.includes("yapay zeka") ||
        t.includes("gercek misin")) {
        return "SMALL_TALK";
    }
    // SELAMLAMA
    if (t.includes("merhaba") ||
        t.includes("selam") ||
        t.includes("iyi gunler") ||
        t.includes("slm")) {
        return "GREETING";
    }
    // Mantıklı hangisi? / karar
    if (t.includes("hangisi mantikli") ||
        t.includes("mantikli hangisi") ||
        t.includes("hangisini alayim") ||
        t.includes("hangisini secmeliyim")) {
        return "ASK_RECOMMENDATION";
    }
    // 3 ürün isteği
    if (t.includes("3 urun") ||
        t.includes("uc urun") ||
        t.includes("3 tane oner") ||
        t.includes("uc tane oner") ||
        t.includes("bana uc oner") ||
        t.includes("bana uc tane oner")) {
        return "ASK_RECOMMENDATION";
    }
    // sepete attım alayım mı?
    if (t.includes("sepete attim") || t.includes("alayim mi")) {
        return "ASK_RECOMMENDATION";
    }
    // Sezon soruları yine öneriye gider
    if (t.includes("kis icin") ||
        t.includes("kış icin") ||
        t.includes("yaz icin") ||
        t.includes("havalar soguyor") ||
        t.includes("hava sogudu") ||
        t.includes("yaz yaklasiyor") ||
        t.includes("kis sezonu") ||
        t.includes("kış sezonu")) {
        return "ASK_RECOMMENDATION";
    }
    // Ürün odaklı klasik intentler
    if (t.includes("fiyat") ||
        t.includes("kaca") ||
        t.includes("kaça") ||
        t.includes("ne kadar") ||
        t.includes("ucret") ||
        t.includes("ücret"))
        return "ASK_PRICE";
    if (t.includes("stok") ||
        t.includes("var mi") ||
        t.includes("kalmis mi") ||
        t.includes("kalmis") ||
        t.includes("tukendi mi") ||
        t.includes("tukendi"))
        return "ASK_STOCK";
    if (t.includes("renk") ||
        t.includes("baska renk") ||
        t.includes("hangi renk"))
        return "ASK_COLOR";
    if (t.includes("beden") ||
        t.includes("numara") ||
        t.includes("kac beden") ||
        t.includes("ayak numarasi") ||
        t.includes("ayak numarası") ||
        t.includes("36 olur mu") ||
        t.includes("43 olur mu"))
        return "ASK_SIZE";
    if (t.includes("malzeme") ||
        t.includes("kumastan") ||
        t.includes("kumas") ||
        t.includes("icerik") ||
        t.includes("icindekiler") ||
        t.includes("kalite") ||
        t.includes("dayanikli"))
        return "ASK_MATERIAL";
    if (t.includes("ne icin kullanilir") ||
        t.includes("ne icin kullanirim") ||
        t.includes("nerede kullanilir") ||
        t.includes("hangi amacla") ||
        t.includes("kullanim amaci"))
        return "ASK_USAGE";
    if (t.includes("uygun mu") ||
        t.includes("uyar mi") ||
        t.includes("uyar mı") ||
        t.includes("uygun olur mu") ||
        t.includes("ofis icin uygun mu") ||
        t.includes("denizde kullanilir mi"))
        return "ASK_SUITABILITY";
    if (t.includes("oner") ||
        t.includes("öner") ||
        t.includes("onerir misin") ||
        t.includes("ne onerirsin") ||
        t.includes("hangi urunu alayim") ||
        t.includes("hangi ürünü alayım"))
        return "ASK_RECOMMENDATION";
    if (t.includes("kombin") ||
        t.includes("yanina ne gider") ||
        t.includes("yanina ne olur") ||
        t.includes("neyle giyilir") ||
        t.includes("neyle kullanilir"))
        return "ASK_COMBINATION";
    if (t.includes("kargo") ||
        t.includes("teslimat") ||
        t.includes("ne zaman gelir") ||
        t.includes("kac gunde gelir"))
        return "ASK_SHIPPING";
    if (t.includes("iade") ||
        t.includes("degisim") ||
        t.includes("degistirmek istiyorum") ||
        t.includes("geri gondermek istiyorum"))
        return "ASK_RETURN";
    if (t.includes("kargom nerede") ||
        t.includes("kargo nerede") ||
        t.includes("siparisim nerede") ||
        t.includes("siparis takip") ||
        t.includes("takip numarasi"))
        return "TRACK_ORDER";
    if (t.includes("sikayet") ||
        t.includes("şikayet") ||
        t.includes("memnun degil") ||
        t.includes("memnun değil") ||
        t.includes("cok kotu") ||
        t.includes("hayal kirikligi"))
        return "COMPLAINT";
    return "UNKNOWN";
}
/**
 * Kullanıcının metniyle ürün eşleştirme
 */
function findMatchingProducts(msg, products) {
    const normMsg = normalizeText(msg);
    const tokens = normMsg
        .split(" ")
        .filter((t) => t.length > 2 && !TURKISH_STOP_WORDS.includes(t) && t.trim().length > 0);
    if (!tokens.length)
        return products.slice(0, 5);
    const scored = [];
    for (const p of products) {
        const title = normalizeText(p.title || "");
        let score = 0;
        for (const token of tokens) {
            if (title.includes(token))
                score += 2;
        }
        if (score > 0)
            scored.push({ product: p, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((s) => s.product);
}
/**
 * Ürün özet formatı
 */
function formatProductSummary(p) {
    const lines = [];
    lines.push(`✨ **${p.title}**`);
    if (p.price)
        lines.push(`💰 Fiyat: ${p.price}`);
    else
        lines.push("💰 Fiyat: Güncel fiyat ürün sayfasında yer alıyor.");
    if (p.imageUrl) {
        lines.push(`🖼️ Görsel: ${p.imageUrl}`);
    }
    else if (p.image) {
        lines.push(`🖼️ Görsel: ${p.image}`);
    }
    if (p.category)
        lines.push(`📂 Kategori: ${p.category}`);
    if (p.color)
        lines.push(`🎨 Renk: ${p.color}`);
    if (p.url)
        lines.push(`🔗 Link: ${p.url}`);
    return lines.join("\n");
}
/**
 * Kullanım & kalite yorumu
 */
function usageAndQualityComment(p) {
    const title = (p.title || "").toLowerCase();
    const comments = [];
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
            comments.push("⚙️ Elektronik ürünlerde teknik özellikler kullanım deneyimini doğrudan etkiler; ihtiyacına göre seçim yapmak önemli.");
            break;
        case "ayakkabi":
            comments.push("👟 Doğru numarayı seçtiğinde gün boyu konfor sağlayabilecek bir ayakkabı gibi görünüyor.");
            break;
        case "giyim":
            comments.push("👚 Hem günlük kullanımda hem de kombinlerde rahatlıkla değerlendirebileceğin bir parça gibi duruyor.");
            break;
        case "kamp-outdoor":
            comments.push("🏕️ Dış mekan şartlarına uygun olacak şekilde tasarlanmış izlenimi veriyor; dayanıklılık önemli bir avantajı olabilir.");
            break;
        case "hirdavat":
            comments.push("🛠️ Hırdavat ürünlerinde sağlamlık ve güvenlik en önemli kriterlerdir; doğru kullanımda uzun ömürlü olabilir.");
            break;
        default:
            comments.push("ℹ️ Genel kullanım için uygun, pratik ve işlevsel bir ürün gibi görünüyor.");
            break;
    }
    return comments.join("\n");
}
/**
 * Ek soru sorarak sohbeti ilerletme
 */
function buildFollowUpQuestions(userMessage, category) {
    const t = normalizeText(userMessage);
    if (t.includes("lamba") ||
        t.includes("avize") ||
        t.includes("aydinlatma")) {
        return ("\n\n💡 Daha iyi yönlendirebilmem için:\n" +
            "- Hangi odada kullanacaksın? (salon, yatak odası, mutfak)\n" +
            "- Işık rengi tercihin var mı? (gün ışığı, beyaz, sarı)\n");
    }
    if (t.includes("bilgisayar") || t.includes("oyun oynuyorum")) {
        return ("\n\n🖥️ Sana daha net öneri verebilmem için:\n" +
            "- Oyun mu, ofis mi ağırlıklı kullanacaksın?\n" +
            "- Yaklaşık bütçen ne kadar?\n");
    }
    if (category === "giyim" || category === "ayakkabi") {
        return ("\n\n🧥 Kombin için birkaç soru:\n" +
            "- Günlük kullanım mı, özel gün mü?\n" +
            "- Daha spor mu seviyorsun yoksa klasik mi?\n");
    }
    return "";
}
/**
 * Kombin / tamamlayıcı ürün önerisi
 */
function buildCombinationSuggestion(mainProduct, allProducts) {
    const cat = (mainProduct.category || "genel").toLowerCase();
    const norm = (s) => normalizeText(s || "");
    const lines = [];
    lines.push("🧩 Sana birkaç birlikte kullanılabilecek ürün önerisi hazırladım:\n");
    if (cat === "giyim") {
        const alt = allProducts.find((p) => /pantolon|etek|kot|jean/.test(normalizeText(p.title || "")));
        const ayakkabi = allProducts.find((p) => /ayakkabi|ayakkabı|bot|sneaker/.test(normalizeText(p.title || "")));
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
        lines.push("\n💡 Renklerde birbirine yakın tonları tercih edersen kombin çok daha şık durur.");
        return lines.join("\n");
    }
    if (cat === "ayakkabi") {
        const altGiyim = allProducts.find((p) => /pantolon|kot|jean/.test(norm(p.title || "")));
        lines.push("👟 Ana ürün:");
        lines.push(formatProductSummary(mainProduct));
        if (altGiyim) {
            lines.push("\n👖 Bu ayakkabıyla iyi gidecek alt giyim:");
            lines.push(formatProductSummary(altGiyim));
        }
        lines.push("\n💡 Slim fit pantolonlarla daha modern, bol kesimlerle daha rahat bir stil yakalayabilirsin.");
        return lines.join("\n");
    }
    if (cat === "elektronik") {
        const aksesuar = allProducts.find((p) => /kılıf|kilif|kulaklik|kulaklık|powerbank|sarj|şarj/.test(norm(p.title || "")));
        lines.push("💻 Ana ürün:");
        lines.push(formatProductSummary(mainProduct));
        if (aksesuar) {
            lines.push("\n🔌 Tamamlayıcı aksesuar önerisi:");
            lines.push(formatProductSummary(aksesuar));
        }
        lines.push("\n💡 Uyumlu kılıf, ekran koruyucu veya kulaklık gibi aksesuarlar kullanım deneyimini ciddi şekilde iyileştirir.");
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
    lines.push("\n💡 Genelde ana ürünü destekleyen küçük aksesuarlar hem kullanım hem de fiyat/performans açısından avantajlı olur.");
    return lines.join("\n");
}
/**
 * Satın alma niyetine göre ikna cümlesi
 */
function persuasiveEnding(intent) {
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
function buildReplyForIntent(intent, userMessage, products, customerName) {
    const displayName = formatCustomerName(customerName);
    const matches = findMatchingProducts(userMessage, products);
    const mainProduct = matches[0] || products[0] || null;
    const storeCategory = detectStoreCategory(products);
    const purchaseIntent = detectPurchaseIntent(userMessage);
    const absurd = rejectAbsurdIdeas(userMessage);
    // Absürt kombin yakalandıysa direkt onu döndür
    if (absurd)
        return absurd;
    // Ürün hiç yoksa
    if (!products.length && intent !== "SMALL_TALK" && intent !== "GREETING") {
        return ("Henüz bu mağazada ürün görünmüyor 😊 Önce mağazaya ürün eklenmesi gerekiyor." +
            (displayName ? ` ${displayName}` : ""));
    }
    // SMALL TALK
    if (intent === "SMALL_TALK") {
        for (const p of DAILY_TALK_PATTERNS) {
            if (p.regex.test(userMessage)) {
                let ans = p.answer;
                if (displayName)
                    ans = ans.replace("😊", `😊 ${displayName}`);
                return ans;
            }
        }
        return displayName
            ? `Buradayım ${displayName} 😇 Ürün, kombin veya alışverişle ilgili ne konuşmak istersin?`
            : "Buradayım 😇 Ürün, kombin veya alışverişle ilgili ne konuşmak istersin?";
    }
    // GREETING
    if (intent === "GREETING") {
        return ((displayName ? `Merhaba ${displayName} 👋\n\n` : "Merhaba 👋\n\n") +
            "Ben FlowAI.\n" +
            "Bu mağazanın ürünleri hakkında sana yardımcı olabilirim.\n" +
            "- Ürün tavsiyesi alabilirsin\n" +
            "- Kombin önerisi isteyebilirsin\n" +
            "- Fiyat, beden, kullanım alanı gibi konularda soru sorabilirsin\n\n" +
            "Ne arıyorsun, nasıl yardımcı olayım? 😊");
    }
    // Ürün bulunamadıysa ve niyet ürün değilse
    if (!mainProduct && intent !== "ASK_RECOMMENDATION") {
        return ("Şu anda anlattığın şeye birebir uyan bir ürün bulamadım 😔\n" +
            `Bu mağaza daha çok **${storeCategory}** ürünleri üzerine.\n\n` +
            "İstersen aradığın ürünü biraz daha marka / model / renk gibi detaylarla anlat, sana en yakın alternatifleri önereyim.");
    }
    // 3 ürün isteği açıkça varsa
    if (/3 ürün|3 urun|üç ürün|uc urun|3 tane oner|uc tane oner|bana üç öner|bana uc oner/i.test(userMessage)) {
        const list = products.slice(0, 3);
        if (!list.length) {
            return "🛒 Şu an önerebileceğim ürün bulamadım 😔 Mağazada ürün görünmüyor.";
        }
        const mapped = list.map((p, idx) => `#${idx + 1}\n${formatProductSummary(p)}`).join("\n\n");
        return ("Sana ilk üç ürünü seçtim 🌟\n\n" +
            mapped +
            "\n\nİçlerinden hangisini daha detaylı incelemek istersin?");
    }
    // Hangisi mantıklı → kıyaslama
    if (/hangisi mantıklı|hangisi mantikli|mantıklı hangisi|karşılaştır|karsilastir/i.test(userMessage)) {
        const list = matches.length >= 2 ? matches.slice(0, 2) : products.slice(0, 2);
        if (list.length < 2) {
            if (mainProduct) {
                return ("Karşılaştırma yapacak kadar ürün bulamadım ama bence şu seçenek mantıklı duruyor 👇\n\n" +
                    formatProductSummary(mainProduct));
            }
            return "Karşılaştırma yapacak ürün bulamadım 😕";
        }
        const A = list[0];
        const B = list[1];
        return ("🧠 Senin için iki ürünü kıyasladım:\n\n" +
            `👉 **${A.title}**\n` +
            `- Fiyat: ${A.price || "belirtilmemiş"}\n` +
            "- Daha sade ve kullanımı rahat bir seçenek olabilir.\n\n" +
            `👉 **${B.title}**\n` +
            `- Fiyat: ${B.price || "belirtilmemiş"}\n` +
            "- Tasarım olarak biraz daha iddialı duruyor.\n\n" +
            `🎯 Ben olsam **${A.title}** tercih ederdim, fiyat/performans olarak daha dengeli görünüyor.`);
    }
    // satın alma niyeti yüksek / orta ise özel konuşma
    if (mainProduct && purchaseIntent === "HIGH") {
        return (`🛍️ Bence güzel bir tercih olur${displayName ? ` ${displayName}` : ""}!\n` +
            `"${mainProduct.title}" modeli kullanıcılar tarafından sık tercih edilen bir ürün gibi duruyor.\n\n` +
            formatProductSummary(mainProduct) +
            "\n\n⭐ İçine siniyorsa çok beklemeden almanı öneririm.");
    }
    if (mainProduct && purchaseIntent === "MID") {
        return (`🧠 Kararsız olman normal${displayName ? ` ${displayName}` : ""}.\n` +
            `"${mainProduct.title}" oldukça mantıklı bir tercih gibi görünüyor.\n\n` +
            formatProductSummary(mainProduct) +
            "\n\nİstersen sepete ekleyip biraz daha düşünebilirsin, acele etmene gerek yok 😊");
    }
    // Sezon bazlı öneri
    const t = normalizeText(userMessage);
    if (intent === "ASK_RECOMMENDATION" &&
        (t.includes("kis icin") ||
            t.includes("kış icin") ||
            t.includes("kisin") ||
            t.includes("havalar soguyor") ||
            t.includes("yaz icin") ||
            t.includes("yaz geliyor") ||
            t.includes("yaz yaklasiyor"))) {
        const top = matches.length ? matches : products.slice(0, 3);
        if (!top.length) {
            return "Sezona uygun ürün bulamadım 😔 Ama genel tarzını söylersen sana fikir verebilirim.";
        }
        const items = top
            .slice(0, 3)
            .map((p, i) => `#${i + 1}\n${formatProductSummary(p)}`)
            .join("\n\n");
        return ("Sezona göre sana uygun olabilecek birkaç ürün buldum ❄️🌞\n\n" +
            items +
            "\n\nHangisine daha çok yakın hissediyorsun?");
    }
    // Klasik intentler
    switch (intent) {
        case "ASK_PRICE":
            if (!mainProduct) {
                return "Hangi ürünün fiyatına bakmak istediğini biraz daha net yazabilir misin? (ürün adı veya link)";
            }
            return (formatProductSummary(mainProduct) +
                "\n\n💬 Fiyatla ilgili daha detaylı bilgi istersen sorabilirsin." +
                buildFollowUpQuestions(userMessage, storeCategory));
        case "ASK_STOCK":
            if (!mainProduct) {
                return "Hangi üründe stok durumunu merak ediyorsun? Ürün adını veya linkini yazarsan kontrol mantığını anlatabilirim.";
            }
            return (formatProductSummary(mainProduct) +
                "\n\n📦 Stok bilgisi platform üzerinde anlık olarak güncelleniyor. Ürün sayfasındaki stok durumunu kontrol etmeni öneririm.");
        case "ASK_COLOR":
            if (!mainProduct) {
                return "Renk bilgisini merak ettiğin ürünü biraz daha net tarif edebilir misin?";
            }
            return (formatProductSummary(mainProduct) +
                "\n\n🎨 Varyasyonlarda farklı renk seçenekleri varsa ürün sayfasında görebilirsin.");
        case "ASK_SIZE":
            if (!mainProduct) {
                return "Beden/numara sormak istediğin ürünü biraz daha detaylı yazar mısın?";
            }
            if ((mainProduct.category || "").toLowerCase() === "giyim" ||
                (mainProduct.category || "").toLowerCase() === "ayakkabi") {
                return (formatProductSummary(mainProduct) +
                    "\n\n📏 Beden/numara seçimi için:\n" +
                    "- Arada kaldıysan daha rahat kullanım için bir beden/numara büyük tercih edebilirsin.\n" +
                    "- Ürün yorumlarına da bakmanı öneririm, kalıbı dar mı geniş mi olduğu genelde yazılır.\n");
            }
            return (formatProductSummary(mainProduct) +
                "\n\n📏 Bu üründe klasik beden yerine ölçüler (boy, en, hacim vb.) daha önemli olabilir. Ürün açıklamasındaki ölçü detaylarına bakmanı öneririm.");
        case "ASK_MATERIAL":
            if (!mainProduct) {
                return "Hangi ürünün malzeme/kalitesini merak ediyorsun? Ürün başlığını veya linkini yazarsan yorum yapabilirim.";
            }
            return (formatProductSummary(mainProduct) +
                "\n\n🔍 Kullanım & kalite yorumu:\n" +
                usageAndQualityComment(mainProduct));
        case "ASK_USAGE":
        case "ASK_SUITABILITY":
            if (!mainProduct) {
                return "Hangi ürünün nerede/nasıl kullanılabileceğini merak ediyorsun? Biraz daha detay verebilir misin?";
            }
            return (formatProductSummary(mainProduct) +
                "\n\n🔍 Kullanım & uygunluk yorumu:\n" +
                usageAndQualityComment(mainProduct) +
                "\n\nSpesifik bir kullanım alanı varsa (ofis, günlük, spor, deniz vs.) yazarsan ona göre daha net yorum yapabilirim." +
                buildFollowUpQuestions(userMessage, storeCategory));
        case "ASK_RECOMMENDATION": {
            const list = matches.length ? matches.slice(0, 3) : products.slice(0, 3);
            if (!list.length) {
                return "Şu anda sana önerebileceğim ürün bulamadım 😔 Mağazada ürün görünmüyor.";
            }
            const mapped = list
                .map((p, i) => `#${i + 1}\n${formatProductSummary(p)}`)
                .join("\n\n");
            return ("Sana birkaç ürün öneriyorum 🌟\n\n" +
                mapped +
                "\n\nİçlerinden birini seçersen kombin, kullanım alanı veya alternatiflerini de söyleyebilirim.");
        }
        case "ASK_COMBINATION":
            if (!mainProduct) {
                return ("Kombin önerebilmem için hangi üründen bahsettiğini biraz daha netleştirebilir misin? (ürün adı/linki)");
            }
            return buildCombinationSuggestion(mainProduct, products);
        case "ASK_SHIPPING":
            return ("🚚 **Kargo & Teslimat Bilgisi**\n\n" +
                "Kargo süresi; satın aldığın platformun (Trendyol, Hepsiburada, N11, Amazon vb.) ve satıcının kendi ayarlarına göre değişir.\n\n" +
                "- Genelde 1–3 iş günü içinde kargoya verilir.\n" +
                "- Tahmini teslim tarihi sipariş detaylarında yazar.\n" +
                "- Kargo firmasının takip sayfasından da güncel durumu görebilirsin.\n");
        case "ASK_RETURN":
            return ("🔄 **İade & Değişim Bilgisi**\n\n" +
                "İade ve değişim; alışveriş yaptığın platformun koşullarına göre ilerler.\n\n" +
                "- Çoğu platformda 14 gün cayma hakkı vardır (koşulları platform belirler).\n" +
                "- Ürünü mümkünse kullanılmamış ve orijinal paketiyle göndermen gerekir.\n" +
                "- Detaylar siparişlerim / iade–değişim sayfasında yazar.\n");
        case "TRACK_ORDER":
            return ("📦 **Kargo Takibi Nasıl Yapılır?**\n\n" +
                "- Satın aldığın platformdaki *Siparişlerim* bölümüne gir.\n" +
                "- İlgili siparişi seç, kargo firması ve takip numarasını görebilirsin.\n" +
                "- Takip numarası ile kargo şirketinin web sitesi veya mobil uygulamasından detaylı hareketleri inceleyebilirsin.\n");
        case "COMPLAINT":
            return ("Üzgünüm böyle bir deneyim yaşaman hiç hoş olmamış 😔\n\n" +
                "Yaşadığın sorunu biraz detaylandırabilirsen; ürün, kargo veya satıcı kaynaklı mı anlamaya çalışırım ve seni doğru yönlendirebilirim.\n" +
                "Ayrıca alışveriş yaptığın platform üzerinden de resmi şikayet / destek kaydı açmanı öneririm.\n");
        case "UNKNOWN":
        default:
            if (mainProduct) {
                return (formatProductSummary(mainProduct) +
                    "\n\nTam olarak ne öğrenmek istediğini (fiyat, beden, kullanım alanı, kombin, vs.) yazarsan daha net yardımcı olabilirim 😊" +
                    buildFollowUpQuestions(userMessage, storeCategory));
            }
            return ("Tam anlayamadım ama yardımcı olmak isterim 😊 Ürün ismini, linkini veya ne tarz bir şey aradığını biraz daha detaylı yazabilir misin?" +
                (displayName ? ` ${displayName}` : ""));
    }
}
/**
 * Tüm akıllı katmanları birleştiren ana fonksiyon
 */
function buildFullSmartResponse(intent, message, products, customerName) {
    // Önce çok sert / agresif durum varsa sakinleştir
    const calm = calmResponse(message);
    if (calm)
        return calm;
    const base = buildReplyForIntent(intent, message, products, customerName);
    const sentiment = detectSentiment(message);
    const tone = sentimentTone(sentiment);
    const purchase = detectPurchaseIntent(message);
    const persuasion = persuasiveEnding(purchase);
    const empathy = empathyLine(message);
    let reply = base + tone + persuasion;
    if (empathy)
        reply += "\n\n" + empathy;
    return reply;
}
/**
 * DIŞARI AÇILAN ANA FONKSİYON
 */
export async function generateSmartReply(shopId, userMessage) {
    const trimmed = (userMessage || "").trim();
    if (!trimmed) {
        return "Merhaba 👋 Ne hakkında yardımcı olmamı istersin? Ürün, kombin, fiyat veya kargo hakkında soru sorabilirsin.";
    }
    const name = extractCustomerName(trimmed);
    const products = await getProductsForShop(shopId);
    const intent = detectIntent(trimmed);
    return buildFullSmartResponse(intent, trimmed, products, name);
}
/**
 * Geriye dönük uyumluluk için alias fonksiyonlar
 */
export async function getAssistantReply(shopId, userMessage) {
    return generateSmartReply(shopId, userMessage);
}
export async function getAIResponse(shopId, userMessage) {
    return generateSmartReply(shopId, userMessage);
}
