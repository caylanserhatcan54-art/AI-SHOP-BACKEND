// src/services/assistantService.ts
// ✅ LLM yok (tamamen kural + Firestore arama)
// ✅ Kullanıcı ne yazarsa yazsın Firestore’da ARAR (başlık/açıklama/ham metin/yorum)
// ✅ “ZORUNLU ürün kelimesi” kuralı: ürün kelimesi geçmiyorsa ASLA göstermez
// ✅ Renk / cinsiyet / yaş / beden / fiyat filtreleri (filtreler yüzünden ürün kalmazsa filtre gevşer ama ÜRÜN kelimesi asla gevşemez)
// ✅ Yorum varsa teklif eder, kullanıcı isterse 3–5 yorum verir
// ✅ Small talk bozulmaz, cevaplar random
// ✅ İsim yakalar (“benim adım X”) ve cevaplarda kullanır
//
// Not: getProductsForShop(shopId) senin productService.ts içinden ürünleri okuyor.
// Firestore yolun /magazalar/{shopId}/platformlar/{platform}/urunler/{id} ise productService'in onu okuması lazım.

import { Product, getProductsForShop, normalizeText } from "./productService.js";
import { detectQuestionScope, QuestionScope } from "./detectQuestionScope.js";
import { getFirestore } from "firebase-admin/firestore";

/* =========================================================
   TYPES
========================================================= */

type FrontProduct = {
  id: string;
  title: string;
  price: string;
  url: string;
  imageUrl: string;
};

type ChatResult = {
  reply: string;
  products: FrontProduct[];
};

type MemoryDoc = {
  userName?: string | null;
  lastQuery?: string | null;
  lastSeenProductId?: string | null;
  lastSeenProductTitle?: string | null;
  shownProductIds: string[];
  updatedAt: number;
};

/* =========================================================
   TEXT / NORMALIZE
========================================================= */

const n = (s: string) => normalizeText(s || "");

/** stopwords: ürün aramasında gereksiz kelimeler */
const STOPWORDS = new Set(
  [
    "ve",
    "ile",
    "icin",
    "için",
    "mi",
    "mı",
    "mu",
    "mü",
    "var",
    "varmi",
    "var mı",
    "bakar misin",
    "bakarmisin",
    "goster",
    "göster",
    "gosterir misin",
    "gösterir misin",
    "oner",
    "öner",
    "onerir misin",
    "önerir misin",
    "istiyorum",
    "lazim",
    "lazım",
    "arama",
    "bul",
    "bulur musun",
    "bulurmusun",
    "hangi",
    "hangisi",
    "en",
    "fiyat",
    "fiyati",
    "fiyatı",
    "kac",
    "kaç",
    "tane",
    "adet",
    "uygun",
    "uyumlu",
    "orjinal",
    "orijinal",
    "kaliteli",
    "en iyi",
    "eniyi",
    "buna",
    "benzer",
    "alternatif",
    "baska",
    "başka",
    "bende",
    "de",
    "da",
    "sadece",
    "lütfen",
    "lutfen",
  ].map(n)
);

function splitWords(msg: string): string[] {
  return n(msg)
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean);
}

/* =========================================================
   FILTERS (color / gender / age / size / price)
========================================================= */

type ParsedFilters = {
  colors: string[];         // normalize edilmiş renk kelimeleri
  gender: string | null;    // erkek/kadin/unisex
  ageGroup: string | null;  // cocuk/yetiskin/genc/yasli (heuristic)
  size: string | null;      // XS..XXL, 36..44
  maxPrice: number | null;  // TL
};

const COLOR_SYNONYMS: Record<string, string[]> = {
  siyah: ["siyah", "black", "kara", "antrasit", "füme", "fume", "koyu"],
  beyaz: ["beyaz", "white", "ekru", "krem"],
  kirmizi: ["kirmizi", "kırmızı", "red", "bordo", "nar", "vişne", "visne"],
  mavi: ["mavi", "blue", "lacivert", "indigo", "petrol", "turkuaz"],
  yesil: ["yesil", "yeşil", "green", "haki", "zeytin", "mint"],
  gri: ["gri", "gray", "grey", "antrasit", "füme", "fume"],
  bej: ["bej", "beige", "camel", "kum"],
  pembe: ["pembe", "pink", "rose", "gül", "gul"],
  mor: ["mor", "purple", "lila", "lavanta"],
  sari: ["sari", "sarı", "yellow", "hardal"],
  turuncu: ["turuncu", "orange"],
  kahverengi: ["kahverengi", "brown", "taba", "vizyon"],
};

