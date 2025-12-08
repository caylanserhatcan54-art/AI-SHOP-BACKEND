export function detectIntent(message: string) {
  const m = message.toLowerCase();

  if (m.includes("kombin") || m.includes("öner") || m.includes("hangisi"))
    return "recommend";

  if (
    m.includes("nasıl") ||
    m.includes("uygula") ||
    m.includes("boya yap") ||
    m.includes("kullan")
  )
    return "usage_help";

  if (m.includes("var mı") || m.includes("istiyorum") || m.includes("fiyat"))
    return "product_search";

  return "general";
}

export function extractCategory(message: string, products: any[]) {
  const m = message.toLowerCase();

  for (let p of products) {
    if (p.category && m.includes(p.category.toLowerCase())) return p.category;
  }

  for (let p of products) {
    if (!p.name) continue;
    const first = p.name.toLowerCase().split(" ")[0];
    if (m.includes(first)) return p.category;
  }

  if (m.includes("kazak")) return "sweater";
  if (m.includes("tişört") || m.includes("tshirt")) return "tshirt";
  if (m.includes("boya")) return "paint";
  if (m.includes("ayakkabı")) return "shoes";

  return null;
}
