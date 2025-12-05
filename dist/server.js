"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// ROUTES
const productImport_1 = __importDefault(require("./routes/productImport"));
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
const qrImage_1 = require("./routes/qrImage"); // burada düzeldi
const authShop_1 = __importDefault(require("./routes/authShop"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ROOT
app.get("/", (req, res) => {
    return res.json({ ok: true, message: "FlowAI Backend running" });
});
// ROUTES
app.use("/products", productImport_1.default);
app.use("/api/public", public_1.publicRouter);
app.use("/api/ai", aiRouter_1.aiRouter);
app.use("/auth", authShop_1.default);
// QR IMAGE route
app.use("/api/qr-image", qrImage_1.qrImageRouter);
// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("🚀 Backend started at port:", PORT);
});
