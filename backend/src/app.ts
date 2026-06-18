import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import visitorRoutes from "./routes/visitorRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Ziyaretçi takip backend çalışıyor");
});

app.use("/api/auth", authRoutes);
app.use("/api/visitors", visitorRoutes);

export default app;