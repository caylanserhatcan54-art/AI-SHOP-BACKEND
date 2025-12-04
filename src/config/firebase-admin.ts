import admin from "firebase-admin";

let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error("🔥 FIREBASE_SERVICE_ACCOUNT not found in ENV");
  throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
}

try {
  serviceAccountJson = JSON.parse(serviceAccountJson);
} catch (err) {
  console.error("🔥 ERROR PARSING FIREBASE_SERVICE_ACCOUNT:", err);
  throw err;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Bu satır ÖNEMLİ
export const bucket = admin.storage().bucket();

export const db = admin.firestore();
export default admin;