function detectColors(msg: string): string[] {
  const t = n(msg);
  const hits: string[] = [];
  for (const base in COLOR_SYNONYMS) {
    const variants = COLOR_SYNONYMS[base].map(n);
    if (variants.some((v) => t.includes(v))) hits.push(n(base));
  }
  return Array.from(new Set(hits));
}

/** Cinsiyet/yaş: kullanıcı bazlı arama için keyword olarak da kalabilir ama filtre olarak ayrı tutuyoruz */
function detectGenderAndAge(msg: string): { gender: string | null; ageGroup: string | null } {
  const t = n(msg);

  // gender
  let gender: string | null = null;
  if (/(erkek|bay|man|mens|men)/i.test(t)) gender = "erkek";
  if (/(kadin|kadın|bayan|woman|womens|women|lady)/i.test(t)) gender = "kadin";
  if (/(unisex)/i.test(t)) gender = "unisex";

  // ageGroup (heuristic)
  let ageGroup: string | null = null;
  if (/(bebek|baby|0-?3|0-?6|aylik|aylık)/i.test(t)) ageGroup = "bebek";
  else if (/(cocuk|çocuk|kiz cocuk|kız çocuk|erkek cocuk|erkek çocuk|kids|junior|genclik|gençlik)/i.test(t)) ageGroup = "cocuk";
  else if (/(genc|genç|teen|ergen)/i.test(t)) ageGroup = "genc";
  else if (/(yasli|yaşlı|senior)/i.test(t)) ageGroup = "yasli";
  else if (/(yetiskin|yetişkin|adult)/i.test(t)) ageGroup = "yetiskin";

  return { gender, ageGroup };
}

function detectSize(msg: string): string | null {
  const t = msg.toUpperCase();
  const m = t.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/);
  if (m?.[1]) return m[1];

  const m2 = n(msg).match(/\b(34|35|36|37|38|39|40|41|42|43|44|45|46)\b/);
  if (m2?.[1]) return m2[1];

  return null;
}

function detectMaxPriceTL(msg: string): number | null {
  const t = msg.toLowerCase();
  const m = t.match(/(\d{2,6})\s*(tl|₺|lira)/i);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  return Number.isFinite(val) ? val : null;
}

function parseFilters(msg: string): ParsedFilters {
  const colors = detectColors(msg);
  const { gender, ageGroup } = detectGenderAndAge(msg);
  const size = detectSize(msg);
  const maxPrice = detectMaxPriceTL(msg);

  return { colors, gender, ageGroup, size, maxPrice };
}

/* =========================================================
   PRODUCT CORPUS + UTIL
========================================================= */

function productCorpus(p: Product): string {
  const anyP: any = p as any;

  const parts = [
    p.title || "",
    anyP.baslik || "",
    anyP.description || "",
    anyP.aciklama || "",
    anyP.rawText || "",
    anyP["ham metin"] || "",
    anyP.platform || "",
    anyP.brand || "",
    anyP.marka || "",
    // eğer attributes kaydediyorsan:
    JSON.stringify(anyP.attributes || {}),
    // yorumlar:
    JSON.stringify(anyP.reviews || anyP.yorumlar || anyP.comments || []),
  ];

  return n(parts.join(" "));
}

