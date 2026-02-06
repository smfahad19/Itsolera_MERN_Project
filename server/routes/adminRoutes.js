import express from "express";
import {
  // User Management
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,

  // Dashboard Stats
  getDashboardStats,

  // Customer Verification
  getPendingVerifications,
  getCustomerVerificationDetails,
  approveCustomerVerification,
  rejectCustomerVerification,

  // Seller Management
  getAllSellers,
  getPendingSellers,
  getSellerApprovalDetails,
  approveSeller,
  rejectSeller,
  suspendSeller,
  verifySellerDocument,

  // Product Management
  getAllProducts,
  updateProductStatus,
  deleteProduct,

  // Category Management
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
  getProductById,
} from "../controllers/admin/adminController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticate, authorize("admin"));

// ==================== USER MANAGEMENT ====================
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// ==================== DASHBOARD ====================
router.get("/dashboard/stats", getDashboardStats);

// ==================== CUSTOMER VERIFICATION ====================
router.get("/customers/verification/pending", getPendingVerifications);
router.get(
  "/customers/verification/:customerId",
  getCustomerVerificationDetails,
);
router.put(
  "/customers/verification/:customerId/approve",
  approveCustomerVerification,
);
router.put(
  "/customers/verification/:customerId/reject",
  rejectCustomerVerification,
);

// ==================== SELLER MANAGEMENT ====================
router.get("/sellers", getAllSellers);
router.get("/sellers/pending", getPendingSellers);
router.get("/sellers/:sellerId", getSellerApprovalDetails);
router.put("/sellers/:sellerId/approve", approveSeller);
router.put("/sellers/:sellerId/reject", rejectSeller);
router.put("/sellers/:sellerId/suspend", suspendSeller);
router.put("/sellers/:sellerId/documents/verify", verifySellerDocument);

// ==================== PRODUCT MANAGEMENT ====================
router.get("/products", getAllProducts);
router.put("/products/:id/status", updateProductStatus);
router.delete("/products/:id", deleteProduct);

router.get("/products/:id", getProductById);

// ==================== CATEGORY MANAGEMENT ====================
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.put("/categories/:id/status", updateCategoryStatus);
router.delete("/categories/:id", deleteCategory);

export default router;
