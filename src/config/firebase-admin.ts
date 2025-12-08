import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const firestoreAdmin = admin.firestore();
export default firestoreAdmin;
