// src/services/assistantService.ts
// LLM YOK ✅ (tamamen kural + Firestore ürün/yorum verisi)
// Ama "LLM gibi" daha iyi konuşur ✅
// - Kombin önerisi (mağazadaki ürünlerden 2-3 kombin)
// - Ürün önerisi (rastgele değil: mağazadaki çeşitliliğe göre)
// - "nasıl giyilir/kullanılır" gibi sorularda rehber cevap + ilgili ürünleri deneme
// - Yorumları gösterme + kısa özet
// - Renk / cinsiyet / yaş / beden / fiyat filtreleri (yumuşak)
// - Cevaplar 3-4 cümle, seçenekli, soru soran bir asistan gibi

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
   NORMALIZE / HELPERS
========================================================= */

const n = (s: string) => normalizeText(s || "");

// küçük random (deterministik olmak istersen seed'li yaparız)
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

/* =========================================================
   STOPWORDS + TOKENIZE
========================================================= */

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
    "ya",
    "abi",
    "kanka",
    "yaaa",
    "şey",
    "sey",
  ].map(n)
);

function normalizeWord(word: string): string {
  return word
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/(lar|ler)$/i, "")
    .replace(/(im|ım|um|üm)$/i, "")
    .replace(/(in|ın|un|ün)$/i, "")
    .replace(/(yi|yı|yu|yü)$/i, "")
    .replace(/(si|sı|su|sü)$/i, "")
    .replace(/(de|da|te|ta)$/i, "")
    .replace(/(den|dan|ten|tan)$/i, "");
}

function splitWords(msg: string): string[] {
  return n(msg)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function tokenize(msg: string): string[] {
  const words = splitWords(msg)
    .map((w) => normalizeWord(w))
    .map(n)
    .filter((w) => w.length >= 2)
    .filter((w) => !STOPWORDS.has(w));

  // çok uzun olmasın
  return words.slice(0, 14);
}

/* =========================================================
   COLORS / FILTERS
========================================================= */

type ParsedFilters = {
  colors: string[];
  gender: "erkek" | "kadin" | "unisex" | null;
  ageGroup: "bebek" | "cocuk" | "genc" | "yetiskin" | "yasli" | null;
  size: string | null;
  maxPrice: number | null;
};

const COLOR_SYNONYMS: Record<string, string[]> = {
  siyah: ["siyah", "black", "kara", "antrasit", "füme", "fume", "koyu"],
  beyaz: ["beyaz", "white", "ekru", "krem"],
  kirmizi: ["kirmizi", "kırmızı", "red", "bordo", "visne", "vişne"],
  mavi: ["mavi", "blue", "lacivert", "indigo", "petrol", "turkuaz", "turkuaz"],
  yesil: ["yesil", "yeşil", "green", "haki", "zeytin", "mint"],
  gri: ["gri", "gray", "grey", "antrasit", "füme", "fume"],
  bej: ["bej", "beige", "camel", "kum"],
  pembe: ["pembe", "pink", "rose", "gul", "gül"],
  mor: ["mor", "purple", "lila", "lavanta"],
  sari: ["sari", "sarı", "yellow", "hardal"],
  turuncu: ["turuncu", "orange"],
  kahverengi: ["kahverengi", "brown", "taba", "vizyon"],
};

function detectColors(msg: string): string[] {
  const t = n(msg);
  const hits: string[] = [];
  for (const base of Object.keys(COLOR_SYNONYMS)) {
    const vars = COLOR_SYNONYMS[base].map(n);
    if (vars.some((v) => t.includes(v))) hits.push(n(base));
  }
  return uniq(hits);
}

function detectGenderAndAge(msg: string): { gender: ParsedFilters["gender"]; ageGroup: ParsedFilters["ageGroup"] } {
  const t = n(msg);

  let gender: ParsedFilters["gender"] = null;
  if (/(erkek|bay|mens|men)\b/i.test(t)) gender = "erkek";
  if (/(kadin|kadın|bayan|womens|women|lady)\b/i.test(t)) gender = "kadin";
  if (/(unisex)\b/i.test(t)) gender = "unisex";

  let ageGroup: ParsedFilters["ageGroup"] = null;
  if (/(bebek|baby|0-?3|0-?6|aylik|aylık)/i.test(t)) ageGroup = "bebek";
  else if (/(cocuk|çocuk|kids|junior|kiz cocuk|kız çocuk|erkek cocuk|erkek çocuk)/i.test(t)) ageGroup = "cocuk";
  else if (/(genc|genç|teen|ergen)/i.test(t)) ageGroup = "genc";
  else if (/(yasli|yaşlı|senior)/i.test(t)) ageGroup = "yasli";
  else if (/(yetiskin|yetişkin|adult)/i.test(t)) ageGroup = "yetiskin";

  return { gender, ageGroup };
}

function detectSize(msg: string): string | null {
  const up = msg.toUpperCase();
  const m = up.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/);
  if (m?.[1]) return m[1];

  const m2 = n(msg).match(/\b(34|35|36|37|38|39|40|41|42|43|44|45|46)\b/);
  if (m2?.[1]) return m2[1];

  return null;
}

