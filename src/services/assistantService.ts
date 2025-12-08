import { auth } from "../config/firebase";


export const getAIResponse = async (storeId: string, message: string) => {
  try {
    // fetch products of this shop
    const productsRef = db.collection("stores").doc(storeId).collection("products");
    const productsSnap = await productsRef.limit(3).get();

    if (productsSnap.empty) {
      return "Şu anda bu mağaza için ürün bulunamadı.";
    }

    const items = productsSnap.docs.map(d => d.data());

    return `Bunları önerebilirim: ${items.map(p => p.name).join(", ")}`;
  } catch (err) {
    console.log("AI ERROR:", err);
    return "Şu anda yardımcı olamıyorum.";
  }
};
