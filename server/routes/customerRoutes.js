import express from "express";
import {
  getDashboard,
  getCustomerProfile,
  updateCustomerProfile,
  getAllProducts,
  getProduct,
  getFeaturedProducts,
  getProductsByCategory, // Updated function
  getDiscountedProducts,
  addProductReview,
  getProductReviews,
  getCategories,
} from "../controllers/customer/customerController.js";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/customer/cartController.js";

import {
  getOrders,
  getOrder,
  createOrder,
  cancelOrder,
} from "../controllers/customer/orderController.js";

import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/products", getAllProducts);
router.get("/products/featured", getFeaturedProducts);
router.get("/products/discounted", getDiscountedProducts);
router.get("/products/category/:categoryId", getProductsByCategory); // Changed from :slug to :categoryId
router.get("/products/:id", getProduct);
router.get("/products/:id/reviews", getProductReviews);
router.get("/categories", getCategories);

// Protected routes (require customer authentication)
router.use(authenticate, authorize("customer"));

// Dashboard and Profile routes
router.get("/dashboard", getDashboard);
router.get("/profile", getCustomerProfile);
router.put("/profile", updateCustomerProfile);

// Cart routes
router.get("/cart", getCart);
router.post("/cart/:productId", addToCart);
router.put("/cart/:productId", updateCartItem);
router.delete("/cart/:productId", removeFromCart);
router.delete("/cart", clearCart);

// Order routes
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.post("/orders", createOrder);
router.put("/orders/:id/cancel", cancelOrder);

// Review routes
router.post("/products/:id/reviews", addProductReview);

export default router;