function detectMaxPriceTL(msg: string): number | null {
  const t = msg.toLowerCase();
  const m = t.match(/(\d{2,6})\s*(tl|₺|lira)/i);
  if (!m) return null;
  const v = parseInt(m[1], 10);
  return Number.isFinite(v) ? v : null;
}

function parseFilters(msg: string): ParsedFilters {
  const colors = detectColors(msg);
  const { gender, ageGroup } = detectGenderAndAge(msg);
  const size = detectSize(msg);
  const maxPrice = detectMaxPriceTL(msg);
  return { colors, gender, ageGroup, size, maxPrice };
}

/* =========================================================
   PRODUCT CORPUS / IMAGE / PRICE
========================================================= */

function productCorpus(p: Product): string {
  const anyP: any = p as any;

  const parts = [
    p.title || "",
    anyP.description || "",
    anyP.aciklama || "",
    anyP.rawText || "",
    anyP.platform || "",
    anyP.brand || anyP.marka || "",
    JSON.stringify(anyP.attributes || {}),
    JSON.stringify(anyP.reviews || anyP.comments || anyP.yorumlar || []),
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
  if (Array.isArray(anyP.images)) for (const u of anyP.images) candidates.push(String(u));

  const clean = candidates.filter((u) => {
    const x = (u || "").toLowerCase();
    if (!x.startsWith("http")) return false;
    if (x.includes("sprite") || x.includes("icon") || x.includes("logo")) return false;
    if (x.endsWith(".svg") || x.endsWith(".gif")) return false;
    if (x.includes("placeholder")) return false;
    return true;
  });

  return clean[0] || "";
}

/* =========================================================
   REVIEWS
========================================================= */

function extractReviews(p: Product): string[] {
  const anyP: any = p as any;
  const r = anyP.reviews || anyP.comments || anyP.yorumlar || anyP.yorum || null;

  if (Array.isArray(r)) return r.map((x) => String(x)).filter(Boolean);
  if (typeof r === "string" && r.trim().length) return [r.trim()];

  return [];
}

function wantsReviews(msg: string): boolean {
  const t = n(msg);
  return /(yorum|yorumlar|degerlendirme|değerlendirme|puan|kullananlar|yorumlari|yorumları)/i.test(t);
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
      shownProductIds: Array.isArray(data?.shownProductIds) ? (data!.shownProductIds as string[]) : [],
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
   SMALL TALK + NAME
========================================================= */

function detectAndSaveName(message: string): string | null {
  const raw = message.trim();
  const m1 = raw.match(/benim ad[ıi]m\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})/i);
  const m2 = raw.match(/\bad[ıi]m\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})/i);
  const m3 = raw.match(/\bben\s+([A-Za-zÇĞİÖŞÜçğıöşü]{2,20})\b/i);
  const name = (m1?.[1] || m2?.[1] || m3?.[1] || "").trim();
  if (!name) return null;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function smallTalkReply(msg: string, userName?: string | null): string {
  const t = n(msg);
  const name = userName ? ` ${userName}` : "";

  if (/(merhaba|selam|slm|hey|sa|selamun aleykum)/i.test(t)) {
    return pick([
      `Merhaba${name} 👋 Bugün ne arıyorsun? İstersen ürün adı veya kategori yazabilirsin.`,
      `Selam${name}! Bana “siyah spor ayakkabı”, “matkap”, “kedi maması” gibi yaz, mağazada bulup göstereyim.`,
      `Hoş geldin${name} 😊 Ürün arayalım mı, yoksa kombin/öneri mi istersin?`,
    ]);
  }

  if (/(nasilsin|naber|iyi misin|keyifler)/i.test(t)) {
    return pick([
      `İyiyim${name} 😊 Teşekkürler. Ne bakıyorsun, birlikte bulalım.`,
      `Buradayım${name}. Ürün adı, renk, bütçe söylersen daha hızlı daraltırım.`,
      `Gayet iyi${name} 😄 Bugün alışverişte ne lazım?`,
    ]);
  }

  if (/(tesekkur|teşekkür|eyvallah|sagol|sağol)/i.test(t)) {
    return pick([
      `Rica ederim${name} 😊 İstersen başka bir şey daha arayabiliriz.`,
      `Ne demek${name}! İstersen bütçe/renk söyle, daha iyi seçenek çıkarayım.`,
      `Her zaman${name} 👋`,
    ]);
  }

  if (/(kimsin|bot musun|yapay zeka|asistan)/i.test(t)) {
    return pick([
      `Ben mağaza asistanıyım. Mağazanın ürünlerini ve varsa yorumlarını tarayıp sana uygun seçenekler çıkarıyorum.`,
      `Burada ürün bulma, filtreleme ve öneri konusunda yardımcı oluyorum. Ne arıyorsun?`,
    ]);
  }

  return pick([
    `Anladım${name}. Ne aradığını bir cümleyle yazman yeterli; ben mağazada arayıp seçenek çıkarayım.`,
    `Tamam${name} 😊 Ürün adı + varsa renk/beden/bütçe yazarsan daha iyi öneririm.`,
  ]);
}

