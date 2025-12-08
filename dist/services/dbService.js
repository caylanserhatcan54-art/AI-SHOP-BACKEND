import { firestoreAdmin } from "../config/firebase-admin.js";
export async function getProductListByStore(storeId) {
    const snapshot = await firestoreAdmin
        .collection("stores")
        .doc(storeId)
        .collection("products")
        .get();
    if (snapshot.empty)
        return [];
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
}
export async function getStoreDetails(storeId) {
    const snap = await firestoreAdmin
        .collection("stores")
        .doc(storeId)
        .get();
    if (!snap.exists)
        return null;
    return snap.data();
}
