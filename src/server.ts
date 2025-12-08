import express from "express";
import assistantRouter from "./routes/assistant.js";

const app = express();
app.use(express.json());

// test endpoint
app.get("/", (req, res) => {
  res.send("Backend çalıştı 🚀");
});

// asıl endpoint
app.use("/assistant", assistantRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server ayakta PORT:", PORT));
