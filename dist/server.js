"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
const products_1 = require("./routes/products");
const ai_1 = require("./routes/ai");
const public_1 = require("./routes/public");
const upload_1 = require("./routes/upload");
const ai_settings_1 = require("./routes/ai-settings");
dotenv_1.default.config();
const app = (0, express_1.default)();
// public klasörü
app.use("/uploads", express_1.default.static("public/uploads"));
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json({ limit: "20mb" }));
app.use("/api/auth", auth_1.authRouter);
app.use("/api/products", products_1.productsRouter);
app.use("/api/ai", ai_1.aiRouter);
app.use("/api/public", public_1.publicRouter);
app.use("/api/uploads", upload_1.uploadRouter);
app.use("/api/ai-settings", ai_settings_1.aiSettingsRouter);
app.get("/", (req, res) => {
    res.send("FlowAI Backend Çalışıyor ✔");
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
