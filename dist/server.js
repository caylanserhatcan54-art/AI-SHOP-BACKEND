import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);
// STATIC FILES
app.use("/qr", express.static(path.join(process.cwd(), "public", "qr")));
app.get("/", (req, res) => {
    res.send("Backend çalışıyor ✔");
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
