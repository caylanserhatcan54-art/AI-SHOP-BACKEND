import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shoproutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
// MIDDLEWARES
app.use(cors());
app.use(express.json());
// ROUTES
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);
// STATIC QR SERVING
app.use("/qr", express.static(path.join(process.cwd(), "public", "qr")));
// DEFAULT TEST ROUTE
app.get("/", (req, res) => {
    res.send("Backend aktif ✔ QR aktif ✔ Assistant aktif 🤖");
});
// SERVER LISTEN
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on PORT: ${PORT}`));
