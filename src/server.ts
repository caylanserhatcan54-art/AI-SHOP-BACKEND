import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// Routes
import aiRouter from "./routes/aiRouter.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("FlowAI backend running ✔");
});

// REGISTER AI ROUTE
app.use("/assistant", aiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("🔥 Server is running on", PORT));
