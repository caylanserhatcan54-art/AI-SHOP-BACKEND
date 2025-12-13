import { db } from "../config/firebaseAdmin.js";
/* -------------------------------------------------------------
   FULL NORMALIZE (Türkçe destekli)
------------------------------------------------------------- */
export function normalizeText(str) {
    if (!str)
        return "";
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
export function detectColorFromTitle(title) {
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
        if (t.includes(c.keyword))
            return c.label;
    }
    return undefined;
}
/* -------------------------------------------------------------
   Kategori tahmini
------------------------------------------------------------- */
export function detectCategoryFromTitle(title) {
    const t = normalizeText(title);
    if (t.includes("polo") ||
        t.includes("tisort") ||
        t.includes("t shirt") ||
        t.includes("gomlek") ||
        t.includes("kaban") ||
        t.includes("mont") ||
        t.includes("kazak") ||
        t.includes("etek") ||
        t.includes("elbise") ||
        t.includes("pantolon") ||
        t.includes("ceket"))
        return "giyim";
    if (t.includes("ayakkabi") ||
        t.includes("sneaker") ||
        t.includes("bot") ||
        t.includes("sandalet") ||
        t.includes("terlik"))
        return "ayakkabi";
    if (t.includes("laptop") ||
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
        t.includes("ram"))
        return "elektronik";
    if (t.includes("oyuncak") ||
        t.includes("lego") ||
        t.includes("bebek") ||
        t.includes("figur") ||
        t.includes("araba oyuncak"))
        return "oyuncak";
    if (t.includes("cadir") ||
        t.includes("kamp") ||
        t.includes("mat") ||
        t.includes("uyku tulumu") ||
        t.includes("outdoor") ||
        t.includes("trekking"))
        return "kamp-outdoor";
    if (t.includes("matkap") ||
        t.includes("vida") ||
        t.includes("tornavida") ||
        t.includes("anahtar takimi") ||
        t.includes("hirdavat") ||
        t.includes("pense") ||
        t.includes("civi"))
        return "hirdavat";
    if (t.includes("top") ||
        t.includes("forma") ||
        t.includes("spor") ||
        t.includes("dumbbell") ||
        t.includes("fitness"))
        return "spor";
    return "genel";
}
/* -------------------------------------------------------------
   Materyal tahmini
------------------------------------------------------------- */
export function detectMaterialGuess(title) {
    const t = normalizeText(title);
    if (t.includes("pamuk") || t.includes("cotton"))
        return "Pamuk ağırlıklı, yumuşak ve nefes alabilen bir kumaş gibi duruyor.";
    if (t.includes("polyester"))
        return "Polyester ağırlıklı, dayanıklı ve kolay kırışmayan bir yapıda görünüyor.";
    if (t.includes("deri") || t.includes("leather"))
        return "Deri yapıda, uzun ömürlü ve şık bir ürün gibi duruyor.";
    if (t.includes("celik") ||
        t.includes("steel") ||
        t.includes("aluminyum") ||
        t.includes("aluminium"))
        return "Metal/çelik malzemeden, sağlam ve dayanıklı bir ürün gibi görünüyor.";
    return undefined;
}
/* -------------------------------------------------------------
   Basit marka tahmini
------------------------------------------------------------- */
export function detectBrandGuess(title) {
    const firstWord = title.split(" ")[0];
    if (!firstWord)
        return undefined;
    if (firstWord[0] === firstWord[0].toUpperCase() && firstWord.length > 2) {
        return firstWord;
    }
    return undefined;
}
/* -------------------------------------------------------------
   TÜM PLATFORM ÜRÜNLERİNİ FIRESTORE'DAN ÇEK
------------------------------------------------------------- */
export async function getProductsForShop(shopId) {
    const products = [];
    // 🔥 Platformları DİNAMİK çek
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
        if (productsSnap.empty)
            continue;
        productsSnap.forEach((docSnap) => {
            const data = docSnap.data() || {};
            // 🔥 GÖRSELİ NETLEŞTİR
            let imageUrl = "";
            if (Array.isArray(data.images) && data.images.length) {
                imageUrl = data.images[0];
            }
            else {
                imageUrl =
                    data.imageUrl ||
                        data.image ||
                        data.image_url ||
                        "";
            }
            products.push({
                id: docSnap.id,
                title: data.baslik || data.title || "",
                price: data.fiyat || data.price || "",
                url: data.URL || data.url || "",
                imageUrl,
                platform,
                category: detectCategoryFromTitle(data.baslik || data.title || ""),
                color: detectColorFromTitle(data.baslik || data.title || ""),
                materialGuess: detectMaterialGuess(data.baslik || data.title || ""),
                brandGuess: detectBrandGuess(data.baslik || data.title || ""),
                rawData: data,
            });
        });
    }
    console.log("✅ TOPLAM ÜRÜN SAYISI:", products.length);
    return products;
}
