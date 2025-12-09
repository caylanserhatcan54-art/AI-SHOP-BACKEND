// src/services/assistantService.ts
import { getProductsForShop, normalizeText, } from "./productService.js";
// Geçici hafıza
let MEMO = {
    size: null,
    color: null,
    budget: null,
    person: null,
};
/* ----------------------------------------------
 * STOP WORDS
 * ---------------------------------------------- */
const STOP = [
    "ve", "ya", "mi", "mu", "mü", "de", "da", "ile", "bu", "şu", "o", "bir", "icin", "için",
    "gibi", "ne", "kadar", "var", "ben", "sen", "o", "çok"
];
/* ----------------------------------------------
 * SMALL TALK PATTERNS
 * ---------------------------------------------- */
const SMALL_TALK = [
    { regex: /(nasılsın|napıyorsun|nbr|naber)/i, answer: "İyiyim 😊 Sen nasılsın? Ürün mü bakıyoruz yoksa sadece sohbet mi?" },
    { regex: /(canım sıkıldı|sıkıldım|moralim bozuk)/i, answer: "Üzülme 😌 İstersen sana birkaç güzel ürün göstereyim, belki modun yükselir." },
    { regex: /(gerçek misin|bot musun|yapay zeka)/i, answer: "Ben FlowAI 🤖 Gerçek değilim ama sana gerçek gibi yardımcı olurum 😊" },
];
/* ----------------------------------------------
 * İSİM YAKALAMA
 * ---------------------------------------------- */
const NAME_PATTERN = /(benim adım|adım|bana)[: ]+([a-zA-ZığüşöçİĞÜŞÖÇ]+)/i;
function extractName(msg) {
    const m = msg.match(NAME_PATTERN);
    if (!m)
        return null;
    const n = m[2];
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}
function formatName(n) {
    if (!n)
        return "";
    return `${n} `;
}
/* ----------------------------------------------
 * ABSÜRT KOMBİN ENGELLEME
 * ---------------------------------------------- */
function rejectAbsurd(msg) {
    const t = normalizeText(msg);
    const rules = [
        { keys: ["terlik", "kaban"], msg: "Terlikle kaban çok uymaz 😊 İstersen sana daha uyumlu bir kombin yapayım." },
        { keys: ["mont", "sandalet"], msg: "Mont ile sandalet farklı mevsimlere ait gibi 😄 Daha uyumlu bir şeyler seçelim." },
        { keys: ["bot", "kırmızı çorap"], msg: "Bot + parlak kırmızı çorap çok iddialı 😄 Daha sade tonlar önerebilirim." }
    ];
    for (const r of rules) {
        if (r.keys.every(k => t.includes(normalizeText(k))))
            return r.msg;
    }
    return null;
}
/* ----------------------------------------------
 * SATIN ALMA NİYETİ
 * ---------------------------------------------- */
function detectPurchaseIntent(t) {
    t = normalizeText(t);
    if (t.includes("sepete attim") || t.includes("alayim mi") || t.includes("alacagim") || t.includes("aldim"))
        return "HIGH";
    if (t.includes("bakarim") || t.includes("kararsiz") || t.includes("simdilik"))
        return "MID";
    return "LOW";
}
/* ----------------------------------------------
 * DUYGU ANALİZİ
 * ---------------------------------------------- */
function detectSentiment(t) {
    t = normalizeText(t);
    if (t.includes("berbat") || t.includes("rezalet") || t.includes("nefret") || t.includes("kotu") || t.includes("moral"))
        return "NEG";
    if (t.includes("harika") || t.includes("bayildim") || t.includes("mükemmel") || t.includes("cok iyi"))
        return "POS";
    return "NEU";
}
function sentimentTone(s) {
    if (s === "NEG")
        return "\nÜzüldüm 😔 İstersen beraber daha iyi seçenekler bulalım.";
    if (s === "POS")
        return "\nHarika! 😍 İstersen benzer ürünler de önerebilirim.";
    return "";
}
/* ----------------------------------------------
 * SERT ÜSLUP YUMUŞATMA
 * ---------------------------------------------- */
function calmDown(t) {
    t = normalizeText(t);
    if (t.includes("rezalet") || t.includes("nefret") || t.includes("aptal"))
        return "Üzgünüm böyle hissettirdiğim için 😔 Anlatırsan yardımcı olmaya çalışırım.";
    return null;
}
/* ----------------------------------------------
 * INTENT TESPİTİ
 * ---------------------------------------------- */
