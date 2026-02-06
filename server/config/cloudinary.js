import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Log to check if credentials are loading
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY
    ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4)
    : "Not set",
  api_secret: process.env.CLOUDINARY_API_SECRET
    ? "***" + process.env.CLOUDINARY_API_SECRET.slice(-4)
    : "Not set",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