/* =========================================================
   INTENT DETECTION (kombin / öneri / nasıl yapılır)
========================================================= */

function isOutfitIntent(msg: string): boolean {
  const t = n(msg);
  return /(kombin|outfit|stil öner|ne giysem|takım yap|uyumlu)/i.test(t);
}

function isRecommendIntent(msg: string): boolean {
  const t = n(msg);
  return /(urun oner|ürün öner|bana urun|bana ürün|onerir misin|önerir misin|öner|oner|populer|popüler)/i.test(t);
}

function isHowToIntent(msg: string): boolean {
  const t = n(msg);
  return /(nasil giyilir|nasıl giyilir|nasil kullanilir|nasıl kullanılır|nasil takilir|nasıl takılır|nasil temizlenir|nasıl temizlenir|beden nasil|beden nasıl|kalip nasil|kalıp nasıl|montaj|kurulum)/i.test(
    t
  );
}

/* =========================================================
   FEATURE EXTRACTION (basit, LLM yok)
========================================================= */

const FEATURE_KEYWORDS = [
  "ortopedik",
  "su geçirmez",
  "kaymaz",
  "hafif",
  "rahat",
  "esnek",
  "yüksek bel",
  "oversize",
  "slim fit",
  "regular fit",
  "pamuklu",
  "terletmez",
  "koku yapmaz",
  "sessiz",
  "az elektrik",
  "hızlı şarj",
  "kablosuz",
  "gürültü engelleme",
  "spf",
  "vegan",
  "sülfatsız",
  "paraben",
];

function extractHighlights(p: Product, max = 2): string[] {
  const c = productCorpus(p);
  const hits: string[] = [];
  for (const k of FEATURE_KEYWORDS) {
    const kk = n(k);
    if (kk && c.includes(kk)) hits.push(k);
    if (hits.length >= max) break;
  }
  return hits;
}

function formatPriceTL(p: Product): string {
  const anyP: any = p as any;
  const pn = parsePriceNumber(anyP.price);
  if (!pn) return "";
  // basit gösterim
  return `${pn} TL`;
}

/* =========================================================
   SEARCH (daha akıllı, uzantı/çekim toleranslı)
========================================================= */

function buildQueryTokens(msg: string): string[] {
  const raw = tokenize(msg);

  // “bayan ayakkabısı” -> “bayan ayakkabi” -> tokenlar: bayan, ayakkabi
  // biz ürün kelimesine odaklanmak için çok genel kelimeleri çıkarıyoruz
  const softStop = new Set(
    ["bana", "bir", "şey", "sey", "lazim", "lazım", "istiyorum", "oner", "öner", "kombin", "tarz", "nasıl", "nasil"].map(n)
  );

  const tokens = raw.filter((t) => !softStop.has(t));
  return tokens.slice(0, 10);
}

function applyFilters(list: Product[], filters: ParsedFilters): Product[] {
  let out = list;

  if (filters.colors.length) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      return filters.colors.some((base) => {
        const variants = (COLOR_SYNONYMS[base] || [base]).map(n);
        return variants.some((v) => c.includes(v));
      });
    });
  }

  if (filters.gender) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      if (filters.gender === "erkek") return /(erkek|bay|men|mens)/i.test(c);
      if (filters.gender === "kadin") return /(kadin|kadın|bayan|women|womens)/i.test(c);
      if (filters.gender === "unisex") return /(unisex)/i.test(c);
      return true;
    });
  }

  if (filters.ageGroup) {
    out = out.filter((p) => {
      const c = productCorpus(p);
      if (filters.ageGroup === "bebek") return /(bebek|baby)/i.test(c);
      if (filters.ageGroup === "cocuk") return /(cocuk|çocuk|kids|junior|kiz cocuk|erkek cocuk)/i.test(c);
      if (filters.ageGroup === "genc") return /(genc|genç|teen|ergen)/i.test(c);
      if (filters.ageGroup === "yasli") return /(yasli|yaşlı|senior)/i.test(c);
      if (filters.ageGroup === "yetiskin") return /(yetiskin|yetişkin|adult)/i.test(c);
      return true;
    });
  }

  if (filters.size) {
    const sz = n(filters.size);
    out = out.filter((p) => productCorpus(p).includes(sz));
  }

  if (filters.maxPrice != null) {
    out = out.filter((p: any) => {
      const pn = parsePriceNumber(p.price);
      return pn != null && pn <= filters.maxPrice!;
    });
  }

  return out;
}

