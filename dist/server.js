"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// HEALTH CHECK
app.get("/health", (req, res) => {
    res.json({ ok: true, status: "healthy" });
});
// ROUTES
const aiRouter_1 = require("./routes/aiRouter");
const productsRouter_1 = require("./routes/productsRouter");
app.use("/ai", aiRouter_1.aiRouter);
app.use("/products", productsRouter_1.productsRouter);
// PORT MUTLAKA ENV PORT OLMALI!
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
