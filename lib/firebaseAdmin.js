import admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"))
    ),
  });
}

export const db = admin.firestore();
