import admin from "firebase-admin";
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}
// Firestore
export const db = admin.firestore();
// Storage
export const bucket = admin.storage().bucket();
export default admin;
