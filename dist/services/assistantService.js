// src/services/assistantService.ts
import { getProductsForShop, normalizeText, } from "./productService.js";
import { detectQuestionScope } from "./detectQuestionScope.js";
import { detectProductIntent } from "./detectProductIntent.js";
// Firestore (admin SDK). Projende firebase-admin init varsa direkt çalışır.
// Init yoksa bu dosya derlenir; runtime’da try/catch ile sessiz geçer.
import { getFirestore } from "firebase-admin/firestore";
/* =========================================================
   ✅ NORMALIZE HELPERS
========================================================= */
function n(s) {
    return normalizeText(s || "");
}
function extractBudgetTL(message) {
    const t = message.toLowerCase();
    // "1500 tl", "1500₺", "1500 lira"
    const m = t.match(/(\d{2,6})\s*(tl|₺|lira)/i);
    if (!m)
        return null;
    const val = parseInt(m[1], 10);
    return Number.isFinite(val) ? val : null;
}
function parsePriceToNumber(price) {
    if (price == null)
        return null;
    const s = String(price);
    const num = parseInt(s.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(num) && num > 0 ? num : null;
}
/* =========================================================
   ✅ IMAGE FILTER (Amazon vs others)
========================================================= */
function isTrashImage(url) {
    const u = (url || "").toLowerCase();
    if (!u)
        return true;
    // common junk
    if (u.includes("sprite") ||
        u.includes("icon") ||
        u.endsWith(".svg") ||
        u.endsWith(".gif") ||
        u.includes("pixel") ||
        u.includes("transparent") ||
        u.includes("loading"))
        return true;
    // amazon junk
    if (u.includes("/images/g/"))
        return true;
    if (u.includes("_sr38") || u.includes("_ss64"))
        return true;
    return false;
}
function pickBestImage(product) {
    const anyP = product;
    const candidates = [];
    // common fields
    if (anyP.imageUrl)
        candidates.push(String(anyP.imageUrl));
    if (anyP.image)
        candidates.push(String(anyP.image));
    if (anyP.image_url)
        candidates.push(String(anyP.image_url));
    // array fields
    const imgs = anyP.images;
    if (Array.isArray(imgs)) {
        for (const u of imgs)
            candidates.push(String(u));
    }
    // filter junk
    const clean = candidates.filter((u) => !isTrashImage(u));
    // Amazon real product images are usually m.media-amazon.com/images/I/
    const amazonMain = clean.find((u) => u.toLowerCase().includes("m.media-amazon.com/images/i/"));
    if (amazonMain)
        return amazonMain;
    return clean[0] || "";
}
/* =========================================================
   ✅ FIRESTORE MEMORY (PERSISTENT)
========================================================= */
async function loadMemory(shopId, sessionId) {
    const fallback = {
        lastIntent: null,
        lastQuery: null,
        lastBudget: null,
        lastSeenProductId: null,
        shownProductIds: [],
        askedReviewsForProductId: null,
        updatedAt: Date.now(),
    };
    try {
        const db = getFirestore();
        const ref = db
            .collection("shops")
            .doc(shopId)
            .collection("sessions")
            .doc(sessionId);
        const snap = await ref.get();
        if (!snap.exists)
            return fallback;
        const data = snap.data();
        return {
            ...fallback,
            ...data,
            shownProductIds: Array.isArray(data.shownProductIds)
                ? data.shownProductIds
                : [],
        };
    }
    catch {
        return fallback;
    }
}
async function saveMemory(shopId, sessionId, mem) {
    try {
        const db = getFirestore();
        const ref = db
            .collection("shops")
            .doc(shopId)
            .collection("sessions")
            .doc(sessionId);
        await ref.set({
            ...mem,
            updatedAt: Date.now(),
        }, { merge: true });
    }
    catch {
        // ignore
    }
}
/* =========================================================
   ✅ PRODUCT TEXT (SEARCH CORPUS)
========================================================= */
function productCorpus(p) {
    const anyP = p;
    const parts = [
        p.title || "",
        p.category || "",
        anyP.description || "",
        anyP.shortDescription || "",
        anyP.brand || "",
        anyP.platform || "",
        anyP.rawText || anyP.hamText || anyP["ham metin"] || "",
    ];
    return n(parts.join(" "));
}
function productReviews(p) {
    const anyP = p;
    const r = anyP.reviews ||
        anyP.comments ||
        anyP.yorumlar ||
        anyP.yorum ||
        anyP.customerReviews ||
        null;
    if (Array.isArray(r))
        return r.map((x) => String(x)).filter(Boolean);
    if (typeof r === "string" && r.length > 0)
        return [r];
    return [];
}
/* =========================================================
   ✅ INTENT → CATEGORY LOCK (prevents mixing)
========================================================= */
function intentKeywords(intent) {
    switch (intent) {
        case "AYAKKABI":
            return /(ayakkabi|sneaker|bot|cizme|terlik|topuklu|loafer|spor ayakkabi)/i;
        case "GIYIM_DIS_GIYIM":
            return /(mont|kaban|ceket|parka|polar|yagmurluk|trenckot)/i;
        case "GIYIM_UST":
            return /(tisort|t-shirt|gomlek|kazak|sweat|hoodie|polo|bluz|hirka)/i;
        case "GIYIM_ALT":
            return /(pantolon|jean|kot|esofman alt|etek|sort|tayt)/i;
        case "AKSESUAR":
            return /(canta|kemer|sapka|bere|atki|eldiven|gozluk|kilif|case)/i;
        case "KOZMETIK":
            return /(krem|serum|sampuan|parfum|edt|edp|ruj|maskara|cilt|tonik|deodorant)/i;
        case "TEMIZLIK":
            return /(deterjan|temizlik|yuzey|camasir|bulasik|dezenfektan|camasir suyu)/i;
        case "MUTFAK_ZUCCACIYE":
            return /(bardak|kupa|tabak|tencere|tava|catal|kasik|bicen|termos|cam)/i;
        case "HIRDAVAT":
            return /(matkap|vida|pense|anahtar|tornavida|makas|testere|silikon|yapistirici|sprey boya)/i;
        case "ELEKTRONIK":
            return /(telefon|laptop|bilgisayar|kulaklik|tablet|powerbank|sarj|kablo|tv|monitor|klavye|mouse)/i;
        case "PET":
            return /(kedi|kopek|mama|kum|tasma|pet|akvaryum|balik yemi)/i;
        case "SPOR_FITNESS":
            return /(dambıl|dumbbell|halter|fitness|yoga|kosu|band|elastik|mat)/i;
        case "EV_YASAM":
            return /(hali|kilim|perde|nevresim|yastik|dekor|vazo|avize|lamba|mobilya|sandalye|masa)/i;
        case "TAKI_SAAT":
            return /(taki|kolye|bileklik|kupe|yuzuk|saat)/i;
        case "GIDA":
            return /(kahve|cay|cikolata|gida|atistirmalik|protein|bar)/i;
        case "BELIRSIZ":
        default:
            return /.*/i;
    }
}
/* =========================================================
   ✅ PRODUCT SEARCH (scoring)
========================================================= */
function tokenize(msg) {
    const t = n(msg);
    return t
        .split(" ")
        .map((x) => x.trim())
        .filter((x) => x.length >= 3)
        .slice(0, 14);
}
function scoreProduct(msg, p, intent) {
    const corpus = productCorpus(p);
    const tokens = tokenize(msg);
    const kw = intentKeywords(intent);
    const intentHit = kw.test(corpus);
    // intent locked: if intent is not BELIRSIZ, penalize non-matching strongly
    let score = intent === "BELIRSIZ" ? 0 : intentHit ? 25 : -40;
    const title = n(p.title || "");
    const cat = n(p.category || "");
    const anyP = p;
    const desc = n(anyP.description || "");
    for (const tok of tokens) {
        if (title.includes(tok))
            score += 18;
        else if (desc.includes(tok))
            score += 10;
        else if (cat.includes(tok))
            score += 6;
        else if (corpus.includes(tok))
            score += 4;
    }
    // if query is very short (e.g., "mont"), boost intent matches in title/corpus
    if (tokens.length <= 2 && intentHit)
        score += 20;
    // slight boost if has image and url
    if (p.url)
        score += 2;
    if (pickBestImage(p))
        score += 2;
    return score;
}
function searchProducts(message, products, intent, budgetTL) {
    const scored = products
        .map((p) => ({ p, s: scoreProduct(message, p, intent) }))
        .sort((a, b) => b.s - a.s);
    let list = scored.filter((x) => x.s > 0).map((x) => x.p);
    // budget filter (only if product has parseable price)
    if (budgetTL != null) {
        const within = list.filter((p) => {
            const pn = parsePriceToNumber(p.price);
            if (pn == null)
                return false;
            return pn <= budgetTL;
        });
        // if budget eliminates everything, keep original list (don’t return empty)
        if (within.length)
            list = within;
    }
    // fallback: if empty and intent is not BELIRSIZ, try intent-only match
    if (!list.length && intent !== "BELIRSIZ") {
        const kw = intentKeywords(intent);
        list = products.filter((p) => kw.test(productCorpus(p)));
    }
    // final fallback: semantic-ish by tokens
    if (!list.length) {
        const tokens = tokenize(message);
        list = products.filter((p) => {
            const c = productCorpus(p);
            return tokens.some((t) => c.includes(t));
        });
    }
    return list;
}
/* =========================================================
   ✅ FORMAT PRODUCTS FOR FRONTEND + “no repeat”
========================================================= */
function formatProductsForFrontend(products, shownSet, limit = 3) {
    const fresh = products.filter((p) => !shownSet.has(p.id));
    const final = fresh.length ? fresh : products;
    const picked = final.slice(0, limit);
    picked.forEach((p) => shownSet.add(p.id));
    return picked.map((p) => ({
        id: p.id,
        title: p.title || "",
        price: p.price ? String(p.price) : "",
        url: p.url || "",
        imageUrl: pickBestImage(p),
        category: p.category || "genel",
    }));
}
/* =========================================================
   ✅ SMALL TALK / EMOTIONAL
========================================================= */
function smallTalkReply(message) {
    const t = n(message);
    if (/(merhaba|selam|slm|hey)/i.test(t))
        return "Merhaba 👋 Hoş geldin. İstersen sohbet edelim, istersen ürün arayalım 😊";
    if (/(nasilsin|naber|iyi misin)/i.test(t))
        return "İyiyim ve buradayım 😊 Sen nasılsın? Bugün ne arıyorsun? (örn: bardak, ayakkabı, kedi maması)";
    if (/(kimsin|bot musun|yapay zeka)/i.test(t))
        return "Ben bu mağazanın akıllı asistanıyım 🤖 Ürün bulma, karşılaştırma, kombin ve destek konularında yardımcı olabilirim.";
    return "Buradayım 😊 Nasıl yardımcı olayım?";
}
function emotionalReply() {
    return "Bunu duyduğuma üzüldüm 😔 İstersen biraz konuşalım. İstersen de kafanı dağıtacak şekilde ürün/öneri bakabiliriz.";
}
/* =========================================================
   ✅ COMBINATION (FASHION) / BUNDLE (NON-FASHION)
========================================================= */
function isFashionIntent(intent) {
    return (intent === "AYAKKABI" ||
        intent === "GIYIM_DIS_GIYIM" ||
        intent === "GIYIM_UST" ||
        intent === "GIYIM_ALT" ||
        intent === "AKSESUAR");
}
function wantsCombination(message) {
    const t = n(message);
    return /(kombin|dogum gunu|dogumgunu|outfit|stiline|neyle giyilir|yanina ne gider)/i.test(t);
}
function pickByRegex(products, re) {
    const p = products.find((x) => re.test(productCorpus(x)));
    return p || null;
}
function buildCombinationReply(message, allProducts, main) {
    // If no main, choose a good base
    const base = main || allProducts[0] || null;
    if (!base)
        return { text: "Kombin yapabilmem için mağazada ürün görmem gerekiyor 😊", picks: [] };
    const corpus = productCorpus(base);
    // try build: outer/upper/lower/shoes/accessory
    const outer = /mont|kaban|ceket|parka|yagmurluk/.test(corpus) ? base : pickByRegex(allProducts, /(mont|kaban|ceket|parka|yagmurluk)/i);
    const upper = /tisort|t-shirt|gomlek|kazak|sweat|hoodie|polo|bluz|hirka/.test(corpus) ? base : pickByRegex(allProducts, /(tisort|t-shirt|gomlek|kazak|sweat|hoodie|polo|bluz|hirka)/i);
    const lower = /pantolon|jean|kot|esofman alt|etek|sort|tayt/.test(corpus) ? base : pickByRegex(allProducts, /(pantolon|jean|kot|esofman alt|etek|sort|tayt)/i);
    const shoes = /ayakkabi|sneaker|bot|cizme|terlik/.test(corpus) ? base : pickByRegex(allProducts, /(ayakkabi|sneaker|bot|cizme|terlik)/i);
    const acc = pickByRegex(allProducts, /(canta|kemer|sapka|bere|atki|eldiven|gozluk)/i);
    const picks = [outer, upper, lower, shoes, acc].filter(Boolean);
    const lines = [];
    lines.push("🧩 Sana mağazadaki ürünlerden bir kombin çıkardım:");
    for (const p of picks.slice(0, 4))
        lines.push(`• ${p.title}`);
    // ask for style details
    lines.push("\nİstersen şunu da söyle: spor mu daha klasik mi? Bir de bütçen var mı?");
    return { text: lines.join("\n"), picks };
}
/* =========================================================
   ✅ PRODUCT-QA FROM DESCRIPTION + REVIEWS OFFER
========================================================= */
function buildUsageAnswerFromProduct(p) {
    const anyP = p;
    const desc = String(anyP.description || anyP.shortDescription || "").trim();
    if (desc.length > 40) {
        return (`🔎 **${p.title}** hakkında ürün açıklamasından özet:\n` +
            `${desc.slice(0, 600)}${desc.length > 600 ? "..." : ""}\n\n` +
            "İstersen kullanım amacını (nerede kullanacaksın?) yaz, daha net yönlendireyim.");
    }
    // fallback generic
    return (`🔎 **${p.title}** için açıklama çok kısa görünüyor.\n` +
        "Bana şunu söyle: nerede/kim için kullanacaksın? Ona göre daha doğru öneri yapayım.");
}
function salesPitchFromData(p) {
    const anyP = p;
    const parts = [];
    // only say “stok az” if we have stock info
    const stock = anyP.stock ?? anyP.stok ?? null;
    if (typeof stock === "number") {
        if (stock > 0 && stock <= 3)
            parts.push("⏳ Stok adedi düşük görünüyor, geç kalmadan almak mantıklı olabilir.");
    }
    // only say popular if we have rating/count
    const rating = anyP.rating ?? anyP.puan ?? null;
    const reviewCount = anyP.reviewCount ?? anyP.yorumSayisi ?? null;
    if (rating && reviewCount) {
        parts.push("⭐ Yorum/puan verisi olan ürünlerden biri; istersen yorumları da gösterebilirim.");
    }
    if (!parts.length) {
        // safe generic (no claims)
        parts.push("İstersen benzer alternatifleri de çıkarabilirim.");
    }
    return parts.join(" ");
}
/* =========================================================
   ✅ MAIN ANSWER BUILDER
========================================================= */
function buildClarifyQuestion(intent) {
    // short, helpful clarifying question
    switch (intent) {
        case "AYAKKABI":
            return "Ayakkabıda spor mu klasik mi arıyorsun? Numara ve renk var mı?";
        case "MUTFAK_ZUCCACIYE":
            return "Bardak/züccaciye için cam mı porselen mi? Kaç adet ve kullanım amacı (çay/kahve) nedir?";
        case "PET":
            return "Kedi mi köpek mi? Yaş ve mama/oyuncak gibi hangi tür ürüne bakıyoruz?";
        case "HIRDAVAT":
            return "Ev kullanımı mı profesyonel mi? Hangi iş için (kesme, vidalama, ölçüm) lazım?";
        default:
            return "Biraz daha detay verir misin? (kullanım amacı, bütçe, tercih)";
    }
}
function isAskingReviews(message) {
    const t = n(message);
    return /(yorum|yorumlar|degerlendirme|puan|kullananlar ne demis)/i.test(t);
}
function isAskingUsage(message) {
    const t = n(message);
    return /(ne ise yarar|nasil kullanilir|kullanim|nerede kullanilir|amac|ise yarar mi)/i.test(t);
}
function isGiftMode(message) {
    const t = n(message);
    return /(hediye|dogum gunu|anneler gunu|babalar gunu|sevgiliye|arkadasa)/i.test(t);
}
function giftHint(message) {
    const t = n(message);
    if (!/(hediye|dogum gunu|anneler gunu|babalar gunu|sevgiliye|arkadasa)/i.test(t))
        return "";
    if (/anne/.test(t))
        return "🎁 Anne için daha zarif ve günlük kullanılabilir seçenekler genelde daha çok beğeniliyor.";
    if (/baba|erkek/.test(t))
        return "🎁 Baba/erkek için sade, dayanıklı ve kullanışlı seçenekler iyi gider.";
    if (/sevgili/.test(t))
        return "❤️ Sevgili için biraz daha özel/şık duran ürünler tercih edilebilir.";
    return "🎁 Hediye için kullanışlılık + tarz uyumu en iyi yaklaşımdır.";
}
/* =========================================================
   ✅ EXPORT: processChatMessage
========================================================= */
export async function processChatMessage(shopId, sessionId, message) {
    const msg = (message || "").trim();
    if (!shopId || shopId === "chat") {
        return { reply: "Mağaza bilgisi bulunamadı.", products: [] };
    }
    const scope = detectQuestionScope(msg);
    // 1) Empty
    if (scope === "EMPTY") {
        return { reply: "Merhaba 👋 Ne arıyorsun? (örn: bardak, mont, kedi maması)", products: [] };
    }
    // 2) Small talk
    if (scope === "SMALL_TALK") {
        return { reply: smallTalkReply(msg), products: [] };
    }
    // 3) Emotional
    if (scope === "EMOTIONAL") {
        return { reply: emotionalReply(), products: [] };
    }
    // Load memory (persistent)
    const memory = await loadMemory(shopId, sessionId);
    const shownSet = new Set(memory.shownProductIds || []);
    // Pull store products
    const allProducts = await getProductsForShop(shopId);
    if (!allProducts || allProducts.length === 0) {
        return {
            reply: "😊 Bu mağazada henüz ürün görünmüyor.\n" +
                "Önce ürünlerin Firestore’a gelmesi gerekiyor.",
            products: [],
        };
    }
    // budget update
    const budget = extractBudgetTL(msg);
    if (budget != null)
        memory.lastBudget = budget;
    // determine intent
    let intent = detectProductIntent(msg);
    if (intent === "BELIRSIZ" && memory.lastIntent) {
        // context fallback (if user says "buna benzer", etc.)
        const t = n(msg);
        if (/(benzer|alternatif|baska|aynisi)/i.test(t)) {
            intent = memory.lastIntent;
        }
    }
    // GENERAL_INFO: try answer based on a matched product, otherwise generic
    if (scope === "GENERAL_INFO" || isAskingUsage(msg)) {
        // find best product match without strict intent (because question could be “bu ürün nasıl kullanılır?”)
        const candidates = searchProducts(msg, allProducts, intent, memory.lastBudget);
        const main = candidates[0] || allProducts[0];
        // If user asks reviews explicitly, show reviews if exist
        if (isAskingReviews(msg)) {
            const rev = productReviews(main);
            if (!rev.length) {
                return { reply: "Bu ürün için kaydedilmiş yorum görmüyorum 😕 İstersen benzer ürünlere bakalım.", products: [] };
            }
            const short = rev.slice(0, 6).map((x, i) => `• ${String(x).slice(0, 240)}${String(x).length > 240 ? "..." : ""}`);
            return {
                reply: `🗣️ **${main.title}** için bazı yorumlar:\n\n${short.join("\n")}`,
                products: [],
            };
        }
        // build usage answer from description
        memory.lastSeenProductId = main?.id || null;
        memory.askedReviewsForProductId = main?.id || null;
        await saveMemory(shopId, sessionId, {
            ...memory,
            lastIntent: intent !== "BELIRSIZ" ? intent : memory.lastIntent,
            lastQuery: msg,
            shownProductIds: Array.from(shownSet),
            updatedAt: Date.now(),
        });
        const offerReviews = productReviews(main).length > 0
            ? `\n\nİstersen **yorumları da gösterebilirim**. "yorumları göster" yazman yeterli.`
            : "";
        return {
            reply: buildUsageAnswerFromProduct(main) + offerReviews,
            products: [],
        };
    }
    // UNCERTAIN: ask clarifying, but also show store hint categories
    if (scope === "UNCERTAIN") {
        return {
            reply: "Tam olarak ne arıyorsun? 😊\n" +
                "Örnek yazabilirsin: **ayakkabı**, **bardak**, **matkap**, **kedi maması**, **şampuan**.\n" +
                "İstersen kullanım amacını ve bütçeni de söyle, daha iyi filtrelerim.",
            products: [],
        };
    }
    // PRODUCT_REQUEST branch
    // Combination / gift mode special
    const comboWanted = wantsCombination(msg);
    const giftWanted = isGiftMode(msg);
    // If combination requested and store is fashion-heavy, build combination
    if (comboWanted) {
        const candidates = searchProducts(msg, allProducts, intent, memory.lastBudget);
        const main = candidates[0] || null;
        const { text, picks } = buildCombinationReply(msg, allProducts, main);
        // format products for display (show combo items)
        const formatted = formatProductsForFrontend(picks.length ? picks : candidates, shownSet, 4);
        await saveMemory(shopId, sessionId, {
            ...memory,
            lastIntent: intent !== "BELIRSIZ" ? intent : memory.lastIntent,
            lastQuery: msg,
            lastSeenProductId: main?.id || null,
            shownProductIds: Array.from(shownSet),
            askedReviewsForProductId: main?.id || null,
            updatedAt: Date.now(),
        });
        return {
            reply: text + (giftWanted ? `\n\n${giftHint(msg)}` : ""),
            products: formatted,
        };
    }
    // Normal product search
    if (intent === "BELIRSIZ") {
        // If user typed just “mont” etc, detectQuestionScope already pushed to PRODUCT_REQUEST
        // Here we ask clarifying rather than random products
        return {
            reply: "Hangi tür ürüne bakıyoruz? 😊\n" +
                "Örnek: ayakkabı, mont, bardak, matkap, mama...\n" +
                "İstersen kullanım amacı + bütçe de yaz.",
            products: [],
        };
    }
    // Search products with strict intent lock to avoid mixing
    const found = searchProducts(msg, allProducts, intent, memory.lastBudget);
    // If nothing found, don’t hallucinate. Ask detail.
    if (!found.length) {
        await saveMemory(shopId, sessionId, {
            ...memory,
            lastIntent: intent,
            lastQuery: msg,
            shownProductIds: Array.from(shownSet),
            updatedAt: Date.now(),
        });
        return {
            reply: "Mağazada buna en yakın ürünü bulamadım 😕\n" +
                buildClarifyQuestion(intent),
            products: [],
        };
    }
    const main = found[0];
    // If user asks reviews now or said “yorumları göster” after we asked:
    if (isAskingReviews(msg) || (memory.askedReviewsForProductId && /yorum/i.test(n(msg)))) {
        const rev = productReviews(main);
        if (rev.length) {
            const short = rev.slice(0, 6).map((x) => `• ${String(x).slice(0, 240)}${String(x).length > 240 ? "..." : ""}`);
            return {
                reply: `🗣️ **${main.title}** için bazı yorumlar:\n\n${short.join("\n")}`,
                products: [],
            };
        }
    }
    const formatted = formatProductsForFrontend(found, shownSet, 3);
    // build safe sales text
    const reviewOffer = productReviews(main).length > 0
        ? "\n\nİstersen **yorumları da gösterebilirim**. “yorumları göster” yaz."
        : "";
    const reply = `Bunlar ilgini çekebilir 😊\n` +
        salesPitchFromData(main) +
        (giftWanted ? `\n${giftHint(msg)}` : "") +
        reviewOffer;
    // persist memory
    await saveMemory(shopId, sessionId, {
        ...memory,
        lastIntent: intent,
        lastQuery: msg,
        lastSeenProductId: main?.id || null,
        shownProductIds: Array.from(shownSet),
        askedReviewsForProductId: main?.id || null,
        updatedAt: Date.now(),
    });
    return { reply, products: formatted };
}
/* =========================================================
   🔁 COMPAT
========================================================= */
export async function getAssistantReply(shopId, sessionId, userMessage) {
    const res = await processChatMessage(shopId, sessionId, userMessage);
    return res.reply;
}
