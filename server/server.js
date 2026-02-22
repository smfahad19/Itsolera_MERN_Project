
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://markethubfront.vercel.app",
      "https://markethubfront-q0dos0p80-fahads-projects-c5bdce25.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected successfully"))
  .catch((err) => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("Backend Running perfectly");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/customer", customerRoutes);

export default app;
