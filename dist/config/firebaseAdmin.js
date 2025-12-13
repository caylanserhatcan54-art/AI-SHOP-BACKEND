import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// backend/serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");
const raw = fs.readFileSync(serviceAccountPath, "utf-8");
const serviceAccount = JSON.parse(raw);
// Debug – ilk çalışmada gör, sonra silebilirsin
console.log("🔥 Firebase project_id:", serviceAccount.project_id);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
// 🔴 SADECE BUNU EXPORT EDİYORUZ
export const db = admin.firestore();
