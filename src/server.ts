import express from "express";
import cors from "cors";
import assistantRouter from "./routes/assistant.js";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/api/health", (req, res) => {
  res.send("Backend çalıştı 🚀");
});

// ROUTER BURADA DOĞRU YERDE
app.use("/api/assistant", assistantRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
