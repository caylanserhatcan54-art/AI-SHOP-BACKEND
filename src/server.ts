import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ENV okumayı başlat
dotenv.config();

// 🔥 Firebase Admin initialize (İLK ÖNCE GELİR)
import "./config/firebase-admin";  
// Bu import sayesinde admin.initializeApp() çalışır
// Aşağıdaki tüm Firestore erişimleri artık çalışır

// ROUTER imports
import productImportRouter from "./routes/productImport";
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";

const app = express();
app.use(cors());
app.use(express.json());

// ROOT
app.get("/", (req, res) =>
  res.json({ ok: true, msg: "FlowAI backend aktif" })
);

// HEALTH
app.get("/health", (req, res) =>
  res.json({ ok: true })
);

// PRODUCT IMPORT ROUTE
app.use("/products", productImportRouter);

// PUBLIC ROUTES (Mağaza, ürünler)
app.use("/api/public", publicRouter);

// AI ROUTES (LLM chat)
app.use("/api/ai", aiRouter);

// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log("🔥 FlowAI Backend Running on PORT:", PORT)
);
