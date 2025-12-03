"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
// ROUTES
const auth_1 = require("./routes/auth");
const products_1 = require("./routes/products");
const aiRouter_1 = require("./routes/aiRouter");
const public_1 = require("./routes/public");
const upload_1 = require("./routes/upload");
const ai_settings_1 = require("./routes/ai-settings");
const health_1 = require("./routes/health");
const app = (0, express_1.default)();
// MIDDLEWARES
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json({ limit: "20mb" }));
// HEALTH CHECK (Render için çok önemli)
app.get("/api/health", (req, res) => {
    return res.json({
        ok: true,
        message: "FlowAI backend is healthy ✔"
    });
});
// MAIN ROUTERS
app.use("/api/auth", auth_1.authRouter);
app.use("/api/products", products_1.productsRouter);
app.use("/api/ai", aiRouter_1.aiRouter);
app.use("/api/public", public_1.publicRouter);
app.use("/api/uploads", upload_1.uploadRouter);
app.use("/api/ai-settings", ai_settings_1.aiSettingsRouter);
// EXTRA: health router
app.use("/api", health_1.healthRouter);
// ROOT PING
app.get("/", (req, res) => {
    res.send("FlowAI Backend Çalışıyor ✔");
});
// SERVER START
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
