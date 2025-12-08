import express from "express";
import assistantRouter from "./routes/assistant.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("FlowAI Backend ✔️ Çalışıyor!");
});

app.use("/assistant", assistantRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend çalıştı PORT:", PORT));
