"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class UploadService {
    async saveImage(filename, base64) {
        try {
            const folder = path_1.default.join(__dirname, "../../uploads");
            if (!fs_1.default.existsSync(folder)) {
                fs_1.default.mkdirSync(folder);
            }
            const filePath = path_1.default.join(folder, filename);
            const imgData = base64.replace(/^data:image\/\w+;base64,/, "");
            fs_1.default.writeFileSync(filePath, Buffer.from(imgData, "base64"));
            return {
                ok: true,
                url: `/uploads/${filename}`
            };
        }
        catch (err) {
            console.error("Upload error:", err);
            return { ok: false, error: "Upload failed" };
        }
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
