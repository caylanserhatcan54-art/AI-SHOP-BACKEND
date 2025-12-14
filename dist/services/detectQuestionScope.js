// src/services/detectQuestionScope.ts
function n(s) {
    return (s || "")
        .toLowerCase()
        .replace(/[ğ]/g, "g")
        .replace(/[ü]/g, "u")
        .replace(/[ş]/g, "s")
        .replace(/[ı]/g, "i")
        .replace(/[ö]/g, "o")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export function detectQuestionScope(message) {
    const msg = (message || "").trim();
    if (!msg)
        return "EMPTY";
    const t = n(msg);
    // 🗣️ Small talk
    if (/(merhaba|selam|slm|hey|gunaydin|iyi aksamlar|iyi gunler|nasilsin|naber|nbr|ne haber|iyi misin|kimsin|bot musun)/i.test(t)) {
        return "SMALL_TALK";
    }
    // ❤️ Emotional
    if (/(moralim bozuk|uzgunum|kotu hissediyorum|canim sikildi|sikildim|stresliyim|sinirliyim|depresifim|aglamak)/i.test(t)) {
        return "EMOTIONAL";
    }
    // 🌍 General info / “nasıl kullanılır” vb.
    if (/(nasil kullanilir|ne ise yarar|nedir|farki ne|kullanim|kurulum|temizligi|bakimi|tarifi|aciklar misin)/i.test(t)) {
        return "GENERAL_INFO";
    }
    // 🛒 Açık ürün isteği
    if (/(oner|oneri|tavsiye|lazim|ariyorum|almak istiyorum|var mi|stok|fiyat|kac tl|ne kadar|beden|numara|renk|kargo|iade|degisim|kombin|hediye)/i.test(t)) {
        return "PRODUCT_REQUEST";
    }
    // Tek kelimelik “mont”, “bardak”, “matkap” vb. -> ürün isteği gibi davran
    if (t.split(" ").length <= 3)
        return "PRODUCT_REQUEST";
    return "UNCERTAIN";
}
