import express from "express";
import {
  getDashboard,
  getSellerProfile,
  updateSellerProfile,
  checkApprovalStatus,
  getSellerOrders, // Add this
  getSellerOrder, // Add this
  updateOrderStatus, // Add this
} from "../controllers/seller/sellerController.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getSellerProduct,
  updateStock,
  createCategoryBySeller,
  getSellerCategories,
} from "../controllers/seller/productController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.use(authenticate, authorize("seller"));

// Dashboard routes
router.get("/dashboard", getDashboard);
router.get("/profile", getSellerProfile);
router.put("/profile", updateSellerProfile);
router.get("/approval-status", checkApprovalStatus);

// Categories routes
router.post("/categories", createCategoryBySeller);
router.get("/categories", getSellerCategories);

// Product Management routes
router.post("/products", upload.array("images", 5), createProduct);
router.get("/products", getSellerProducts);
router.get("/products/:id", getSellerProduct);
router.put("/products/:id", upload.array("images", 5), updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/stock", updateStock);

// Order Management routes
router.get("/orders", getSellerOrders); // Add this
router.get("/orders/:id", getSellerOrder); // Add this
router.put("/orders/:id/status", updateOrderStatus); // Add this

export default router;
