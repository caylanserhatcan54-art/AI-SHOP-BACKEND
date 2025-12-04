import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));

// ROOT
app.get("/", (req, res) => res.json({ ok: true, msg: "backend aktif" }));

// ROUTES
import { publicRouter } from "./routes/public";
import { aiRouter } from "./routes/aiRouter";

app.use("/api/public", publicRouter);
app.use("/api/ai", aiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend running:", PORT));
