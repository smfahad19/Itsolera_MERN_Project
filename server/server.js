// server.js (main entry)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://itsolera-mern-project-po64.vercel.app",
      "https://itsolera-mern-project-5n93.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// -------------------- MongoDB Connect with Retry --------------------
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const maxRetries = 3;
  let retries = 0;

  while (!isConnected && retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      retries++;
      console.log(`MongoDB connection failed. Retry ${retries}...`, error.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!isConnected) {
    console.error("MongoDB connection failed after retries");
  }
};

await connectDB();

// -------------------- Keep-alive Ping Route --------------------
app.get("/ping", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send("MongoDB awake ");
  } catch (err) {
    res.status(500).send("MongoDB ping failed ❌");
  }
});

app.get("/", (req, res) => res.send("Backend Running perfectly"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/customer", customerRoutes);

export default app;
