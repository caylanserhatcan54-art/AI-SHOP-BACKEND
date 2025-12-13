export function detectProductIntent(message) {
    const t = message.toLowerCase();
    if (["ayakkabı", "spor ayakkabı", "sneaker", "bot"].some((k) => t.includes(k)))
        return "AYAKKABI";
    if (["mont", "ceket", "kaban", "polar"].some((k) => t.includes(k)))
        return "MONT";
    if (["tişört", "t-shirt", "eşofman", "kıyafet", "giyim"].some((k) => t.includes(k)))
        return "GIYIM";
    return "BELIRSIZ";
}
