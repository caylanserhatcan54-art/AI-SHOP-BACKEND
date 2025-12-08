import express from "express";
import cors from "cors";

import aiRouter from "./routes/aiRouter.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FLOW AI Backend is working 🚀");
});

// Yapay zeka endpoint
app.use("/assistant", aiRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("SERVER LISTENING: " + PORT));
