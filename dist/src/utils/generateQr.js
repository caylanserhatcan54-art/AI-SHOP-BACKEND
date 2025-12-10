import QRCode from "qrcode";
import fs from "fs";
export async function generateQr(shopId) {
    console.log("QR oluşturuluyor:", shopId);
    const folder = "/tmp/qr";
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log("QR klasörü oluşturuldu:", folder);
    }
    const fileName = `${shopId}.png`;
    const filePath = `${folder}/${fileName}`;
    const redirectUrl = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;
    // QR üretimi
    await QRCode.toFile(filePath, redirectUrl);
    console.log("QR oluşturuldu:", filePath);
    return fileName;
}
