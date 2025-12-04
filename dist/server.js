"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// HEALTH
app.get("/health", function (req, res) { return res.json({ ok: true }); });
// ROOT
app.get("/", function (req, res) { return res.json({ ok: true, msg: "backend aktif" }); });
// ROUTES
var public_1 = require("./routes/public");
var aiRouter_1 = require("./routes/aiRouter");
app.use("/api/public", public_1.publicRouter);
app.use("/api/ai", aiRouter_1.aiRouter);
var PORT = process.env.PORT || 4000;
app.listen(PORT, function () { return console.log("Backend running:", PORT); });
