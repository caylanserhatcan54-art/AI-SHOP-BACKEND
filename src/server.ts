import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import { qrImageRouter } from "./routes/qrImage";
import authShopRouter from "./routes/authShop";

dotenv.config();

const app = express();

// CORS BURADA
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🌍 CORS request from:", origin);

      // Ana kullanılacak domain (kalıcı)
      const allowedOrigins = [
        "https://ai-shop-site.vercel.app"
      ];

      // Eğer origin undefined ise (Postman, Terminal testleri) izin ver
      if (!origin) return callback(null, true);

      // Eğer allowedOrigins içinde varsa izin ver
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Deploy ön izleme linkleri için izin ver
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("🚫 CORS blocked! Origin: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ek güvenlik headerları
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // istersen "*" yapabilirsin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  return res.json({ ok: true, message: "FlowAI Backend running" });
});

// ROUTES
app.use("/products", productImportRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);

// SHOP AUTH
app.use("/auth", authShopRouter);

// QR IMAGE
app.use("/api/qr-image", qrImageRouter);

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Backend started at port:", PORT);
});
