"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.db = void 0;
var firebase_admin_1 = __importDefault(require("firebase-admin"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ÇEVRE DEĞİŞKENLERİ KONTROLÜ
if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("FIREBASE_PRIVATE_KEY missing!");
}
if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID missing!");
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("FIREBASE_CLIENT_EMAIL missing!");
}
// PRIVATE KEY DÜZELTME (Windows için şart)
var privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
    }),
    storageBucket: "".concat(process.env.FIREBASE_PROJECT_ID, ".appspot.com"),
});
exports.db = firebase_admin_1.default.firestore();
exports.bucket = firebase_admin_1.default.storage().bucket();
