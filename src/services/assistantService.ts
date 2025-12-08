import { db } from "../config/firebase-admin.js";

/**
 * Kullanıcı mesajından niyet belirler (intent)
 */
function detectIntent(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("kargo") || msg.includes("gelmedi") || msg.includes("nerede")) {
    return "SHIPPING";
  }

  if (msg.includes("iade") || msg.includes("iptal")) {
    return "RETURN";
  }

  if (msg.includes("kombin") || msg.includes("altına") || msg.includes("yanına")) {
    return "COMBINE";
  }

  if (msg.includes("bilgisayar") || msg.includes("oyuncu") || msg.includes("pc")) {
    return "PC_BUILD";
  }

  if (msg.includes("boya") || msg.includes("alçı") || msg.includes("badana")) {
    return "PAINT";
  }

  if (msg.includes("fiyat") || msg.includes("ucuz") || msg.includes("bütçe")) {
    return "BUDGET";
  }

  if (msg.includes("merhaba") || msg.includes("selam")) {
    return "GREETING";
  }

  if (msg.includes("şikayet") || msg.includes("memnun değilim")) {
    return "COMPLAINT";
  }

  return "GENERAL";
}


/**
 * Mağaza bilgilerini getir
 */
async function getShop(shopSlug: string) {
  const snapshot = await db.collection("shops")
    .where("slug", "==", shopSlug)
    .get();

  if (snapshot.empty) return null;

  return snapshot.docs[0].data();
}


/**
 * Aynı mağazaya ait ürünleri getir
 */
async function getProducts(shopSlug: string) {
  const shopSnapshot = await db.collection("shops")
    .where("slug", "==", shopSlug)
    .get();

  if (shopSnapshot.empty) return [];

  const shopId = shopSnapshot.docs[0].id;

  const productsSnapshot = await db
    .collection("shops")
    .doc(shopId)
    .collection("products")
    .get();

  const list: any[] = [];
  productsSnapshot.forEach(p => list.push({ id: p.id, ...p.data() }));

  return list;
}


/**
 * Asıl cevap üretici fonksiyon
 */
export async function askAssistant(shopSlug: string, message: string) {
  const intent = detectIntent(message);
  const shop = await getShop(shopSlug);
  const products = await getProducts(shopSlug);

  if (!shop) {
    return { type: "ERROR", reply: "Mağaza bulunamadı." };
  }

  let reply = "";

  switch (intent) {
    case "GREETING":
      reply = `Merhaba 👋 ben ${shop.name} mağaza asistanıyım. Nasıl yardımcı olabilirim?`;
      break;

    case "SHIPPING":
      reply = shop.shippingPolicy || "Siparişleriniz kısa sürede kargoya verilir 😊";
      break;

    case "RETURN":
      reply = shop.returnPolicy || "14 gün içinde iade yapabilirsiniz 🛍️";
      break;

    case "GENERAL":
      reply = `Tam olarak neye ihtiyacınız var? Yardımcı olmak isterim 😊`;
      break;

    default:
      reply = "Tam ne istediğini emin olamadım ama yardımcı olmak isterim 😊";
  }

  return {
    type: "TEXT",
    reply,
    suggestedProducts: [],
  };
}