function parsePriceNumber(price: any): number | null {
  if (price == null) return null;
  const s = String(price);
  const num = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function pickBestImage(p: Product): string {
  const anyP: any = p as any;
  const candidates: string[] = [];

  if (anyP.imageUrl) candidates.push(String(anyP.imageUrl));
  if (anyP.image) candidates.push(String(anyP.image));
  if (anyP.image_url) candidates.push(String(anyP.image_url));

  if (Array.isArray(anyP.images)) {
    for (const u of anyP.images) candidates.push(String(u));
  }

  const clean = candidates.filter((u) => {
    const x = (u || "").toLowerCase();
    if (!x.startsWith("http")) return false;
    if (x.includes("sprite") || x.includes("icon") || x.endsWith(".svg") || x.includes("logo")) return false;
    if (x.includes("placeholder")) return false;
    return true;
  });

  return clean[0] || "";
}

/* =========================================================
   REVIEWS (optional)
========================================================= */

function extractReviews(p: Product): string[] {
  const anyP: any = p as any;

  const r =
    anyP.reviews ||
    anyP.comments ||
    anyP.yorumlar ||
    anyP.yorum ||
    anyP.customerReviews ||
    null;

  if (Array.isArray(r)) return r.map((x) => String(x)).filter(Boolean);
  if (typeof r === "string" && r.trim().length) return [r.trim()];

  // bazen ham metin içine gömülü olabilir; burada “çok kaba” bir özet çıkarıyoruz:
  const raw = String(anyP.rawText || anyP["ham metin"] || "");
  const rawN = n(raw);

  // “yorum” bölümü varsa, ilk birkaç satırı çek (çok güvenli değil ama işe yarar)
  const idx = rawN.indexOf("yorum");
  if (idx >= 0) {
    const slice = raw.substring(idx, Math.min(raw.length, idx + 900));
    const lines = slice
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 20)
      .slice(0, 6);
    if (lines.length) return lines;
  }

  return [];
}

function wantsReviews(msg: string): boolean {
  const t = n(msg);
  return /(yorum|yorumlar|degerlendirme|değerlendirme|puan|kullananlar|yorumlari goster|yorumları göster)/i.test(t);
}

function askIfWantsReviewsHint(p: Product): string {
  const rev = extractReviews(p);
  if (!rev.length) return "";
  // kullanıcı sormadıysa teklif
  return "\n\nİstersen bu ürün için **yorumlardan 3–5 tanesini** gösterebilirim. “yorumları göster” yazman yeterli.";
}

/* =========================================================
   MEMORY (Firestore)
========================================================= */

async function loadMemory(shopId: string, sessionId: string): Promise<MemoryDoc> {
  const fallback: MemoryDoc = {
    userName: null,
    lastQuery: null,
    lastSeenProductId: null,
    lastSeenProductTitle: null,
    shownProductIds: [],
    updatedAt: Date.now(),
  };

  try {
    const snap = await getFirestore()
      .collection("magazalar")
      .doc(shopId)
      .collection("sessions")
      .doc(sessionId)
      .get();

    const data = snap.exists ? (snap.data() as Partial<MemoryDoc>) : {};
    return {
      ...fallback,
      ...data,
      shownProductIds: Array.isArray(data?.shownProductIds) ? data!.shownProductIds! : [],
    };
  } catch {
    return fallback;
  }
}

async function saveMemory(shopId: string, sessionId: string, mem: MemoryDoc) {
  try {
    await getFirestore()
      .collection("magazalar")
      .doc(shopId)
      .collection("sessions")
      .doc(sessionId)
      .set({ ...mem, updatedAt: Date.now() }, { merge: true });
  } catch {
    // ignore
  }
}

/* =========================================================
   SMALL TALK (random)
========================================================= */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectAndSaveName(message: string): string | null {
  // “benim adım Serhat”, “adım Serhat”, “ben Serhat”
  const raw = message.trim();
  const m1 = raw.match(/benim ad[ıi]m\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})/i);
  const m2 = raw.match(/\bad[ıi]m\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})/i);
  const m3 = raw.match(/\bben\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})\b/i);
  const name = (m1?.[1] || m2?.[1] || m3?.[1] || "").trim();
  if (!name) return null;
  // ilk harf büyük
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function smallTalkReply(msg: string, userName?: string | null): string {
  const t = n(msg);
  const name = userName ? ` ${userName}` : "";

  if (/(merhaba|selam|slm|hey|sa|selamun aleykum)/i.test(t)) {
    return pick([
      `Merhaba${name} 👋 Ne arıyorsun? (örn: gözlük, ayakkabı, kedi maması)`,
      `Selam${name} 😊 Bana aradığın ürünü yaz, mağazada bulup göstereyim.`,
      `Hoş geldin${name} 👋 Ürün mü arıyoruz, yoksa soru mu var?`,
      `Merhaba${name}! İstersen direkt “erkek gözlük”, “siyah termos” gibi yazabilirsin.`,
    ]);
  }

  if (/(nasilsin|naber|iyi misin|keyifler)/i.test(t)) {
    return pick([
      `İyiyim${name} 😊 Sen nasılsın? Bugün ne arıyoruz?`,
      `Buradayım${name} 😊 İstersen aradığın ürünü söyle, hemen bakayım.`,
      `İyiyim${name} 😄 Aklında bir ürün var mı? (örn: “kozmetik cilt”, “spor ayakkabı”)`,
    ]);
  }

  if (/(moralim bozuk|canim sikiliyor|kotu hissediyorum|uzgunum|stres)/i.test(t)) {
    return pick([
      `Bunu duyduğuma üzüldüm${name} 😔 İstersen biraz konuşalım… ya da kafanı dağıtacak ürünlere bakalım.`,
      `Ah be${name} 😔 İstersen neye moralin bozuldu anlat, ben buradayım.`,
      `Üzgün hissetmen normal${name}… İstersen küçük bir şey seçip kendine iyi gelecek bir alışverişe bakabiliriz.`,
    ]);
  }

  if (/(kimsin|bot musun|yapay zeka|asistan)/i.test(t)) {
    return pick([
      `Ben bu mağazanın asistanıyım 🤖 Ürünleri mağazanın kendi kayıtlarından arayıp bulurum.`,
      `Mağaza asistanıyım 🤖 Ne arıyorsan yaz, ürünleri direkt mağazada ararım.`,
      `Ben buradayım 🤖 Ürün bulma, fiyat/renk/beden gibi filtrelerle yardımcı olurum.`,
    ]);
  }

  return pick([
    `Tamam${name} 😊 Ne arıyorsun?`,
    `Anladım${name}. Aradığın ürünü yazarsan mağazada arayıp göstereyim.`,
    `Süper${name}. Ürün adı + varsa renk/beden yaz: “siyah gözlük”, “42 spor ayakkabı” gibi.`,
  ]);
}

