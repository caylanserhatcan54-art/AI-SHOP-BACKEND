"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.env = {
    port: Number(process.env.PORT) || 4000,
    firestoreProjectId: process.env.FIRESTORE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
    openAiApiKey: process.env.OPENAI_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    jwtSecret: process.env.JWT_SECRET || 'change-me'
};
