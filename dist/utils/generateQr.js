import QRCode from "qrcode";
import fs from "fs";
export async function generateQr(shopId) {
    // Render/Server içi yazılabilir klasör
    const folder = "/tmp/qr";
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    const imagePath = `${folder}/${shopId}.png`;
    const url = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;
    await QRCode.toFile(imagePath, url);
    return {
        filePath: imagePath,
        fileName: `${shopId}.png`,
    };
}
