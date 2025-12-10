import express from "express";
import cors from "cors";
import assistantRouter from "./routes/assistant.js";
import shopRoutes from "./routes/shopRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());
// test
app.get("/", (req, res) => res.send("Backend 🎯 çalışıyor"));
// routelar
app.use("/api/assistant", assistantRouter);
app.use("/api/shop", shopRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend running on", PORT));