/* =========================================================
   QUERY PARSING: ürün kelimeleri + filtre kelimeleri ayrımı
========================================================= */

function buildProductKeywords(msg: string, filters: ParsedFilters): string[] {
  const words = splitWords(msg);

  // filtre kelimeleri (cinsiyet/yaş/renk) ürün kelimelerine karışmasın
  const filterWords = new Set<string>();

  // gender words
  ["erkek", "bay", "kadin", "kadın", "bayan", "unisex"].forEach((x) => filterWords.add(n(x)));
  // age words
  ["bebek", "cocuk", "çocuk", "kiz", "kız", "genc", "genç", "yetiskin", "yetişkin", "yasli", "yaşlı"].forEach((x) =>
    filterWords.add(n(x))
  );
  // size words (çok sık gürültü yapıyor)
  ["xs", "s", "m", "l", "xl", "xxl", "xxxl"].forEach((x) => filterWords.add(n(x)));

  // color words (tüm varyasyonlar)
  for (const base in COLOR_SYNONYMS) {
    COLOR_SYNONYMS[base].forEach((v) => filterWords.add(n(v)));
  }

  // TL/lira
  ["tl", "lira", "₺"].forEach((x) => filterWords.add(n(x)));

  const keywords = words
    .map(n)
    .filter((w) => w.length >= 3)
    .filter((w) => !STOPWORDS.has(w))
    .filter((w) => !filterWords.has(w));

  // “ürün öner” gibi durumda keywords boş kalır
  return Array.from(new Set(keywords)).slice(0, 10);
}

/* =========================================================
   SEARCH: ZORUNLU ÜRÜN KELİMESİ KURALI + filtreler
========================================================= */

type SearchResult = {
  strictMatches: Product[];
  relaxedFilterMatches: Product[]; // ürün kelimesi aynı, filtre gevşetilmiş
};

function applyMustKeywordRule(products: Product[], mustTerms: string[]): Product[] {
  if (!mustTerms.length) return [];
  // ✅ kural: mustTerms’in en az 1 tanesi değil -> “ürün tipi kelimesi” gereklidir
  // Ama çok kelimeli (kozmetik cilt / kedi mamasi) gibi şeylerde daha sıkı:
  // - ilk 2 kelime (head) mutlaka geçsin
  const head = mustTerms.slice(0, 2);
  const tail = mustTerms.slice(2);

  return products.filter((p) => {
    const c = productCorpus(p);
    // head zorunlu
    if (!head.every((t) => c.includes(t))) return false;
    // tail varsa en az 1’i geçsin
    if (tail.length && !tail.some((t) => c.includes(t))) return false;
    return true;
  });
}

