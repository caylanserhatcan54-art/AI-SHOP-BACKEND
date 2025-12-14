import { Router } from "express";
import { db } from "../config/firebaseAdmin.js";
import type { UniversalProduct } from "../types/UniversalProduct";

const router = Router();

function normalizeTR(s: string) {
  return s
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim();
}

function cleanSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function filterRealImages(images: any[]): string[] {
  const arr = Array.isArray(images) ? images.map(String) : [];
  const cleaned = arr
    .filter(u => u.startsWith("http"))
    .filter(u => !u.includes("sprite"))
    .filter(u => !u.includes("icon"))
    .filter(u => !u.includes("pixel"))
    .filter(u => !u.includes("loading"))
    // platform bağımsız: ürün görseli patternleri
    .filter(u =>
      u.includes("/images/I/") ||            // amazon
      u.includes("cdn.dsmcdn.com") ||        // trendyol
      u.includes("productimages.hepsiburada") ||
      u.includes("n11scdn") ||
      u.includes("ciceksepeti") ||
      u.includes("cdn.shopify.com") ||
      u.includes("ikas") ||
      u.includes("shopier")
    );

  // benzersiz + ilk 8
  return Array.from(new Set(cleaned)).slice(0, 8);
}

function detectCategory(text: string): string {
  const t = normalizeTR(text);

  if (t.includes("tshirt") || t.includes("tişört") || t.includes("t-shirt")) return "tshirt";
  if (t.includes("kazak") || t.includes("triko") || t.includes("hirka") || t.includes("hırka")) return "kazak";
  if (t.includes("mont") || t.includes("kaban") || t.includes("parka") || t.includes("ceket")) return "mont";
  if (t.includes("pantolon") || t.includes("jean") || t.includes("kot")) return "pantolon";
  if (t.includes("ayakkabi") || t.includes("ayakkabı") || t.includes("sneaker") || t.includes("bot")) return "ayakkabi";

  if (t.includes("bardak") || t.includes("kupa") || t.includes("mug") || t.includes("fincan") || t.includes("termos") || t.includes("matara")) return "bardak";
  if (t.includes("tencere") || t.includes("tava") || t.includes("granit") || t.includes("döküm") || t.includes("dokum") || t.includes("celik") || t.includes("çelik")) return "tencere";

  if (t.includes("kedi maması") || t.includes("kedi mamasi")) return "kedi-mamasi";
  if (t.includes("köpek maması") || t.includes("kopek mamasi") || t.includes("köpek mamasi")) return "kopek-mamasi";

  return "diger";
}

function extractBasicAttributes(text: string): UniversalProduct["attributes"] {
  const t = normalizeTR(text);

  const attributes: UniversalProduct["attributes"] = {};

  // gender
  if (t.includes("erkek")) attributes.gender = "erkek";
  else if (t.includes("kadin") || t.includes("kadın")) attributes.gender = "kadin";
  else if (t.includes("unisex")) attributes.gender = "unisex";
  else if (t.includes("cocuk") || t.includes("çocuk")) attributes.gender = "cocuk";

  // brand (basit): “X store'u ziyaret edin” gibi kalıplarda yakalamaya çalış
  const brandMatch = text.match(/([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9&.\- ]{2,})\s+(Store'u ziyaret edin|store'u ziyaret edin|Store’u ziyaret edin|Store’u)/);
  if (brandMatch?.[1]) attributes.brand = cleanSpaces(brandMatch[1]);

  // color
  const colors = ["siyah","beyaz","kirmizi","kırmızı","mavi","yesil","yeşil","gri","bej","pembe","mor","lacivert","kahverengi","turuncu","sari","sarı"];
  const col = colors.find(c => t.includes(`renk: ${c}`) || t.includes(`renk ${c}`) || t.includes(` ${c} `));
  if (col) attributes.color = col;

  // size options (S M L XL XXL) – rawText içinden yakala
  const sizeOps = Array.from(new Set((text.match(/\bXS\b|\bS\b|\bM\b|\bL\b|\bXL\b|\bXXL\b|\b36\b|\b38\b|\b40\b|\b42\b|\b44\b/g) || []).map(s => s.trim())));
  if (sizeOps.length) attributes.sizeOptions = sizeOps;

  // material
  if (t.includes("organik pamuk")) attributes.material = "organik pamuk";
  else if (t.includes("pamuk")) attributes.material = "pamuk";
  else if (t.includes("polyester")) attributes.material = "polyester";
  else if (t.includes("deri")) attributes.material = "deri";
  else if (t.includes("cam")) attributes.material = "cam";
  else if (t.includes("plastik")) attributes.material = "plastik";
  else if (t.includes("celik") || t.includes("çelik")) attributes.material = "çelik";

  // capacity
  const cap = t.match(/(\d{2,5})\s*(ml|l|lt|litre)\b/);
  if (cap) attributes.capacity = `${cap[1]} ${cap[2]}`;

  return attributes;
}

