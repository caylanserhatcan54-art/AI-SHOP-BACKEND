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
// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));
// ROOT
app.get("/", (req, res) => res.json({ ok: true, msg: "backend aktif" }));
// ROUTES
const public_1 = require("./routes/public");
const aiRouter_1 = require("./routes/aiRouter");
app.use("/api/public", public_1.publicRouter);
app.use("/api/ai", aiRouter_1.aiRouter);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend running:", PORT));
