import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error("❌ FIREBASE_SERVICE_ACCOUNT env var missing");
  }

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(serviceAccountJson)
    ),
  });
}

export const db = admin.firestore();
export default admin;