function extractPrice(rawText: string): { price?: number; priceText?: string } {
  const t = rawText || "";
  // 162,91 TL / 1.218,23TL
  const m = t.match(/(\d{1,3}(\.\d{3})*),(\d{2})\s*tl/i);
  if (!m) return {};
  const whole = m[1].replace(/\./g, "");
  const dec = m[3];
  const num = Number(`${whole}.${dec}`);
  if (Number.isNaN(num)) return {};
  return { price: num, priceText: `${m[1]},${dec} TL` };
}

function buildKeywords(p: Pick<UniversalProduct, "title" | "category" | "attributes" | "description">): string[] {
  const s = `${p.title} ${p.category} ${p.description || ""} ${Object.values(p.attributes || {}).join(" ")}`;
  const tokens = normalizeTR(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => w.length >= 3);

  return Array.from(new Set(tokens)).slice(0, 120);
}

function normalizeProductBody(body: any): UniversalProduct {
  const title = String(body.title || "").trim();
  const rawText = String(body.rawText || body["ham metin"] || "").trim();
  const platform = String(body.platform || "Unknown").trim();
  const id = String(body.productId || body["ürün kimliği"] || body.id || "").trim();
  const url = body.url ? String(body.url) : undefined;

  const joinedText = `${title} ${rawText}`;
  const category = detectCategory(joinedText);
  const attributes = extractBasicAttributes(joinedText);

  const priceInfo = extractPrice(rawText);

  // description: ham metinden ilk mantıklı bölüm
  const description = cleanSpaces(rawText).slice(0, 600);

  const images = filterRealImages(body.images || body.imageUrls || []);
  const importedAt = typeof body.importedAt === "number" ? body.importedAt : Date.now();

  const product: UniversalProduct = {
    id,
    platform,

    title: title || "(başlık yok)",
    description,

    url,

    category,
    categoryPath: category === "diger" ? ["genel", "diger"] : ["genel", category],

    attributes,

    price: priceInfo.price,
    priceText: body.priceText ? String(body.priceText) : priceInfo.priceText,
    currency: "TRY",

    images,

    rating: undefined,
    reviewCount: undefined,

    keywords: [],

    importedAt,
  };

  product.keywords = buildKeywords(product);

  return product;
}

// POST /api/product/:shopId
router.post("/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!shopId) return res.status(400).json({ error: "shopId gerekli" });

    const product = normalizeProductBody(req.body);

    if (!product.id || product.id.length < 3) {
      return res.status(400).json({ error: "productId (ürün kimliği) gerekli" });
    }

    await db

      .collection("magazalar")
      .doc(shopId)
      .collection("urunler")
      .doc(product.id)
      .set(product, { merge: true });

    return res.json({ success: true, savedId: product.id, category: product.category });
  } catch (e: any) {
    console.error("product import error:", e);
    return res.status(500).json({ error: "import_error", detail: e?.message || "unknown" });
  }
});

export default router;
