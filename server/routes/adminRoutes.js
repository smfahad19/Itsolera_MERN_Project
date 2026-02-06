import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getPendingSellers,
  getAllSellers,
  approveSeller,
  rejectSeller,
  getSellerApprovalDetails,
} from "../controllers/admin/adminController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// User Management
router.get("/all-users", getAllUsers);
router.get("/user/:id", getUserById);
router.put("/user/:id/role", updateUserRole);
router.delete("/delete-user/:id", deleteUser);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Seller Approval
router.get("/sellers", getAllSellers);
router.get("/sellers/pending", getPendingSellers);
router.get("/sellers/:sellerId/details", getSellerApprovalDetails);
router.put("/sellers/:sellerId/approve", approveSeller);
router.put("/sellers/:sellerId/reject", rejectSeller);

export default router;
