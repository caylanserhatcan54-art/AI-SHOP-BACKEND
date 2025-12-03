import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// ROOT CHECK  ← BUNU EKLİYORUZ
app.get("/", (req, res) => {
  res.json({ ok: true, message: "FlowAI Backend Active ✔" });
});

// ROUTES
import { aiRouter } from "./routes/aiRouter";
import { productsRouter } from "./routes/products";


app.use("/ai", aiRouter);
app.use("/products", productsRouter);

// PORT MUTLAKA ENV PORT OLMALI!
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend çalışıyor → http://localhost:${PORT}`);
});
