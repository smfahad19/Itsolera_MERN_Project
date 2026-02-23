import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import sellerRoutes from "../routes/sellerRoutes.js";
import customerRoutes from "../routes/customerRoutes.js";

dotenv.config();

const app = express();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB Connected successfully");
  } catch (error) {
    console.log("MongoDB Error:", error);
  }
};

app.use(
  cors({
    origin: [
      "https://markethubfront.vercel.app",
      "https://markethubfront-mfm4dp0mq-fahads-projects-c5bdce25.vercel.app",
      "https://markethub-azure.vercel.app",
      "https://market-mxq9eu6mp-fahads-projects-c5bdce25.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.get("/", (req, res) => {
  res.send("Backend Running perfectly");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/customer", customerRoutes);

export default app;