function applyFilters(list: Product[], filters: ParsedFilters): Product[] {
  let out = list;

  // renk (varsa)
  if (filters.colors.length) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      // seçilen renklerden en az biri geçsin
      return filters.colors.some((base) => {
        const variants = (COLOR_SYNONYMS[base] || [base]).map(n);
        return variants.some((v) => c.includes(v));
      });
    });
  }

  // gender (varsa) - çok sert yapmıyoruz, “erkek” geçmiyorsa eler
  if (filters.gender) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      // erkek/kadin/unisex kelimesini arıyoruz
      if (filters.gender === "erkek") return /(erkek|bay|men|mens)/i.test(c);
      if (filters.gender === "kadin") return /(kadin|kadın|bayan|women|womens)/i.test(c);
      if (filters.gender === "unisex") return /(unisex)/i.test(c);
      return true;
    });
  }

  // age group (varsa)
  if (filters.ageGroup) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      if (filters.ageGroup === "bebek") return /(bebek|baby|0-?3|0-?6)/i.test(c);
      if (filters.ageGroup === "cocuk") return /(cocuk|çocuk|kids|junior|erkek cocuk|kiz cocuk)/i.test(c);
      if (filters.ageGroup === "genc") return /(genc|genç|teen|ergen)/i.test(c);
      if (filters.ageGroup === "yasli") return /(yasli|yaşlı|senior)/i.test(c);
      if (filters.ageGroup === "yetiskin") return /(yetiskin|yetişkin|adult)/i.test(c);
      return true;
    });
  }

  // size (varsa)
  if (filters.size) {
    const sz = n(filters.size);
    out = out.filter((p) => productCorpus(p).includes(sz));
  }

  // max price (varsa)
  if (filters.maxPrice != null) {
    out = out.filter((p: any) => {
      const pn = parsePriceNumber(p.price);
      if (pn == null) return false;
      return pn <= filters.maxPrice!;
    });
  }

  return out;
}

function scoreProductByRelevance(p: Product, mustTerms: string[], originalMsg: string): number {
  const c = productCorpus(p);
  const title = n(p.title || "");
  let score = 0;

  // must terms: title’da geçiyorsa daha yüksek
  for (const t of mustTerms) {
    if (title.includes(t)) score += 30;
    else if (c.includes(t)) score += 12;
  }

  // “spor ayakkabı” gibi ek kelimeler varsa, bonus
  const extra = buildProductKeywords(originalMsg, parseFilters(originalMsg));
  for (const t of extra.slice(0, 6)) {
    if (title.includes(t)) score += 10;
    else if (c.includes(t)) score += 4;
  }

  // görsel + url
  if (pickBestImage(p)) score += 2;
  if ((p as any).url) score += 2;

  // fiyat varsa ufak stabilite bonus
  if (parsePriceNumber((p as any).price) != null) score += 1;

  return score;
}

