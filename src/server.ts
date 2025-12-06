import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";
import { qrImageRouter } from "./routes/qrImage";
import authShopRouter from "./routes/authShop";

dotenv.config();

const app = express();

app.use(express.json());

// 🔥 CORS AYARLARINI BURAYA KOY
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ai-shop-site-4l2fnl58t-serhats-projects-cbfdb63c.vercel.app"
    ],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

// OPTIONS FIX – Mobil ve tarayıcı için kritik
app.options("*", (_, res) => {
  res.sendStatus(200);
});

// ROOT
app.get("/", (req, res) => {
  return res.json({ ok: true, message: "FlowAI Backend running" });
});

// ROUTES
app.use("/products", productImportRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);
app.use("/auth", authShopRouter);

// QR IMAGE route
app.use("/api/qr-image", qrImageRouter);

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Backend started at port:", PORT);
});
