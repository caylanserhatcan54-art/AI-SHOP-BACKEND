import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function generateQr(shopId: string) {
  const folder = path.join(process.cwd(), "public/qr");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const fileName = `${shopId}.png`;
  const imagePath = path.join(folder, fileName);

  const url = `https://ai-shop-site.vercel.app/shop?shop=${shopId}`;

  await QRCode.toFile(imagePath, url);

  return fileName;
}