function searchStoreProducts(
  message: string,
  allProducts: Product[],
  filters: ParsedFilters
): SearchResult {
  const mustTerms = buildProductKeywords(message, filters);

  // 0) ürün kelimesi yoksa (örn: “ürün öner”): strict yok
  if (!mustTerms.length) return { strictMatches: [], relaxedFilterMatches: [] };

  // 1) önce must keyword kuralı
  const mustMatched = applyMustKeywordRule(allProducts, mustTerms);

  // 2) filtreli liste
  const filtered = applyFilters(mustMatched, filters);

  // 3) filtre yüzünden ürün kalmadıysa: filtreyi gevşet ama mustTerms asla gevşemez
  const relaxed = mustMatched;

  const sortByScore = (list: Product[]) =>
    list
      .map((p) => ({ p, s: scoreProductByRelevance(p, mustTerms, message) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);

  return {
    strictMatches: sortByScore(filtered),
    relaxedFilterMatches: sortByScore(relaxed),
  };
}

/* =========================================================
   FORMAT
========================================================= */

function formatProducts(
  products: Product[],
  shown: Set<string>,
  limit = 5
): FrontProduct[] {
  const fresh = products.filter((p) => !shown.has(p.id));
  const final = (fresh.length ? fresh : products).slice(0, limit);

  final.forEach((p) => shown.add(p.id));

  return final.map((p) => ({
    id: p.id,
    title: p.title || "",
    price: String((p as any).price || ""),
    url: (p as any).url || "",
    imageUrl: pickBestImage(p),
  }));
}

/* =========================================================
   SPECIAL: color question about last product
========================================================= */

function isAskingColorVariant(msg: string): boolean {
  const t = n(msg);
  return /(rengi var mi|renk var mi|siyah var mi|beyaz var mi|kirmizi var mi|mavi var mi|yesil var mi|gri var mi|bej var mi|pembe var mi|mor var mi|sari var mi|turuncu var mi|kahverengi var mi)/i.test(
    t
  );
}

function extractAskedColors(msg: string): string[] {
  return detectColors(msg);
}

/* =========================================================
   MAIN
========================================================= */

export async function processChatMessage(
  shopId: string,
  sessionId: string,
  message: string
): Promise<ChatResult> {
  const msg = (message || "").trim();
  const scope: QuestionScope = detectQuestionScope(msg);

  // shopId yanlış gelirse: yine de kırmayalım ama ürün bulunmaz
  if (!shopId) {
    return { reply: "Mağaza bilgisi bulunamadı (shopId yok).", products: [] };
  }

  // memory
  const memory = await loadMemory(shopId, sessionId);

  // isim yakala
  const maybeName = detectAndSaveName(msg);
  if (maybeName) {
    memory.userName = maybeName;
    await saveMemory(shopId, sessionId, { ...memory, lastQuery: msg, updatedAt: Date.now() });
    return {
      reply: `Memnun oldum ${maybeName} 😊 Ne arıyorsun? (örn: “erkek gözlük”, “siyah termos”, “kedi maması”)`,
      products: [],
    };
  }

  // Empty
  if (scope === "EMPTY") {
    return { reply: "Merhaba 👋 Ne arıyorsun? (örn: gözlük, ayakkabı, kedi maması)", products: [] };
  }

  // Small talk / emotional
  if (scope === "SMALL_TALK" || scope === "EMOTIONAL") {
    return { reply: smallTalkReply(msg, memory.userName), products: [] };
  }

  // ürünleri çek
  const allProducts = await getProductsForShop(shopId);

  if (!allProducts || allProducts.length === 0) {
    // burası sende çok oluyorsa: /api/assistant/chat endpoint’i shopId’yi “chat” gönderiyor olabilir.
    // Postman body: { "shopId":"caylan", "sessionId":"x", "message":"..." } şeklinde gönder.
    return {
      reply:
        "Mağazada henüz ürün yok 😕\n" +
        "Ürünlerin Firestore’a geldiğinden ve doğru shopId ile okuduğumuzdan emin olalım.",
      products: [],
    };
  }

  const shown = new Set<string>(memory.shownProductIds || []);

  // “yorumları göster” gibi bir şeyse: son üründen yorum döndür
  if (wantsReviews(msg) && memory.lastSeenProductId) {
    const p = allProducts.find((x) => x.id === memory.lastSeenProductId) || null;
    if (!p) {
      return { reply: "Yorum gösterebilmem için önce bir ürün seçmemiz gerekiyor 😊", products: [] };
    }
    const rev = extractReviews(p);
    if (!rev.length) {
      return { reply: "Bu ürün için kaydedilmiş yorum bulamadım 😕", products: [] };
    }
    const short = rev.slice(0, 5).map((x) => `• ${String(x).slice(0, 240)}${String(x).length > 240 ? "..." : ""}`);
    return { reply: `🗣️ **${p.title}** için bazı yorumlar:\n\n${short.join("\n")}`, products: [] };
  }

  // “bu ürünün siyahı var mı?” gibi: son ürün + renk varyant araması
  if (isAskingColorVariant(msg) && memory.lastSeenProductTitle) {
    const askedColors = extractAskedColors(msg);
    if (!askedColors.length) {
      return { reply: "Hangi rengi arıyorsun? (örn: siyah, beyaz, mavi)", products: [] };
    }

    const baseTitle = n(memory.lastSeenProductTitle);
    const candidates = allProducts.filter((p) => n(p.title || "").includes(baseTitle.slice(0, Math.min(18, baseTitle.length)))); // kaba yakınlık
    const colorFiltered = applyFilters(candidates, { ...parseFilters(msg), colors: askedColors });

    if (!colorFiltered.length) {
      return {
        reply:
          `Bu ürün için **${askedColors.join(", ")}** rengi mağazada görünmüyor 😕\n` +
          "İstersen diğer renklerini gösterebilirim ya da başka bir model arayabiliriz.",
        products: [],
      };
    }

    const formatted = formatProducts(colorFiltered, shown, 5);
    memory.shownProductIds = Array.from(shown);
    memory.lastQuery = msg;
    await saveMemory(shopId, sessionId, memory);

    return {
      reply: `Bulduğum renk seçenekleri bunlar ✅`,
      products: formatted,
    };
  }

  // Genel arama (tam istediğin: müşteri ne yazarsa yazsın Firestore’da ara)
  const filters = parseFilters(msg);
  const { strictMatches, relaxedFilterMatches } = searchStoreProducts(msg, allProducts, filters);

  // “ürün öner” gibi: ürün kelimesi yoksa — mağazadan rastgele/son eklenen 5 ürün göster
  if (!buildProductKeywords(msg, filters).length) {
    // Son eklenenleri öne al (importedAt varsa)
    const sorted = [...allProducts].sort((a: any, b: any) => (b.importedAt || 0) - (a.importedAt || 0));
    const formatted = formatProducts(sorted, shown, 5);

    memory.lastQuery = msg;
    memory.shownProductIds = Array.from(shown);
    await saveMemory(shopId, sessionId, memory);

    return {
      reply:
        "Mağazadan birkaç ürün göstereyim 😊\n" +
        "Ama en iyi sonucu almak için şöyle yazabilirsin: **“erkek gözlük”**, **“siyah termos”**, **“kedi maması”**.",
      products: formatted,
    };
  }

  // Hiç ürün yoksa: dürüst cevap
  if (!strictMatches.length) {
    // filtre yüzünden mi boş?
    if (relaxedFilterMatches.length) {
      // ürün var ama filtreler çok dar
      const hintParts: string[] = [];
      if (filters.colors.length) hintParts.push(`renk: ${filters.colors.join(", ")}`);
      if (filters.gender) hintParts.push(`cinsiyet: ${filters.gender}`);
      if (filters.ageGroup) hintParts.push(`yaş: ${filters.ageGroup}`);
      if (filters.size) hintParts.push(`beden/numara: ${filters.size}`);
      if (filters.maxPrice != null) hintParts.push(`max fiyat: ${filters.maxPrice} TL`);

      const formatted = formatProducts(relaxedFilterMatches, shown, 5);

      // memory update (son görülen ürün: ilk ürün)
      const first = relaxedFilterMatches[0];
      memory.lastSeenProductId = first?.id || null;
      memory.lastSeenProductTitle = first?.title || null;
      memory.lastQuery = msg;
      memory.shownProductIds = Array.from(shown);
      await saveMemory(shopId, sessionId, memory);

      return {
        reply:
          `Aradığın ürünü buldum ama **${hintParts.join(" / ")}** filtreleriyle birebir eşleşen çıkmadı 😕\n` +
          "Filtreyi biraz gevşettim; şunlara bakabilirsin:",
        products: formatted,
      };
    }

    // ürün kelimesiyle hiç eşleşme yoksa: net “yok”
    memory.lastQuery = msg;
    await saveMemory(shopId, sessionId, memory);

    return {
      reply:
        `😕 Bu mağazada **"${msg}"** ile ilgili bir ürün bulamadım.\n` +
        "İstersen farklı bir kelimeyle dene (örn: “gözlük”, “termos”, “kedi maması”, “kozmetik cilt”).",
      products: [],
    };
  }

  // Bulduysak: sadece o ürün grubu (asla alakasız karışmaz)
  const formatted = formatProducts(strictMatches, shown, 5);

  // memory update
  const main = strictMatches[0];
  memory.lastSeenProductId = main?.id || null;
  memory.lastSeenProductTitle = main?.title || null;
  memory.lastQuery = msg;
  memory.shownProductIds = Array.from(shown);
  await saveMemory(shopId, sessionId, memory);

  const count = strictMatches.length;

  const reviewHint = wantsReviews(msg) ? "" : askIfWantsReviewsHint(main);

  return {
    reply:
      `✅ Bulduk: **${count}** ürün.\n` +
      (filters.colors.length || filters.gender || filters.ageGroup || filters.size || filters.maxPrice != null
        ? "Filtrelerine göre listeledim."
        : "İstersen renk/beden/fiyat da yaz, daha da netleştiririm.") +
      reviewHint,
    products: formatted,
  };
}

/* =========================================================
   COMPAT
========================================================= */

export async function getAssistantReply(
  shopId: string,
  sessionId: string,
  userMessage: string
): Promise<string> {
  const res = await processChatMessage(shopId, sessionId, userMessage);
  return res.reply;
}
