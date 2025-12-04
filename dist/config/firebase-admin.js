"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.bucket = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
    console.error("🔥 FIREBASE_SERVICE_ACCOUNT not found in ENV");
    throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
}
try {
    serviceAccountJson = JSON.parse(serviceAccountJson);
}
catch (err) {
    console.error("🔥 ERROR PARSING FIREBASE_SERVICE_ACCOUNT:", err);
    throw err;
}
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountJson),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
// Bu satır ÖNEMLİ
exports.bucket = firebase_admin_1.default.storage().bucket();
exports.db = firebase_admin_1.default.firestore();
exports.default = firebase_admin_1.default;
