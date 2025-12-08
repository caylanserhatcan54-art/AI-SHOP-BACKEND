import path from "path";
import fs from "fs";
export class UploadService {
    async saveImage(filename, base64) {
        try {
            const folder = path.join(__dirname, "../../uploads");
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
            const filePath = path.join(folder, filename);
            const imgData = base64.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(filePath, Buffer.from(imgData, "base64"));
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
export const uploadService = new UploadService();
