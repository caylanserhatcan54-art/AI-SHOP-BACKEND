import QRCode from "qrcode";
import fs from "fs";
export async function generateQr(shopId) {
    const folder = "/tmp/qr";
    // klasör yoksa oluştur
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    const fileName = `${shopId}.png`;
    const imagePath = `${folder}/${fileName}`;
    const urlValue = encodeURIComponent(shopId);
    const qrUrl = `https://ai-shop-site.vercel.app/shop?shop=${urlValue}`;
    await QRCode.toFile(imagePath, qrUrl);
    return {
        fileName,
        localPath: imagePath,
    };
}