function detectIntent(msg) {
    const t = normalizeText(msg);
    if (t.includes("nasilsin") || t.includes("sikildim") || t.includes("bot musun") || t.includes("gercek misin"))
        return "SMALL_TALK";
    if (t.includes("merhaba") || t.includes("selam"))
        return "GREETING";
    if (t.includes("hangisi mantikli") || t.includes("hangisini alayim"))
        return "ASK_RECOMMENDATION";
    if (t.includes("3 urun") || t.includes("uc urun") || t.includes("3 tane"))
        return "ASK_RECOMMENDATION";
    if (t.includes("sepete attim") || t.includes("alayim mi"))
        return "ASK_RECOMMENDATION";
    if (t.includes("fiyat") || t.includes("ne kadar"))
        return "ASK_PRICE";
    if (t.includes("stok") || t.includes("var mi"))
        return "ASK_STOCK";
    if (t.includes("renk"))
        return "ASK_COLOR";
    if (t.includes("beden") || t.includes("numara"))
        return "ASK_SIZE";
    if (t.includes("malzeme") || t.includes("kumas"))
        return "ASK_MATERIAL";
    if (t.includes("kullan") || t.includes("nerede"))
        return "ASK_USAGE";
    if (t.includes("uygun mu") || t.includes("uyar mi"))
        return "ASK_SUITABILITY";
    if (t.includes("kombin") || t.includes("yanina ne gider"))
        return "ASK_COMBINATION";
    if (t.includes("kargo") || t.includes("teslimat"))
        return "ASK_SHIPPING";
    if (t.includes("iade") || t.includes("degisim"))
        return "ASK_RETURN";
    if (t.includes("kargom nerede") || t.includes("siparis takip"))
        return "TRACK_ORDER";
    if (t.includes("sikayet") || t.includes("kotu"))
        return "COMPLAINT";
    return "UNKNOWN";
}
/* ----------------------------------------------
 * ÜRÜN EŞLEŞTİRME
 * ---------------------------------------------- */
function findMatchingProducts(msg, products) {
    const t = normalizeText(msg);
    let tokens = t.split(" ").filter(x => x.length > 2 && !STOP.includes(x));
    if (!tokens.length)
        return products.slice(0, 5);
    let scored = products.map(p => {
        const title = normalizeText(p.title || "");
        let score = 0;
        for (const tok of tokens)
            if (title.includes(tok))
                score += 2;
        return { p, score };
    });
    scored = scored.filter(s => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.p).slice(0, 5);
}
/* ----------------------------------------------
 * ÜRÜN ÖZETİ
 * ---------------------------------------------- */
function formatProduct(p) {
    const img = p.image || p.imageUrl || "";
    return `✨ **${p.title}**
💰 Fiyat: ${p.price ?? "Belirtilmemiş"}
🖼️ Görsel: ${img}
📂 Kategori: ${p.category}
🔗 Link: ${p.url}`;
}
/* ----------------------------------------------
 * KOMBİN ÖNERİ
 * ---------------------------------------------- */
function buildCombination(main, all) {
    const sec = all.find(x => x.id !== main.id);
    if (!sec)
        return formatProduct(main);
    return (`🧩 Kombin Önerisi

Ana ürün:
${formatProduct(main)}

Tamamlayıcı:
${formatProduct(sec)}

💡 Renk uyumuna dikkat edersen çok şık durur!`);
}
/* ----------------------------------------------
 * ANA YANIT ÜRETİCİ
 * ---------------------------------------------- */
