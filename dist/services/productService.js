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
   🔎 KULLANICI MESAJINDAN ARAMA KELİMELERİ
------------------------------------------------------------- */
export function extractSearchTokens(message) {
    const t = normalizeText(message);
    const stopWords = new Set([
        "merhaba", "selam", "naber", "nasilsin", "iyiyim", "tesekkur",
        "lutfen", "lütfen", "bakar", "bakarmisin", "yardim", "istiyorum",
        "lazim", "varmi", "fiyat", "ne", "nedir", "hangi", "bana", "bir",
        "urun", "oner", "onerir", "onerisi", "istiyorum"
    ]);
    return t
        .split(" ")
        .filter(w => w.length >= 3)
        .filter(w => !stopWords.has(w));
}
/* -------------------------------------------------------------
   🔥 DERİN ÜRÜN ARAMA (ASIL OLAY)
------------------------------------------------------------- */
export function deepProductSearch(products, tokens) {
    if (!tokens.length)
        return [];
    const scored = products.map((p) => {
        const title = normalizeText(p.title);
        const raw = normalizeText(JSON.stringify(p.rawData || ""));
        const category = normalizeText(p.category || "");
        const brand = normalizeText(p.brandGuess || "");
        const color = normalizeText(p.color || "");
        const material = normalizeText(p.materialGuess || "");
        const fullText = [
            title,
            raw,
            category,
            brand,
            color,
            material,
        ].join(" ");
        let score = 0;
        for (const tok of tokens) {
            if (title.includes(tok))
                score += 12;
            if (fullText.includes(tok))
                score += 6;
        }
        return { product: p, score };
    });
    return scored
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.product);
}
/* -------------------------------------------------------------
   🔥 TÜM ÜRÜNLERİ DİNAMİK OKU (DEĞİŞMEDİ)
------------------------------------------------------------- */
export async function getProductsForShop(shopId) {
    const products = [];
    console.log("🧠 Ürünler okunuyor → magazalar /", shopId);
    const platformsSnap = await db
        .collection("magazalar")
        .doc(shopId)
        .collection("platformlar")
        .get();
    if (platformsSnap.empty) {
        console.log("⚠️ Platform bulunamadı:", shopId);
        return [];
    }
    for (const platformDoc of platformsSnap.docs) {
        const platform = platformDoc.id;
        console.log("📦 Platform:", platform);
        const productsSnap = await platformDoc.ref
            .collection("urunler")
            .get();
        if (productsSnap.empty) {
            console.log("⚠️ Ürün yok →", platform);
            continue;
        }
        productsSnap.forEach((doc) => {
            const data = doc.data();
            products.push({
                id: doc.id,
                title: data.title || data.baslik || "",
                price: data.price || data.priceText || "",
                url: data.url || "",
                imageUrl: Array.isArray(data.images) ? data.images[0] : "",
                platform,
                category: data.category || "genel",
                rawData: data,
            });
        });
    }
    console.log("✅ OKUNAN TOPLAM ÜRÜN:", products.length);
    return products;
}
