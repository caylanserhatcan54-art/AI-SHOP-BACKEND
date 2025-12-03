import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { aiRouter } from "./routes/ai";
import { publicRouter } from "./routes/public";
import { uploadRouter } from "./routes/upload";
import { aiSettingsRouter } from "./routes/ai-settings";

dotenv.config();

const app = express();

// public klasörü
app.use("/uploads", express.static("public/uploads"));

app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/public", publicRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/ai-settings", aiSettingsRouter);

app.get("/", (req, res) => {
  res.send("FlowAI Backend Çalışıyor ✔");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
