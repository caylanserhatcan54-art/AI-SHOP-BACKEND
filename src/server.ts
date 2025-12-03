import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// ROUTES
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { aiRouter } from "./routes/aiRouter";
import { publicRouter } from "./routes/public";
import { uploadRouter } from "./routes/upload";
import { aiSettingsRouter } from "./routes/ai-settings";
import { healthRouter } from "./routes/health";

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

// HEALTH CHECK (Render için çok önemli)
app.get("/api/health", (req, res) => {
  return res.json({
    ok: true,
    message: "FlowAI backend is healthy ✔"
  });
});

// MAIN ROUTERS
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/public", publicRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/ai-settings", aiSettingsRouter);

// EXTRA: health router
app.use("/api", healthRouter);

// ROOT PING
app.get("/", (req, res) => {
  res.send("FlowAI Backend Çalışıyor ✔");
});

// SERVER START
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