function buildReply(intent, msg, products, name) {
    const displayName = name ? name + " " : "";
    const matches = findMatchingProducts(msg, products);
    const main = matches[0] || products[0] || null;
    // Absürt kombin
    const absurd = rejectAbsurd(msg);
    if (absurd)
        return absurd;
    // SMALL TALK
    if (intent === "SMALL_TALK") {
        for (const p of SMALL_TALK) {
            if (p.regex.test(msg))
                return displayName + p.answer;
        }
        return displayName + "Buradayım 😊 Nasıl yardımcı olayım?";
    }
    // GREETING
    if (intent === "GREETING")
        return `Merhaba ${displayName}👋 Ben FlowAI. Ürünler, kombin, fiyat, kargo... Hepsinde yardımcı olabilirim 😊`;
    // Ürün yoksa
    if (!products.length) {
        return "Mağazada ürün yok gibi görünüyor 😊 Ürün eklenince sana öneri yapabilirim.";
    }
    // 3 ürün isteği
    if (/3 urun|3 ürün|uc urun|3 tane/.test(msg)) {
        const list = products.slice(0, 3);
        return ("Senin için 3 ürün seçtim 🌟\n\n" +
            list.map((p, i) => `#${i + 1}\n${formatProduct(p)}`).join("\n\n"));
    }
    // Hangisi mantıklı?
    if (/hangisi mantikli|hangisini alayim/.test(msg)) {
        const two = matches.slice(0, 2);
        if (two.length < 2)
            return formatProduct(main);
        return (`🧠 Senin için kıyasladım:

1) **${two[0].title}**
- Fiyat: ${two[0].price}

2) **${two[1].title}**
- Fiyat: ${two[1].price}

🎯 Bana göre **${two[0].title}** daha mantıklı bir tercih.`);
    }
    // Fiyat
    if (intent === "ASK_PRICE")
        return formatProduct(main);
    // Stok
    if (intent === "ASK_STOCK")
        return formatProduct(main) + "\n📦 Stok bilgisi platformda anlık görünür.";
    // Renk
    if (intent === "ASK_COLOR")
        return formatProduct(main) + "\n🎨 Üründe renk seçenekleri varsa varyasyonlarda görünür.";
    // Beden
    if (intent === "ASK_SIZE")
        return formatProduct(main) + "\n📏 Beden yorumları için ürün açıklamasına bakabilirsin.";
    // Malzeme / kalite
    if (intent === "ASK_MATERIAL")
        return formatProduct(main) + "\n🧵 Malzeme bilgisi ürün açıklamasında detaylıdır.";
    // Kullanım
    if (intent === "ASK_USAGE" || intent === "ASK_SUITABILITY")
        return formatProduct(main) + "\n🔍 Kullanım alanı modele göre değişir, nerede kullanacağını söylersen net öneririm.";
    // Kombin
    if (intent === "ASK_COMBINATION")
        return buildCombination(main, products);
    // Kargo
    if (intent === "ASK_SHIPPING") {
        return "🚚 Kargo genelde 1–3 gün içinde çıkar, teslim tarihi platformda yazar.";
    }
    // İade
    if (intent === "ASK_RETURN") {
        return "🔄 İade süresi platforma göre değişir, genelde 14 gündür.";
    }
    // Takip
    if (intent === "TRACK_ORDER") {
        return "📦 Siparişlerim → Kargo Takip bölümünden görebilirsin.";
    }
    // Şikayet
    if (intent === "COMPLAINT") {
        return "Üzüldüm böyle olmasına 😔 Detay verirsen daha iyi yardımcı olurum.";
    }
    // Öneri
    if (intent === "ASK_RECOMMENDATION") {
        const list = matches.length ? matches.slice(0, 3) : products.slice(0, 3);
        return ("Sana uygun birkaç ürün öneriyorum 🌟\n\n" +
            list.map((p, i) => `#${i + 1}\n${formatProduct(p)}`).join("\n\n"));
    }
    // Genel fallback
    return (formatProduct(main) +
        "\n\nTam olarak ne öğrenmek istersin? Fiyat, beden, kombin... hepsi olur 😊");
}
/* ----------------------------------------------
 * FULL YANIT — TON + EMPATİ + SATIN ALMA NİYETİ
 * ---------------------------------------------- */
function buildFull(intent, msg, products, name) {
    const calm = calmDown(msg);
    if (calm)
        return calm;
    const base = buildReply(intent, msg, products, name);
    const sentiment = detectSentiment(msg);
    const tone = sentimentTone(sentiment);
    const buy = detectPurchaseIntent(msg);
    const persuasion = buy === "HIGH" ? "\n⭐ İçine sindiyse hiç bekleme, stok değişebilir."
        : buy === "MID" ? "\n💡 İstersen sepete ekleyip biraz düşünebilirsin."
            : "\nHer soruna açığım 😊";
    return base + tone + persuasion;
}
/* ----------------------------------------------
 * EXPORT – DIŞA AÇILAN ANA FONKSİYON
 * ---------------------------------------------- */
export async function generateSmartReply(shopId, userMessage) {
    const msg = userMessage.trim();
    if (!msg)
        return "Merhaba 👋 Nasıl yardımcı olayım?";
    const name = extractName(msg);
    const products = await getProductsForShop(shopId);
    const intent = detectIntent(msg);
    return buildFull(intent, msg, products, name);
}
export async function getAssistantReply(shopId, msg) {
    return generateSmartReply(shopId, msg);
}
export async function getAIResponse(shopId, msg) {
    return generateSmartReply(shopId, msg);
}
