import admin from "firebase-admin";
import service from "../serviceAccount.json";

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(service as any),
  });
}

export const db = admin.firestore();
