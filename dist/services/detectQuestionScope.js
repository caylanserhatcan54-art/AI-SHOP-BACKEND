export function detectQuestionScope(message) {
    const t = message.toLowerCase();
    // 🧠 Small talk
    if (["merhaba", "selam", "nasılsın", "naber", "iyi misin"].some((k) => t.includes(k))) {
        return "SMALL_TALK";
    }
    // ❤️ Duygusal durum
    if (["canım sıkkın", "moralim bozuk", "üzgünüm", "kötüyüm"].some((k) => t.includes(k))) {
        return "EMOTIONAL";
    }
    // 🛒 Açık ürün isteği
    if (["öner", "önerir misin", "lazım", "arıyorum", "almak istiyorum"].some((k) => t.includes(k))) {
        return "PRODUCT_REQUEST";
    }
    return "UNCERTAIN";
}
