import { db } from "../config/firebaseAdmin.js";

/* -------------------------------------------------------------
   PRODUCT TYPE
------------------------------------------------------------- */
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
   KATEGORİ TESPİT
------------------------------------------------------------- */
export function detectCategoryFromTitle(title: string): string {
  const t = normalizeText(title);

  if (
    t.includes("tisort") ||
    t.includes("gomlek") ||
    t.includes("kazak") ||
    t.includes("mont") ||
    t.includes("ceket") ||
    t.includes("pantolon") ||
    t.includes("elbise")
  ) return "giyim";

  if (
    t.includes("ayakkabi") ||
    t.includes("sneaker") ||
    t.includes("bot") ||
    t.includes("terlik")
  ) return "ayakkabi";

  if (
    t.includes("telefon") ||
    t.includes("kulaklik") ||
    t.includes("tablet") ||
    t.includes("bilgisayar")
  ) return "elektronik";

  return "genel";
}

/* -------------------------------------------------------------
   RENK TESPİT
------------------------------------------------------------- */
export function detectColorFromTitle(title: string): string | undefined {
  const t = normalizeText(title);

  const colors: Record<string, string> = {
    siyah: "siyah",
    black: "siyah",
    beyaz: "beyaz",
    white: "beyaz",
    kirmizi: "kırmızı",
    red: "kırmızı",
    mavi: "mavi",
    blue: "mavi",
    yesil: "yeşil",
    green: "yeşil",
    gri: "gri",
    gray: "gri",
  };

  for (const key in colors) {
    if (t.includes(key)) return colors[key];
  }

  return undefined;
}

/* -------------------------------------------------------------
   MATERYAL TESPİT
------------------------------------------------------------- */
export function detectMaterialGuess(title: string): string | undefined {
  const t = normalizeText(title);

  if (t.includes("pamuk") || t.includes("cotton"))
    return "Pamuk ağırlıklı, yumuşak ve nefes alabilen bir yapıda.";

  if (t.includes("deri") || t.includes("leather"))
    return "Deri malzemeden, dayanıklı ve şık bir ürün.";

  if (t.includes("polyester"))
    return "Polyester ağırlıklı, dayanıklı ve hafif.";

  return undefined;
}

/* -------------------------------------------------------------
   MARKA TAHMİNİ
------------------------------------------------------------- */
export function detectBrandGuess(title: string): string | undefined {
  const first = title.split(" ")[0];
  if (first && first[0] === first[0].toUpperCase() && first.length > 2) {
    return first;
  }
  return undefined;
}

/* -------------------------------------------------------------
   🔥 TÜM ÜRÜNLERİ DİNAMİK OKU
------------------------------------------------------------- */
export async function getProductsForShop(shopId: string): Promise<Product[]> {
  const products: Product[] = [];

  const platformsSnap = await db
    .collection("magazalar")
    .doc(shopId)
    .collection("platformlar")
    .get();

  if (platformsSnap.empty) {
    console.log("⚠️ Platform yok:", shopId);
    return [];
  }

  for (const platformDoc of platformsSnap.docs) {
    const platform = platformDoc.id;

    const productsSnap = await platformDoc.ref
      .collection("urunler")
      .get();

    if (productsSnap.empty) continue;

    productsSnap.forEach((docSnap) => {
      const data = docSnap.data() || {};

      /* -------------------------------------------------
         🖼️ GÖRSEL SEÇİMİ (NET + TEMİZ)
      ------------------------------------------------- */
      let imageUrl = "";

      if (Array.isArray(data.images) && data.images.length) {
        const validImages = data.images.filter((url: string) => {
          if (!url) return false;
          const u = url.toLowerCase();

          // ❌ UI / banner / reklam
          if (
            u.includes("logo") ||
            u.includes("sprite") ||
            u.includes("icon") ||
            u.includes("nav") ||
            u.includes("menu") ||
            u.includes("megamenu") ||
            u.includes("header") ||
            u.includes("footer") ||
            u.includes("banner") ||
            u.includes("marketing") ||
            u.includes("campaign") ||
            u.includes("launch") ||
            u.includes("fashion") ||
            u.includes("store") ||
            u.includes("ads") ||
            u.includes("tracking") ||
            u.endsWith(".svg")
          ) return false;

          // Trendyol
          if (
            u.includes("cdn.dsmcdn.com") &&
            (u.includes("mnresize") || u.includes("/prod/"))
          ) return true;

          // Amazon
          if (u.includes("m.media-amazon.com")) {
            return (
              u.includes("/images/i/") ||
              u.includes("_sl") ||
              u.includes("_ac_") ||
              u.includes("_sx")
            );
          }

          // Diğer platformlar
          if (u.includes("hbimg.com")) return true;
          if (u.includes("n11scdn.com")) return true;
          if (u.includes("ciceksepeti")) return true;
          if (u.includes("cdn.shopify.com")) return true;
          if (u.includes("ikas")) return true;
          if (u.includes("shopier")) return true;

          return false;
        });

        if (validImages.length) {
          imageUrl = validImages[0];
        }
      }

      // Fallback
      if (!imageUrl) {
        imageUrl =
          data.imageUrl ||
          data.image ||
          data.image_url ||
          "";
      }

      // 🧠 Amazon küçük görseli büyüt
      if (imageUrl.includes("m.media-amazon.com")) {
        imageUrl = imageUrl
          .replace(/_AC_[^.]*/i, "_AC_SL1500_")
          .replace(/_SR\d+,\d+/i, "_SL1500_");
      }

      products.push({
        id: docSnap.id,
        title: data.title || data.baslik || "",
        price: data.price || data.fiyat || "",
        url: data.url || data.URL || "",
        imageUrl,
        platform,
        category: detectCategoryFromTitle(data.title || data.baslik || ""),
        color: detectColorFromTitle(data.title || data.baslik || ""),
        materialGuess: detectMaterialGuess(data.title || data.baslik || ""),
        brandGuess: detectBrandGuess(data.title || data.baslik || ""),
        rawData: data,
      });
    });
  }

  console.log("✅ TOPLAM ÜRÜN SAYISI:", products.length);
  return products;
}
