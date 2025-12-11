// src/services/memoryService.ts
import { db } from "../config/firebaseAdmin.js";
/**
 * Kullanıcı hafızasını güncelle (kategoriler, renkler, mesajlar vs.)
 */
export async function updateUserMemory(shopId, userMessage, userId = "anonymous") {
    // Firestore referansı
    const ref = db
        .collection("magazalar")
        .doc(shopId)
        .collection("memory")
        .doc(userId);
    const now = Date.now();
    const snap = await ref.get();
    const prev = snap.exists ? snap.data() : {};
    let preferredCategories = prev.preferredCategories || [];
    let preferredColors = prev.preferredColors || [];
    const msg = userMessage.toLowerCase();
    // --- Basit kategori çıkarsama ---
    if (msg.includes("ayakkabı"))
        preferredCategories.push("ayakkabi");
    if (msg.includes("mont") || msg.includes("elbise"))
        preferredCategories.push("giyim");
    // --- Renk çıkarsama ---
    if (msg.includes("siyah"))
        preferredColors.push("siyah");
    if (msg.includes("beyaz"))
        preferredColors.push("beyaz");
    await ref.set({
        lastSeen: now,
        lastMessage: userMessage,
        preferredCategories,
        preferredColors,
        interactionCount: (prev.interactionCount || 0) + 1,
    }, { merge: true });
}
/**
 * Kullanıcı hafızasını getir
 */
export async function getUserMemory(shopId, userId = "anonymous") {
    const ref = db
        .collection("magazalar")
        .doc(shopId)
        .collection("memory")
        .doc(userId);
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
}
