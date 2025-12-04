"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_admin_1 = require("../config/firebase-admin");
class AuthService {
    async register(email, password) {
        const userRef = firebase_admin_1.db.collection("users").doc(email);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            return { ok: false, error: "email_exists" };
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await userRef.set({
            email,
            password: hashed,
            createdAt: Date.now()
        });
        return { ok: true };
    }
    async login(email, password) {
        const userRef = firebase_admin_1.db.collection("users").doc(email);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return { ok: false, error: "invalid_credentials" };
        }
        const user = userDoc.data();
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            return { ok: false, error: "invalid_credentials" };
        }
        const token = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET || "mystery-key", { expiresIn: "7d" });
        return { ok: true, token };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
