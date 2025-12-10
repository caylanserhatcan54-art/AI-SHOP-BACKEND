import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function generateQr(shopId) {
    try {
        const folder = path.join(__dirname, "../../public/qr");
        // klasör yoksa oluştur
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        const fileName = `${shopId}.png`;
        const imagePath = path.join(folder, fileName);
        const urlValue = encodeURIComponent(shopId);
        const frontendUrl = `https://ai-shop-site.vercel.app/shop?shop=${urlValue}`;
        await QRCode.toFile(imagePath, frontendUrl);
        console.log("QR oluşturuldu:", imagePath);
        return {
            fileName,
            localPath: imagePath,
            publicUrl: `https://ai-shop-backend-2.onrender.com/qr/${fileName}`,
        };
    }
    catch (error) {
        console.error("QR Generation Error:", error);
        throw error;
    }
}
