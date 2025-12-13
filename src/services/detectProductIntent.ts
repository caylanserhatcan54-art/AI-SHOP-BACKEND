// src/services/detectProductIntent.ts
export type ProductIntent = "AYAKKABI" | "MONT" | "GIYIM" | "BELIRSIZ";

export function detectProductIntent(message: string): ProductIntent {
  const t = message.toLowerCase();

  if (["ayakkabı", "spor ayakkabı", "sneaker", "bot"].some((k) => t.includes(k)))
    return "AYAKKABI";

  if (["mont", "ceket", "kaban", "polar"].some((k) => t.includes(k)))
    return "MONT";

  if (["tişört", "t-shirt", "eşofman", "kıyafet", "giyim"].some((k) => t.includes(k)))
    return "GIYIM";

  return "BELIRSIZ";
}
