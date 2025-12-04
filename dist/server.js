"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
require("./config/firebase-admin");
// ROUTES
const productImport_1 = __importDefault(require("./routes/productImport"));
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
const qr_1 = require("./routes/qr");
const qrText_1 = require("./routes/qrText");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ROOT
app.get("/", (req, res) => {
    return res.json({ ok: true, msg: "FlowAI Backend Aktif!" });
});
// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));
// PRODUCT IMPORT
app.use("/products", productImport_1.default);
// PUBLIC ROUTES
app.use("/api/public", public_1.publicRouter);
// AI CHAT ROUTE (GROQ)
app.use("/api/ai", aiRouter_1.aiRouter);
// QR CODE ROUTE
app.use("/api/qr", qr_1.qrRouter);
// QR TEXT ROUTE
app.use("/api/qr-text", qrText_1.qrTextRouter);
// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("🔥 FlowAI Backend PORT:", PORT, " üzerinde çalışıyor"));
