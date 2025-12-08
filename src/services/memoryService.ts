import firestoreAdmin from "../config/firebase-admin.js";

const db = firestoreAdmin;

export async function updateUserMemory(
  shopId: string,
  userMessage: string,
  userId?: string
): Promise<void> {
  if (!userId) userId = "anonymous"; // Chrome ext ile alacağız

  const ref = db
    .collection("memories")
    .doc(shopId)
    .collection("users")
    .doc(userId);

  const now = Date.now();

  const current = await ref.get();
  const prev = current.exists ? current.data() : {};

  let preferredCategories = prev.preferredCategories || [];
  let preferredColors = prev.preferredColors || [];

  const lower = userMessage.toLowerCase();

  if (lower.includes("ayakkabı")) preferredCategories.push("ayakkabi");
  if (lower.includes("mont") || lower.includes("elbise"))
    preferredCategories.push("giyim");
  if (lower.includes("siyah")) preferredColors.push("siyah");
  if (lower.includes("beyaz")) preferredColors.push("beyaz");

  await ref.set(
    {
      lastSeen: now,
      lastMessage: userMessage,
      preferredCategories,
      preferredColors,
      interactionCount: (prev.interactionCount || 0) + 1,
    },
    { merge: true }
  );
}

export async function getUserMemory(shopId: string, userId?: string) {
  if (!userId) userId = "anonymous";

  const ref = db
    .collection("memories")
    .doc(shopId)
    .collection("users")
    .doc(userId);

  const doc = await ref.get();
  return doc.exists ? doc.data() : null;
}
