import "dotenv/config";
import express from "express";
import cors from "cors";

import assistantRouter from "./routes/assistant.js";
import chatPage from "./routes/chatPage.js";

const app = express();

/* ===============================
   MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (_req, res) => {
  res.send("✅ AI Shop Backend çalışıyor");
});

/* ===============================
   CHAT UI (HTML)
   URL: /chat/:shopId
================================ */
app.use("/chat", chatPage);

/* ===============================
   ASSISTANT API
   POST /api/assistant/:shopId
================================ */
app.use("/api/assistant", assistantRouter);

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on PORT: ${PORT}`);
});
