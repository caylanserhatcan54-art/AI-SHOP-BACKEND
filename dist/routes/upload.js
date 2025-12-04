"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const firebase_admin_1 = require("../config/firebase-admin");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, error: "file_missing" });
        }
        const fileName = `logos/${Date.now()}-${req.file.originalname}`;
        const file = firebase_admin_1.bucket.file(fileName);
        await file.save(req.file.buffer, {
            metadata: { contentType: req.file.mimetype },
        });
        const url = await file.getSignedUrl({
            action: "read",
            expires: "03-09-2030",
        });
        return res.json({ ok: true, url: url[0] });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, error: "upload_failed" });
    }
});
