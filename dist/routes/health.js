"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
var express_1 = require("express");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/health", function (req, res) {
    res.json({
        ok: true,
        message: "health ok"
    });
});
