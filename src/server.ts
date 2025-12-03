import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH CHECK (her iki endpoint'e de cevap verir)
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// ROUTES
import { aiRouter } from "./routes/aiRouter";
import { productsRouter } from "./routes/productsRouter";

app.use("/ai", aiRouter);
app.use("/products", productsRouter);

// PORT MUTLAKA ENV PORT OLMALI!
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
