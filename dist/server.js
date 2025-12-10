import express from "express";
import cors from "cors";
import path from "path";
import assistantRouter from "./routes/assistant.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/qr", express.static(path.join(__dirname, "../public/qr")));
// health
app.get("/api/health", (req, res) => {
    res.json({ message: "Backend çalışıyor 🚀" });
});
// assistant endpoint
app.use("/api/assistant", assistantRouter);
// PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
