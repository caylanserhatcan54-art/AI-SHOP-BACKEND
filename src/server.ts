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

// CORS FIX 🚨
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ai-shop-site-8c33o3slc-serhats-projects-cbfdb63c.vercel.app",
      "https://ai-shop-site-rk19afcy8-serhats-projects-cbfdb63c.vercel.app",
      "https://ai-shop-site.vercel.app"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);

app.use(express.json());

// ROOT
app.get("/", (req, res) => {
  return res.json({ ok: true, message: "FlowAI Backend running" });
});

// ROUTES
app.use("/products", productImportRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);

app.use("/auth", authShopRouter);

// QR
app.use("/api/qr-image", qrImageRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Backend started at port:", PORT);
});
