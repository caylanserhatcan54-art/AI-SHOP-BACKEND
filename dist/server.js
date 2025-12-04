"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 🔥 Firebase Admin Initialize
require("./config/firebase-admin");
// ROUTERS
const productImport_1 = __importDefault(require("./routes/productImport"));
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
const qrRouter_1 = require("./routes/qrRouter");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ROOT
app.get("/", (req, res) => {
    res.json({ ok: true, msg: "FlowAI backend aktif" });
});
// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));
// ROUTES
app.use("/products", productImport_1.default);
app.use("/api/public", public_1.publicRouter);
app.use("/api/ai", aiRouter_1.aiRouter);
app.use("/api/qr", qrRouter_1.qrRouter); // 👈 QR sistemi buraya eklendi
// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 FlowAI Backend PORT : ${PORT}'de çalışıyor`));
