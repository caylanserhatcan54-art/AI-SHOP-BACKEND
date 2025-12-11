// src/routes/productImport.ts
import { Router } from "express";
import admin, { db } from "../config/firebaseAdmin.js";

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

/* -------------------------------------------------------------
   FULL NORMALIZE (Türkçe destekli)
------------------------------------------------------------- */
export function normalizeText(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------
   Renk tahmini
------------------------------------------------------------- */
export function detectColorFromTitle(title: string): string | undefined {
  const t = normalizeText(title);
  const colors = [
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

/* -------------------------------------------------------------
   Kategori tahmini
------------------------------------------------------------- */
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
  )
    return "giyim";

  if (
    t.includes("ayakkabi") ||
    t.includes("sneaker") ||
    t.includes("bot") ||
    t.includes("sandalet") ||
    t.includes("terlik")
  )
    return "ayakkabi";

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
    t.includes("tablet") ||
    t.includes("ssd") ||
    t.includes("ram")
  )
    return "elektronik";

  if (
    t.includes("oyuncak") ||
    t.includes("lego") ||
    t.includes("bebek") ||
    t.includes("figur") ||
    t.includes("araba oyuncak")
  )
    return "oyuncak";

  if (
    t.includes("cadir") ||
    t.includes("kamp") ||
    t.includes("mat") ||
    t.includes("uyku tulumu") ||
    t.includes("outdoor") ||
    t.includes("trekking")
  )
    return "kamp-outdoor";

  if (
    t.includes("matkap") ||
    t.includes("vida") ||
    t.includes("tornavida") ||
    t.includes("anahtar takimi") ||
    t.includes("hirdavat") ||
    t.includes("pense") ||
    t.includes("civi")
  )
    return "hirdavat";

  if (
    t.includes("top") ||
    t.includes("forma") ||
    t.includes("spor") ||
    t.includes("dumbbell") ||
    t.includes("fitness")
  )
    return "spor";

  return "genel";
}

/* -------------------------------------------------------------
   Materyal tahmini
------------------------------------------------------------- */
export function detectMaterialGuess(title: string): string | undefined {
  const t = normalizeText(title);

  if (t.includes("pamuk") || t.includes("cotton"))
    return "Pamuk ağırlıklı, yumuşak ve nefes alabilen bir kumaş gibi duruyor.";

  if (t.includes("polyester"))
    return "Polyester ağırlıklı, dayanıklı ve kolay kırışmayan bir yapıda görünüyor.";

  if (t.includes("deri") || t.includes("leather"))
    return "Deri yapıda, uzun ömürlü ve şık bir ürün gibi duruyor.";

  if (
    t.includes("celik") ||
    t.includes("steel") ||
    t.includes("aluminyum") ||
    t.includes("aluminium")
  )
    return "Metal/çelik malzemeden, sağlam ve dayanıklı bir ürün gibi görünüyor.";

  return undefined;
}

/* -------------------------------------------------------------
   Basit marka tahmini
------------------------------------------------------------- */
export function detectBrandGuess(title: string): string | undefined {
  const firstWord = title.split(" ")[0];
  if (!firstWord) return undefined;

  if (firstWord[0] === firstWord[0].toUpperCase() && firstWord.length > 2) {
    return firstWord;
  }

  return undefined;
}

/* -------------------------------------------------------------
   TÜM PLATFORM ÜRÜNLERİNİ FIRESTORE'DAN ÇEK
------------------------------------------------------------- */
export async function getProductsForShop(shopId: string): Promise<Product[]> {
  const platforms = ["trendyol", "hepsiburada", "n11", "amazon", "ciceksepeti"];

  const products: Product[] = [];

  for (const platform of platforms) {
    const snap = await db
      .collection("magazalar")
      .doc(shopId)
      .collection("platformlar")
      .doc(platform)
      .collection("urunler")
      .get();

    if (snap.empty) continue;

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};

      products.push({
        id: docSnap.id,
        title: data.baslik || data.title || "",
        price: data.fiyat || data.price,
        url: data.URL || data.url,
        imageUrl:
          data.image || data.imageUrl || data.image_url || data.images,
        platform,
        category: detectCategoryFromTitle(data.baslik || data.title || ""),
        color: detectColorFromTitle(data.baslik || data.title || ""),
        materialGuess: detectMaterialGuess(data.baslik || data.title || ""),
        brandGuess: detectBrandGuess(data.baslik || data.title || ""),
        rawData: data,
      });
    });
  }

  return products;
}
