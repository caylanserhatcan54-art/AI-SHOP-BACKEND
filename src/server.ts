import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import aiRouter from "./routes/aiRouter";
import assistantRoutes from "./routes/assistant";


const app = express();
app.use(cors());
app.use(bodyParser.json());

// HEALTH
app.get("/", (req, res) => {
  res.send("FlowAI backend running ✔");
});

// AI ENDPOINT
app.use("/assistant", assistantRoutes);
app.use("/assistant", aiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("🔥 API is running on " + PORT));
