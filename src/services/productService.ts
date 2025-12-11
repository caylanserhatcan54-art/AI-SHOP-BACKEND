// src/services/productService.ts
import firestoreAdmin from "../config/firebase-admin.js";
export interface Product {
  id: string;
  title: string;
  price?: string;
  url?: string;
  imageUrl?: string;
  platform?: string;
  category?: string;
  color?: string;
  materialGuess?: string;
  brandGuess?: string;
  rawData?: any;
}

/**
 * Basit normalize: küçük harf, aksan vs temizleme
 */
export function normalizeText(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    // Türkçe karakter dönüştürme
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    // Gereksiz karakterleri temizle
    .replace(/[^a-z0-9\s]/g, " ")
    // Boşlukları düzenle
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Başlıktan renk tahmini
 */
export function detectColorFromTitle(title: string): string | undefined {
  const t = normalizeText(title);

  const colors: { keyword: string; label: string }[] = [
    { keyword: "siyah", label: "siyah" },
    { keyword: "black", label: "siyah" },
    { keyword: "beyaz", label: "beyaz" },
    { keyword: "white", label: "beyaz" },
    { keyword: "kirmizi", label: "kırmızı" },
    { keyword: "red", label: "kırmızı" },
    { keyword: "mavi", label: "mavi" },
    { keyword: "blue", label: "mavi" },
    { keyword: "lacivert", label: "lacivert" },
    { keyword: "navy", label: "lacivert" },
    { keyword: "yesil", label: "yeşil" },
    { keyword: "green", label: "yeşil" },
    { keyword: "gri", label: "gri" },
    { keyword: "gray", label: "gri" },
    { keyword: "pembe", label: "pembe" },
    { keyword: "pink", label: "pembe" },
    { keyword: "mor", label: "mor" },
    { keyword: "turuncu", label: "turuncu" },
    { keyword: "orange", label: "turuncu" },
    { keyword: "kahverengi", label: "kahverengi" },
    { keyword: "brown", label: "kahverengi" },
    { keyword: "bej", label: "bej" },
    { keyword: "beige", label: "bej" },
    { keyword: "altin", label: "altın" },
    { keyword: "gold", label: "altın" },
    { keyword: "gumus", label: "gümüş" },
    { keyword: "silver", label: "gümüş" },
  ];

  for (const c of colors) {
    if (t.includes(c.keyword)) return c.label;
  }

  return undefined;
}

/**
 * Başlıktan kategori tahmini (giyim, ayakkabı, elektronik, oyuncak, kamp, hırdavat, vb.)
 */
export function detectCategoryFromTitle(title: string): string {
  const t = normalizeText(title);

  if (
    t.includes("polo") ||
    t.includes("tisort") ||
    t.includes("t shirt") ||
    t.includes("gomlek") ||
    t.includes("kaban") ||
    t.includes("mont") ||
    t.includes("kazak") ||
    t.includes("etek") ||
    t.includes("elbise") ||
    t.includes("pantolon") ||
    t.includes("ceket")
  ) {
    return "giyim";
  }

  if (
    t.includes("ayakkabi") ||
    t.includes("sneaker") ||
    t.includes("bot") ||
    t.includes("sandalet") ||
    t.includes("terlik")
  ) {
    return "ayakkabi";
  }

  if (
    t.includes("laptop") ||
    t.includes("notebook") ||
    t.includes("bilgisayar") ||
    t.includes("monitor") ||
    t.includes("klavye") ||
    t.includes("mouse") ||
    t.includes("telefon") ||
    t.includes("smartphone") ||
    t.includes("kulaklik") ||
    t.includes("televizyon") ||
    t.includes("tv") ||
    t.includes("tablet") ||
    t.includes("ssd") ||
    t.includes("ram")
  ) {
    return "elektronik";
  }

  if (
    t.includes("oyuncak") ||
    t.includes("lego") ||
    t.includes("bebek") ||
    t.includes("figur") ||
    t.includes("araba oyuncak")
  ) {
    return "oyuncak";
  }

  if (
    t.includes("cadir") ||
    t.includes("kamp") ||
    t.includes("mat") ||
    t.includes("uyku tulumu") ||
    t.includes("tirmik") ||
    t.includes("outdoor") ||
    t.includes("trekking")
  ) {
    return "kamp-outdoor";
  }

  if (
    t.includes("matar") ||
    t.includes("su sporu") ||
    t.includes("dalis") ||
    t.includes("maske") ||
    t.includes("palet") ||
    t.includes("can yelek")
  ) {
    return "su-sporlari";
  }

  if (
    t.includes("matkap") ||
    t.includes("vida") ||
    t.includes("tornavida") ||
    t.includes("anahtar takimi") ||
    t.includes("hirdavat") ||
    t.includes("pense") ||
    t.includes("civi")
  ) {
    return "hirdavat";
  }

  if (
    t.includes("top") ||
    t.includes("forma") ||
    t.includes("spor") ||
    t.includes("dumbbell") ||
    t.includes("kosu bandi") ||
    t.includes("fitness")
  ) {
    return "spor";
  }

  // Default: genel
  return "genel";
}

/**
 * Baslıktan materyal/kalite hakkında tahmini yorum etiketi
 */
export function detectMaterialGuess(title: string): string | undefined {
  const t = normalizeText(title);

  if (t.includes("pamuk") || t.includes("cotton")) {
    return "Pamuk ağırlıklı, yumuşak ve nefes alabilen bir kumaş gibi duruyor.";
  }

  if (t.includes("polyester")) {
    return "Polyester ağırlıklı, dayanıklı ve kolay kırışmayan bir yapıda görünüyor.";
  }

  if (t.includes("deri") || t.includes("leather")) {
    return "Deri yapıda, uzun ömürlü ve şık bir ürün gibi duruyor.";
  }

  if (
    t.includes("celik") ||
    t.includes("steel") ||
    t.includes("aluminyum") ||
    t.includes("aluminium")
  ) {
    return "Metal/çelik malzemeden, sağlam ve dayanıklı bir ürün gibi görünüyor.";
  }

  return undefined;
}

/**
 * Marka tahmini (çok basic, baştaki kelimeden vb.)
 */
export function detectBrandGuess(title: string): string | undefined {
  const firstWord = (title || "").split(" ")[0];
  if (!firstWord) return undefined;

  // Under Armour, Nike, Samsung gibi markalar genelde başta olur
  if (firstWord.length > 2 && firstWord[0] === firstWord[0].toUpperCase()) {
    return firstWord;
  }

  return undefined;
}

/**
 * Mağazaya ait TÜM platformlardaki ürünleri çeker:
 * /magazalar/{shopId}/platformlar/{platform}/urunler/*
 */
export async function getProductsForShop(shopId: string): Promise<Product[]> {
  const platforms = ["trendyol", "hepsiburada", "n11", "amazon", "amazontr", "ciceksepeti"];

  const products: Product[] = [];

  for (const platform of platforms) {
    const snap = await firestoreAdmin
      .collection("magazalar")
      .doc(shopId)
      .collection("platformlar")
      .doc(platform)
      .collection("urunler")
      .get();

    snap.forEach((doc) => {
      const data = doc.data() || {};

      const title: string = data.baslik || data.title || "";
      const price: string | undefined = data.fiyat || data.price;
      const url: string | undefined = data.URL || data.url;
      const imageUrl: string | undefined =
        data.image || data.imageUrl || data.image_url || data.images;

      const category = detectCategoryFromTitle(title);
      const color = detectColorFromTitle(title);
      const materialGuess = detectMaterialGuess(title);
      const brandGuess = detectBrandGuess(title);

      products.push({
        id: doc.id,
        title,
        price,
        url,
        imageUrl,
        platform,
        category,
        color,
        materialGuess,
        brandGuess,
        rawData: data,
      });
    });
  }

  return products;
}
