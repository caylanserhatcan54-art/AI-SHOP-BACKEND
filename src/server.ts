import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// STATIC QR SERVE
app.use("/qr", express.static(path.join(__dirname, "../public/qr")));

app.get("/", (req, res) => {
  res.send("Backend çalışıyor ✔ QR hazır ✔ Assistant çalışıyor 🤖");
});

// ROUTES
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend running on", PORT));
