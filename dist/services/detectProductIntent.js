// src/services/detectProductIntent.ts
function n(s) {
    return (s || "")
        .toLowerCase()
        .replace(/[ğ]/g, "g")
        .replace(/[ü]/g, "u")
        .replace(/[ş]/g, "s")
        .replace(/[ı]/g, "i")
        .replace(/[ö]/g, "o")
        .replace(/[ç]/g, "c");
}
export function detectProductIntent(message) {
    const t = n(message);
    // 👟 Ayakkabı
    if (/(ayakkabi|sneaker|bot|cizme|terlik|spor ayakkabi|topuklu|loafer)/i.test(t))
        return "AYAKKABI";
    // 🧥 Dış giyim
    if (/(mont|kaban|ceket|parka|polar|trenckot|yagmurluk)/i.test(t))
        return "GIYIM_DIS_GIYIM";
    // 👕 Üst giyim
    if (/(tisort|t-shirt|gomlek|kazak|sweet|sweat|hoodie|polo|bluz|hirk a)/i.test(t))
        return "GIYIM_UST";
    // 👖 Alt giyim
    if (/(pantolon|jean|kot|esofman alt|etek|sort|tayt)/i.test(t))
        return "GIYIM_ALT";
    // 👜 Aksesuar
    if (/(canta|kemer|sapka|bere|atki|eldiven|gozluk|kilif|case)/i.test(t))
        return "AKSESUAR";
    // 💄 Kozmetik / bakım
    if (/(krem|serum|sampuan|sac bakim|parfum|edt|edp|ruj|maskara|cilt|tonik|deodorant)/i.test(t))
        return "KOZMETIK";
    // 🧽 Temizlik / kimyasal
    if (/(deterjan|temizlik|yuzey|camasir|bulasik|dezenfektan|camasir suyu)/i.test(t))
        return "TEMIZLIK";
    // 🍽️ Mutfak / züccaciye
    if (/(bardak|kupa|cam bardak|tabak|tencere|tava|cakmak|catal|kasik|bicen|biberon|suzgec|termos)/i.test(t))
        return "MUTFAK_ZUCCACIYE";
    // 🛠️ Hırdavat / nalbur
    if (/(matkap|vida|pense|anahtar|tornavida|keski|testere|makas|zimba|silikon|yapistirici|sprey boya)/i.test(t))
        return "HIRDAVAT";
    // 💻 Elektronik
    if (/(telefon|laptop|bilgisayar|kulaklik|tablet|powerbank|sarj|kablo|tv|monitor|klavye|mouse)/i.test(t))
        return "ELEKTRONIK";
    // 🐶 Petshop
    if (/(kedi|kopek|mama|kum|tasma|oyuncak|pet|akvaryum|balik yemi)/i.test(t))
        return "PET";
    // 🏋️ Spor / fitness
    if (/(dambıl|dumbbell|halter|fitness|yoga|kosu|band|elastik|mat)/i.test(t))
        return "SPOR_FITNESS";
    // 🏠 Ev yaşam / dekor
    if (/(hali|kilim|perde|nevresim|yastik|dekor|vazo|cicek|avize|lamba|mobilya|sandalye|masa)/i.test(t))
        return "EV_YASAM";
    // 💍 Takı / saat
    if (/(taki|kolye|bileklik|kupe|yuzuk|saat)/i.test(t))
        return "TAKI_SAAT";
    // 🍫 Gıda
    if (/(kahve|cay|cikolata|gida|atistirmalik|protein|bar)/i.test(t))
        return "GIDA";
    return "BELIRSIZ";
}
