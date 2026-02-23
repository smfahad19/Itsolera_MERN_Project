import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import sellerRoutes from "../routes/sellerRoutes.js";
import customerRoutes from "../routes/customerRoutes.js";

dotenv.config();

const app = express();

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) return cachedConnection;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });

    cachedConnection = conn;
    console.log("MongoDB Connected");
    return conn;
  } catch (error) {
    console.log("MongoDB Error:", error);
    throw error;
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
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend Running perfectly");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/customer", customerRoutes);

export default app;
