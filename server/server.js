import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();

const app = express();

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) return cachedConnection;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    cachedConnection = conn;
    console.log("MongoDB Connected");
    return conn;
  } catch (error) {
    console.log("MongoDB Error:", error);
    throw error;
  }
}

app.use(
  cors({
    origin: ["http://localhost:5173", "https://markethubfront.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({ message: "Database connection failed" });
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
