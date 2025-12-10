import QRCode from "qrcode";
import fs from "fs";
import path from "path";
export async function generateQr(shopId) {
    const folder = path.join(process.cwd(), "public/qr");
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    const imgPath = `${folder}/${shopId}.png`;
    const url = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;
    await QRCode.toFile(imgPath, url);
    return imgPath;
}
