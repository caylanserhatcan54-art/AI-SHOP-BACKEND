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
app.use(express.json());

app.use(cors({
  origin: [
    "https://ai-shop-site-rk19afcy8-serhats-projects-cbfdb63c.vercel.app",
    "https://flowai.site",
    "http://localhost:3000"
  ],
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

// ROOT
app.get("/", (req, res) => {
  return res.json({ ok: true, message: "FlowAI Backend running" });
});

// ROUTES
app.use("/products", productImportRouter);
app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);
app.use("/auth", authShopRouter);
app.use("/api/qr-image", qrImageRouter);

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Backend started at port:", PORT);
});
