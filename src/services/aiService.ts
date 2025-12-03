import { getProductsForPlatform } from "./productService";
import { db } from "../config/firebase";
import axios from "axios";

export async function recommendProducts(shopId: string, platform: string, userMessage: string) {
  // 1 — Mağaza ayarlarını çek
  const shopSnap = await db.collection("shops").doc(shopId).get();
  const shop = shopSnap.data();

  if (!shop) {
    return { ok: false, error: "shop_not_found" };
  }

  const pkg = shop.packageType; // basic | pro

  // BASIC paket → sadece 1 platform kullanabilir
  if (pkg === "basic") {
    if (shop.mainPlatform !== platform) {
      return {
        ok: false,
        error: "basic_package_platform_mismatch",
        message: `Bu mağaza sadece ${shop.mainPlatform} platformu ile çalışabilir.`,
      };
    }
  }

  // PRO paket → tüm platformları açabilir
  if (pkg === "pro") {
    if (!shop.platforms || !shop.platforms[platform]) {
      return {
        ok: false,
        error: "platform_disabled_in_pro",
        message: `${platform} bu mağazada aktif değil.`,
      };
    }
  }

  // 2 — Platform ürünlerini al
  const products = await getProductsForPlatform(shopId, platform);

  if (products.length === 0) {
    return {
      ok: false,
      error: "no_products_found",
      message: `${platform} için ürün kaydı yok.`,
    };
  }

  // 3 — AI prompt
  const prompt = `
Kullanıcı mesajı: "${userMessage}"

Aşağıdaki ürünlerden en uygun 5 tanesini seç:

${JSON.stringify(products.slice(0, 80), null, 2)}

Sadece şu formatta cevap ver:
[
  { "title": "", "price": "", "image": "", "link": "" }
]
`;

  // 4 — LM Studio üzerinden AI çağrısı
  const aiRes = await axios.post("http://localhost:1234/v1/chat/completions", {
    model: "qwen",
    messages: [{ role: "user", content: prompt }],
  });

  const raw = aiRes.data.choices[0].message.content;

  let suggestions = [];

  try {
    suggestions = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: "ai_parse_error", raw };
  }

  return {
    ok: true,
    platform,
    suggestions,
  };
}