function scoreProduct(p: Product, qTokens: string[]): number {
  const c = productCorpus(p);
  const title = n(p.title || "");
  let s = 0;

  for (const t of qTokens) {
    if (!t) continue;
    if (title.includes(t)) s += 18;
    else if (c.includes(t)) s += 7;
  }

  if (pickBestImage(p)) s += 2;
  if ((p as any).url) s += 2;
  if (parsePriceNumber((p as any).price) != null) s += 1;

  // çok alakasız uzun ürünlerde ufak ceza
  const len = title.length;
  if (len > 110) s -= 1;

  return s;
}

function searchStore(message: string, all: Product[], filters: ParsedFilters): Product[] {
  const qTokens = buildQueryTokens(message);

  if (!qTokens.length) return [];

  // 1) sıkı: hepsi geçsin
  let list = all.filter((p) => {
    const c = productCorpus(p);
    return qTokens.every((t) => c.includes(t));
  });

  // 2) gevşek: en az 1 geçsin
  if (!list.length) {
    list = all.filter((p) => {
      const c = productCorpus(p);
      return qTokens.some((t) => c.includes(t));
    });
  }

  // filtre uygula
  const filtered = applyFilters(list, filters);

  const final = (filtered.length ? filtered : list)
    .map((p) => ({ p, s: scoreProduct(p, qTokens) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

  return final;
}

/* =========================================================
   PRODUCT GROUPING (kombin için)
========================================================= */

type Group = "ayakkabi" | "ust" | "alt" | "dis" | "aksesuar" | "diger";

function detectGroup(p: Product): Group {
  const c = productCorpus(p);
  const t = n(p.title || "");

  const s = `${t} ${c}`;

  if (/(ayakkab|sneaker|stiletto|topuklu|bot|cizme|çizme|terlik|sandalet|krampon)/i.test(s)) return "ayakkabi";
  if (/(tisort|tişört|t-shirt|gomlek|gömlek|kazak|sweatshirt|hoodie|bluz|body|atlet)/i.test(s)) return "ust";
  if (/(pantolon|jean|kot|etek|sort|şort|tayt|esofman alt|eşofman alt)/i.test(s)) return "alt";
  if (/(mont|kaban|ceket|parka|trenckot|trençkot|hırka|hirka)/i.test(s)) return "dis";
  if (/(sapka|şapka|bere|atkı|atki|eldiven|canta|çanta|kemer|gozluk|gözlük|takı|taki|saat)/i.test(s)) return "aksesuar";

  return "diger";
}

function pickOutfitSets(all: Product[], filters: ParsedFilters): Product[][] {
  // filtreye uyan havuz
  const pool = applyFilters(all, filters);

  const byGroup = {
    ayakkabi: pool.filter((p) => detectGroup(p) === "ayakkabi"),
    ust: pool.filter((p) => detectGroup(p) === "ust"),
    alt: pool.filter((p) => detectGroup(p) === "alt"),
    dis: pool.filter((p) => detectGroup(p) === "dis"),
    aksesuar: pool.filter((p) => detectGroup(p) === "aksesuar"),
    diger: pool.filter((p) => detectGroup(p) === "diger"),
  };

  // kombin: (ust + alt + ayakkabı) veya (dis + alt + ayakkabı) gibi
  const outfits: Product[][] = [];

  function oneFrom(arr: Product[]) {
    if (!arr.length) return null;
    // importedAt varsa yeniyi öne çek
    const sorted = [...arr].sort((a: any, b: any) => (b.importedAt || 0) - (a.importedAt || 0));
    return sorted[0];
  }

  const top = oneFrom(byGroup.ust);
  const bottom = oneFrom(byGroup.alt);
  const shoe = oneFrom(byGroup.ayakkabi);
  const outer = oneFrom(byGroup.dis);
  const acc = oneFrom(byGroup.aksesuar);

  if (top && bottom && shoe) outfits.push([top, bottom, shoe].concat(acc ? [acc] : []));
  if (outer && bottom && shoe) outfits.push([outer, bottom, shoe].concat(acc ? [acc] : []));
  if (top && shoe) outfits.push([top, shoe].concat(acc ? [acc] : []));

  // yine azsa, havuzdan “en yeni 3” gibi bir set yap
  if (!outfits.length) {
    const sorted = [...pool].sort((a: any, b: any) => (b.importedAt || 0) - (a.importedAt || 0));
    if (sorted.length >= 3) outfits.push(sorted.slice(0, 3));
    else if (sorted.length) outfits.push(sorted.slice(0, Math.min(3, sorted.length)));
  }

  return outfits.slice(0, 3);
}

/* =========================================================
   FORMAT PRODUCTS + "tanıtım metni"
========================================================= */

function formatProducts(products: Product[], shown: Set<string>, limit = 5): FrontProduct[] {
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

function buildProductIntro(products: Product[]): string {
  if (!products.length) return "";

  // 1-2 ürüne mini tanıtım
  const top = products.slice(0, 2);
  const lines: string[] = [];

  for (const p of top) {
    const hi = extractHighlights(p, 2);
    const price = formatPriceTL(p);
    const anyP: any = p as any;
    const rating = anyP.rating ? String(anyP.rating) : "";
    const reviewCount = anyP.reviewCount ? String(anyP.reviewCount) : "";

    let meta = "";
    if (price) meta += ` Fiyat: ${price}.`;
    if (rating || reviewCount) {
      const r = rating ? `Puan: ${rating}` : "";
      const rc = reviewCount ? `Yorum: ${reviewCount}` : "";
      meta += ` ${[r, rc].filter(Boolean).join(" / ")}.`;
    }

    const feature = hi.length ? ` Öne çıkan: ${hi.join(", ")}.` : "";
    lines.push(`• ${p.title}.${feature}${meta}`.trim());
  }

  return lines.join("\n");
}

/* =========================================================
   "NASIL" SORULARI İÇİN CEVAP ŞABLONLARI
========================================================= */

function howToReply(userMsg: string, maybeProductType: string | null): string {
  const t = n(userMsg);

  // şapka özel
  if (/(sapka|şapka|bere)/i.test(t)) {
    return [
      "Şapka/berenin duruşu genelde yüz şekline ve kombin tarzına göre değişir.",
      "Daha doğal görünüm için şapkayı tam ortalamak yerine çok az yana kaydırabilir, arka kısmı hafif gevşek bırakabilirsin.",
      "Eğer saçını bastırmasını istemezsen iç kısmını çok sıkı yapmadan, kulak hizasının biraz üstünde konumlandırmak daha rahat olur.",
      "İstersen renk veya tarz (spor/klasik) söyle; mağazadaki uygun şapka seçeneklerini de çıkarayım.",
    ].join("\n");
  }

  // genel “nasıl kullanılır”
  if (/(nasil kullanilir|nasıl kullanılır|kurulum|montaj)/i.test(t)) {
    return [
      "Kısaca anlatayım: önce ürün tipini netleştirirsek en doğru adımları söyleyebilirim.",
      "Marka/model yazarsan daha da net olur; yoksa ben mağazadaki benzer ürünlerin açıklamalarına göre yönlendireyim.",
      "İstersen bana ‘ürün adı + varsa foto/bağlantı’ gibi yaz; ben burada mağaza ürünlerini bulup üzerinden gidelim.",
    ].join("\n");
  }

  // beden/kalıp
  if (/(beden|kalip|kalıp)/i.test(t)) {
    return [
      "Beden/kalıp konusunda iki şey önemli: ürünün kalıbı (dar/regular/oversize) ve kumaş/esneklik.",
      "Eğer normalde giydiğin beden/numarayı yazarsan, mağazadaki açıklama ve yorumlardan daha güvenli yönlendirebilirim.",
      "İstersen “boy/kilo + tercih (dar mı rahat mı)” yaz; ben de sana daha net seçenek çıkarayım.",
    ].join("\n");
  }

  // fallback
  return [
    "Bunu netleştirelim: ürün tipini (örnek: şapka, ayakkabı, mont, matkap gibi) yazarsan doğru şekilde anlatayım.",
    "Ben mağazadaki ürün açıklamalarına ve varsa yorumlara bakarak pratik bir yönlendirme yapabilirim.",
    "İstersen şimdi hangi üründen bahsettiğini söyle; ben de uygun ürünleri listeleyeyim.",
  ].join("\n");
}

/* =========================================================
   MAIN
========================================================= */

export async function processChatMessage(shopId: string, sessionId: string, message: string): Promise<ChatResult> {
  const msg = (message || "").trim();
  const scope: QuestionScope = detectQuestionScope(msg);

  if (!shopId) {
    return {
      reply: "Mağaza bilgisi eksik görünüyor. Biraz sonra tekrar dener misin?",
      products: [],
    };
  }

  // ✅ MEMORY EN BAŞTA
  const memory = await loadMemory(shopId, sessionId);

  // 🔹 Kararsız / yönlendirme cümleleri
  const GUIDANCE_PATTERNS =
    /(kararsız|ne alacağımı bilmiyorum|emin değilim|önerir misin|ne önerirsin|fikir ver|yardımcı olur musun)/i;

  if (GUIDANCE_PATTERNS.test(msg)) {
    return {
      reply:
        "Sorun değil 🙂 Sana daha iyi yardımcı olmam için birkaç kısa soru sorayım:\n\n" +
        "• Ne için kullanacaksın? (ev / iş / günlük / hediye)\n" +
        "• Yaklaşık bir bütçe var mı?\n" +
        "• Spor mu, şık mı, yoksa fark etmez mi?\n\n" +
        "Bunlardan birini yazman yeterli.",
      products: [],
    };
  }

  // 🔹 Değerlendirme / kullanım senaryosu soruları
  const EVALUATION_PATTERNS = /(buna değer mi|ofiste kullanılır mı|ev için uygun mu|iş görür mü|alınır mı|mantıklı mı)/i;

  if (EVALUATION_PATTERNS.test(msg) && memory.lastSeenProductTitle) {
    return {
      reply:
        `Bu ürünle ilgili kısa bir değerlendirme yapayım 👇\n\n` +
        `• **Kullanım alanı:** Günlük ve ofis için uygun.\n` +
        `• **Artıları:** Pratik, rahat ve fiyatına göre dengeli.\n` +
        `• **Kimler için uygun:** Günlük kullanım isteyenler.\n\n` +
        `İstersen benzer ama farklı bir alternatif de önerebilirim.`,
      products: [],
    };
  }

  // 🔹 Uyum soruları (iphone / android / uyumlu mu)
  const COMPATIBILITY_PATTERNS = /(iphone|android|uyumlu mu|uyar mı|olur mu)/i;

  if (COMPATIBILITY_PATTERNS.test(msg) && memory.lastSeenProductTitle) {
    return {
      reply:
        `Bu ürünün **${memory.lastSeenProductTitle}** modeli için konuşursak:\n\n` +
        "• iPhone için özel tasarlanmış bir ürün değilse genelde uyum bilgisi ürün açıklamasında yazar.\n" +
        "• Aksesuar ise (kılıf, kablo, adaptör) modelini netleştirmen iyi olur.\n\n" +
        "İstersen ben mağazadaki **iPhone uyumlu** ürünleri ayrıca süzebilirim.",
      products: [],
    };
  }

  // isim yakala
  const maybeName = detectAndSaveName(msg);
  if (maybeName) {
    memory.userName = maybeName;
    memory.lastQuery = msg;
    await saveMemory(shopId, sessionId, memory);
    return {
      reply: `Memnun oldum ${maybeName} 😊\nBugün ne arıyorsun? İstersen ürün adı, renk, bütçe ya da “kombin öner” diye yazabilirsin.`,
      products: [],
    };
  }

  // empty
  if (scope === "EMPTY") {
    return {
      reply: "Merhaba 👋\nNe arıyorsun? Ürün adı yazabilirsin (örnek: ayakkabı, gözlük, matkap) ya da “kombin öner” diyebilirsin.",
      products: [],
    };
  }

  // small talk / emotional
  if (scope === "SMALL_TALK" || scope === "EMOTIONAL") {
    return { reply: smallTalkReply(msg, memory.userName), products: [] };
  }

  const allProducts = await getProductsForShop(shopId);

  if (!allProducts || allProducts.length === 0) {
    return {
      reply: "Şu an bu mağazada ürün kaydı göremedim.\nÜrünler Firestore’a geldiyse, shopId ile doğru mağazayı okuduğumuzdan emin olalım.",
      products: [],
    };
  }

  const shown = new Set<string>(memory.shownProductIds || []);
  const filters = parseFilters(msg);

  // 1) yorum isteği -> son üründen göster
  if (wantsReviews(msg) && memory.lastSeenProductId) {
    const p = allProducts.find((x) => x.id === memory.lastSeenProductId) || null;
    if (!p) return { reply: "Yorum gösterebilmem için önce bir ürün seçmemiz gerekiyor 😊", products: [] };

    const rev = extractReviews(p);
    if (!rev.length) return { reply: "Bu ürün için kaydedilmiş yorum bulamadım.", products: [] };

    const top = rev.slice(0, 5).map((x) => `• ${String(x).slice(0, 240)}${String(x).length > 240 ? "..." : ""}`);
    return {
      reply: `İşte ${p.title} için bazı yorumlar:\n\n${top.join("\n")}\n\nİstersen “daha fazla yorum” yaz, biraz daha çıkarayım.`,
      products: [],
    };
  }

  // 2) “kombin öner”
  if (isOutfitIntent(msg)) {
    const outfits = pickOutfitSets(allProducts, filters);

    if (!outfits.length || !outfits[0].length) {
      return {
        reply:
          "Kombin çıkarmak için mağazada yeterli parça göremedim.\n" +
          "İstersen “kadın/erkek + tarz (spor/şık) + renk” yaz; ben yine de benzer ürünlerle bir öneri yapayım.",
        products: [],
      };
    }

    // ürünleri tek listede gösterelim (UI tek seferde kart bassın)
    const flat = uniq(outfits.flat().map((p) => p.id))
      .map((id) => allProducts.find((x) => x.id === id)!)
      .filter(Boolean);
    const formatted = formatProducts(flat, shown, 8);

    // reply: 3-4 cümle, 2-3 kombin başlığı
    const lines: string[] = [];
    lines.push("Tamam, mağazadaki ürünlerden birkaç kombin fikri çıkardım.");
    lines.push("İstersen tarzını söyle (spor/şık/günlük) veya bir renk seç, daha da netleştireyim.");

    const comboTitles: string[] = [];
    outfits.slice(0, 3).forEach((set, i) => {
      const names = set.slice(0, 4).map((p) => p.title).filter(Boolean);
      if (names.length) comboTitles.push(`${i + 1}) ${names.slice(0, 3).join(" + ")}`);
    });

    if (comboTitles.length) {
      lines.push("");
      lines.push("Önerdiğim kombinler:");
      lines.push(comboTitles.join("\n"));
    }

    // memory update
    const main = flat[0];
    memory.lastSeenProductId = main?.id || null;
    memory.lastSeenProductTitle = main?.title || null;
    memory.lastQuery = msg;
    memory.shownProductIds = Array.from(shown);
    await saveMemory(shopId, sessionId, memory);

    return {
      reply: lines.join("\n"),
      products: formatted,
    };
  }

  // 3) “ürün öner” (ürün adı yoksa mağazadan çeşitli seçim)
  if (isRecommendIntent(msg) && buildQueryTokens(msg).length <= 1) {
    // çeşitlilik için gruplardan seç
    const pool = applyFilters(allProducts, filters);
    const grouped: Record<Group, Product[]> = {
      ayakkabi: [],
      ust: [],
      alt: [],
      dis: [],
      aksesuar: [],
      diger: [],
    };

    for (const p of pool) grouped[detectGroup(p)].push(p);

    const pickFrom = (g: Group) => {
      const arr = grouped[g];
      if (!arr.length) return null;
      const sorted = [...arr].sort((a: any, b: any) => (b.importedAt || 0) - (a.importedAt || 0));
      return sorted[0];
    };

    const picks = [
      pickFrom("ayakkabi"),
      pickFrom("ust"),
      pickFrom("alt"),
      pickFrom("aksesuar"),
      pickFrom("dis"),
      pickFrom("diger"),
    ].filter(Boolean) as Product[];

    const formatted = formatProducts(picks.length ? picks : pool, shown, 6);

    const reply = [
      "Tabii. Mağazadan öne çıkan birkaç ürün çıkardım.",
      "Bütçe aralığın, tarzın (spor/şık) veya renk tercihin varsa yaz; daha hedefli öneririm.",
      "İstersen “sadece ayakkabı” ya da “hediye” gibi de söyleyebilirsin.",
    ].join("\n");

    const main = (picks[0] || pool[0]) as Product | undefined;
    memory.lastSeenProductId = main?.id || null;
    memory.lastSeenProductTitle = main?.title || null;
    memory.lastQuery = msg;
    memory.shownProductIds = Array.from(shown);
    await saveMemory(shopId, sessionId, memory);

    return { reply, products: formatted };
  }

  // 4) “nasıl giyilir/kullanılır” gibi soru
  if (isHowToIntent(msg)) {
    // önce ürün aramayı deneyelim (mesajda ürün adı geçiyorsa)
    const found = searchStore(msg, allProducts, filters);
    const formatted = found.length ? formatProducts(found, shown, 4) : [];

    // ürün tipi çıkar (çok kaba)
    const tokens = buildQueryTokens(msg);
    const maybeType = tokens.length ? tokens[0] : null;

    const replyLines: string[] = [];
    replyLines.push(howToReply(msg, maybeType));

    if (found.length) {
      replyLines.push("");
      replyLines.push("Bu soruya yakın ürünler de şunlar (istersen birini seç, üzerinden daha net anlatayım):");
      replyLines.push(buildProductIntro(found.slice(0, 3)));
    } else {
      replyLines.push("");
      replyLines.push("Şunu yapalım: ürün adını biraz netleştir (örnek: şapka, ayakkabı, mont, matkap gibi).");
      replyLines.push("Ben de mağazada bulup, açıklama ve varsa yorumlara göre daha net yönlendireyim.");
    }

    // memory update
    if (found[0]) {
      memory.lastSeenProductId = found[0].id || null;
      memory.lastSeenProductTitle = found[0].title || null;
    }
    memory.lastQuery = msg;
    memory.shownProductIds = Array.from(shown);
    await saveMemory(shopId, sessionId, memory);

    return { reply: replyLines.join("\n"), products: formatted };
  }

  // 5) normal arama (müşteri ne yazarsa Firestore’da ara)
  const found = searchStore(msg, allProducts, filters);

  if (!found.length) {
    // burada artık robot gibi tek cümle değil: yönlendiren, seçenekli
    const name = memory.userName ? ` ${memory.userName}` : "";
    const tokens = buildQueryTokens(msg);

    // kullanıcı “kombin” ya da “öner” gibi diyorsa ama intent yakalanmadıysa
    if (/(kombin|oner|öner|tarz)/i.test(n(msg))) {
      return {
        reply:
          `Anladım${name}.\n` +
          "Bunu daha iyi yapabilmem için 1-2 detay lazım: kadın/erkek, tarz (spor/şık/günlük) ve mümkünse bütçe.\n" +
          "İstersen direkt şöyle yaz: “kadın spor kombin 1500 TL” veya “erkek şık kombin siyah”.",
        products: [],
      };
    }

    // hiç token yoksa: ürün öner gibi davran
    if (!tokens.length) {
      const sorted = [...allProducts].sort((a: any, b: any) => (b.importedAt || 0) - (a.importedAt || 0));
      const formatted = formatProducts(sorted, shown, 6);

      memory.lastQuery = msg;
      memory.shownProductIds = Array.from(shown);
      await saveMemory(shopId, sessionId, memory);

      return {
        reply:
          "Tamam. Mağazadan birkaç ürün göstereyim.\n" +
          "Ama daha iyi sonuç için ürün tipi söylemen yeterli (örnek: ayakkabı, gözlük, matkap, nemlendirici).\n" +
          "Renk veya bütçe de yazarsan daha hızlı daraltırım.",
        products: formatted,
      };
    }

    return {
      reply:
        `Bu mağazada "${msg}" ile eşleşen bir ürün bulamadım.\n` +
        "İstersen ürün tipini daha kısa yaz (örnek: “şapka”, “ayakkabı”, “gözlük”, “matkap”).\n" +
        "Renk, bütçe veya kadın/erkek gibi bir detay eklersen ben de daha net arayıp seçenek çıkarayım.",
      products: [],
    };
  }

  // 6) ürün bulduk: daha zengin cevap + tanıtım + seçenek sorusu
  const formatted = formatProducts(found, shown, 5);
  const count = found.length;

  const intro = buildProductIntro(found);

  const askNext = pick([
    "İstersen renk, beden/numara veya bütçe söyle; listeyi daha da daraltayım.",
    "Bütçe aralığın var mı? Ona göre en iyi 3 seçeneği çıkarabilirim.",
    "Daha çok spor mu yoksa şık mı istersin? Tarzına göre ayıklayabilirim.",
  ]);

  const main = found[0];
  const hasReviews = extractReviews(main).length > 0;

  const replyParts: string[] = [];
  replyParts.push(`Bulduk: ${count} ürün.`);
  replyParts.push("İlk seçeneklerden kısa bir özet bırakıyorum:");
  if (intro) replyParts.push(intro);
  replyParts.push("");
  replyParts.push(askNext);
  if (hasReviews && !wantsReviews(msg)) {
    replyParts.push("Bu ürünlerin bazılarında yorum var. İstersen “yorumları göster” yaz, 3-5 tanesini çıkarayım.");
  }

  // memory update
  memory.lastSeenProductId = main?.id || null;
  memory.lastSeenProductTitle = main?.title || null;
  memory.lastQuery = msg;
  memory.shownProductIds = Array.from(shown);
  await saveMemory(shopId, sessionId, memory);

  return { reply: replyParts.join("\n"), products: formatted };
}

/* =========================================================
   COMPAT
========================================================= */

export async function getAssistantReply(shopId: string, sessionId: string, userMessage: string): Promise<string> {
  const res = await processChatMessage(shopId, sessionId, userMessage);
  return res.reply;
}
