import { db } from "../config/firebase-admin";

export class ShopService {
  async getShop(shopId: string) {
    const ref = db.collection("shops").doc(shopId);
    const doc = await ref.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data();
  }

  async createShop(shopId: string, data: any) {
    const ref = db.collection("shops").doc(shopId);
    await ref.set(data, { merge: true });
    return true;
  }

  async updateAISettings(shopId: string, settings: any) {
    const ref = db.collection("shops").doc(shopId).collection("settings").doc("ai");
    await ref.set(settings, { merge: true });
    return true;
  }

  async getAISettings(shopId: string) {
    const ref = db.collection("shops").doc(shopId).collection("settings").doc("ai");
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
  }
}

export const shopService = new ShopService();
