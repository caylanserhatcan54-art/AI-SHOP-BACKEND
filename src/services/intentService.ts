import { normalizeText } from "./productService.js";

export function detectCategoryFromMessage(message: string): string | null {
  const t = normalizeText(message);

  if (
    t.includes("ayakkabi") ||
    t.includes("spor ayakkabi") ||
    t.includes("bot") ||
    t.includes("sneaker")
  )
    return "ayakkabi";

  if (
    t.includes("kazak") ||
    t.includes("mont") ||
    t.includes("ceket") ||
    t.includes("pantolon") ||
    t.includes("elbise")
  )
    return "giyim";

  if (
    t.includes("telefon") ||
    t.includes("kilif") ||
    t.includes("kulaklik") ||
    t.includes("elektronik")
  )
    return "elektronik";

  if (
    t.includes("hediye") ||
    t.includes("dogum gunu")
  )
    return "genel";

  return null;
}
