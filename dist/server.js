"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// ENV okumayı başlat
dotenv_1.default.config();
// 🔥 Firebase Admin initialize (İLK ÖNCE GELİR)
require("./config/firebase-admin");
// Bu import sayesinde admin.initializeApp() çalışır
// Aşağıdaki tüm Firestore erişimleri artık çalışır
// ROUTER imports
const productImport_1 = __importDefault(require("./routes/productImport"));
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ROOT
app.get("/", (req, res) => res.json({ ok: true, msg: "FlowAI backend aktif" }));
// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));
// PRODUCT IMPORT ROUTE
app.use("/products", productImport_1.default);
// PUBLIC ROUTES (Mağaza, ürünler)
app.use("/api/public", public_1.publicRouter);
// AI ROUTES (LLM chat)
app.use("/api/ai", aiRouter_1.aiRouter);
// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("🔥 FlowAI Backend Running on PORT:", PORT));