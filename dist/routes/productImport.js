import { Router } from "express";
import { db } from "../config/firebaseAdmin.js";
const router = Router();
/* =========================
   🔤 NORMALIZATION
========================= */
function normalizeTR(s) {
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
function cleanSpaces(s) {
    return s.replace(/\s+/g, " ").trim();
}
/* =========================
   🆔 PRODUCT ID EXTRACTION
========================= */
function extractProductId(body) {
    if (body.productId)
        return String(body.productId);
    if (body["ürün kimliği"])
        return String(body["ürün kimliği"]);
    if (body.id)
        return String(body.id);
    const url = body.url || "";
    if (typeof url === "string") {
        // Trendyol
        let m = url.match(/-p-(\d+)/);
        if (m)
            return m[1];
        // Amazon
        m = url.match(/\/dp\/([A-Z0-9]{8,12})/);
        if (m)
            return m[1];
        // N11
        m = url.match(/urun\/.*-(\d+)/);
        if (m)
            return m[1];
    }
    return null;
}
/* =========================
   🖼️ IMAGE FILTER
========================= */
function filterRealImages(images) {
    const arr = Array.isArray(images) ? images.map(String) : [];
    const valid = arr
        .filter(u => u.startsWith("http"))
        .filter(u => !u.includes("sprite"))
        .filter(u => !u.includes("icon"))
        .filter(u => !u.includes("pixel"))
        .filter(u => !u.includes("loading"))
        .filter(u => u.includes("/images/I/") || // Amazon
        u.includes("cdn.dsmcdn.com") || // Trendyol
        u.includes("productimages.hepsiburada") ||
        u.includes("n11scdn") ||
        u.includes("ciceksepeti") ||
        u.includes("cdn.shopify.com") ||
        u.includes("shopier") ||
        u.includes("ikas"));
    return Array.from(new Set(valid)).slice(0, 8);
}
/* =========================
   🏷️ CATEGORY DETECTION
========================= */
function detectCategory(text) {
    const t = normalizeTR(text);
    if (t.includes("ayakkabi") || t.includes("sneaker") || t.includes("bot"))
        return "ayakkabi";
    if (t.includes("mont") || t.includes("kaban") || t.includes("ceket"))
        return "mont";
    if (t.includes("kazak") || t.includes("triko"))
        return "kazak";
    if (t.includes("pantolon") || t.includes("jean"))
        return "pantolon";
    if (t.includes("tshirt") || t.includes("tişört"))
        return "tshirt";
    if (t.includes("bardak") || t.includes("kupa") || t.includes("mug"))
        return "bardak";
    if (t.includes("tencere") || t.includes("tava"))
        return "tencere";
    if (t.includes("kedi mamasi"))
        return "kedi-mamasi";
    if (t.includes("kopek mamasi"))
        return "kopek-mamasi";
    return "diger";
}
/* =========================
   🧠 ATTRIBUTE EXTRACTION
========================= */
function extractAttributes(text) {
    const t = normalizeTR(text);
    const attr = {};
    if (t.includes("erkek"))
        attr.gender = "erkek";
    else if (t.includes("kadin"))
        attr.gender = "kadin";
    else if (t.includes("unisex"))
        attr.gender = "unisex";
    const sizes = text.match(/\bXS\b|\bS\b|\bM\b|\bL\b|\bXL\b|\bXXL\b/g);
    if (sizes)
        attr.sizeOptions = Array.from(new Set(sizes));
    if (t.includes("pamuk"))
        attr.material = "pamuk";
    if (t.includes("deri"))
        attr.material = "deri";
    if (t.includes("celik") || t.includes("çelik"))
        attr.material = "çelik";
    const cap = t.match(/(\d{2,5})\s*(ml|l|lt|litre)/);
    if (cap)
        attr.capacity = `${cap[1]} ${cap[2]}`;
    return attr;
}
/* =========================
   💰 PRICE EXTRACTION
========================= */
function extractPrice(text) {
    const m = text.match(/(\d{1,3}(\.\d{3})*),(\d{2})\s*tl/i);
    if (!m)
        return {};
    const price = Number(m[1].replace(/\./g, "") + "." + m[3]);
    return {
        price,
        priceText: `${m[1]},${m[3]} TL`
    };
}
/* =========================
   🔄 NORMALIZE BODY
========================= */
function normalizeProductBody(body) {
    const title = String(body.title || "").trim();
    const rawText = String(body.rawText || body["ham metin"] || "").trim();
    const productId = extractProductId(body);
    if (!productId) {
        throw new Error("productId_missing");
    }
    const text = `${title} ${rawText}`;
    const category = detectCategory(text);
    const product = {
        id: productId,
        platform: String(body.platform || "Unknown"),
        title: title || "(başlık yok)",
        description: cleanSpaces(rawText).slice(0, 700),
        url: body.url ? String(body.url) : undefined,
        category,
        categoryPath: ["genel", category],
        attributes: extractAttributes(text),
        ...extractPrice(rawText),
        currency: "TRY",
        images: filterRealImages(body.images || body.imageUrls || []),
        keywords: [],
        importedAt: Date.now(),
    };
    product.keywords = Array.from(new Set(normalizeTR(`${product.title} ${product.description} ${Object.values(product.attributes).join(" ")}`).split(/\s+/).filter(w => w.length >= 3))).slice(0, 120);
    return product;
}
/* =========================
   🚀 ROUTE
========================= */
// POST /api/product/import
router.post("/import", async (req, res) => {
    try {
        const { shopId, platform, product: productBody } = req.body;
        if (!shopId) {
            return res.status(400).json({ error: "shopId gerekli" });
        }
        if (!productBody) {
            return res.status(400).json({ error: "product body gerekli" });
        }
        const product = normalizeProductBody(productBody);
        if (!product.id || product.id.length < 3) {
            return res.status(400).json({ error: "productId (ürün kimliği) gerekli" });
        }
        await db
            .collection("magazalar")
            .doc(shopId)
            .collection("platformlar")
            .doc(platform)
            .collection("urunler")
            .doc(product.id)
            .set(product, { merge: true });
        return res.json({
            success: true,
            savedId: product.id,
            platform,
        });
    }
    catch (e) {
        console.error("product import error:", e);
        return res.status(500).json({
            error: "import_error",
            detail: e?.message || "unknown",
        });
    }
});
export default router;
