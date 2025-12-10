import QRCode from "qrcode";
import path from "path";

export async function generateShopQR(shopId: string) {
  const publicLink = `https://ai-shop-panel.vercel.app/shop/${shopId}`;

  // public/qr klasörüne kaydedilecek
  const filePath = path.join(__dirname, "../../public/qr", `${shopId}.png`);

  await QRCode.toFile(filePath, publicLink);

  return {
    qrPath: filePath,
    qrUrl: `https://ai-shop-backend-2.onrender.com/qr/${shopId}.png`
  };
}
