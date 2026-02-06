import mongoose from "mongoose";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

// Get all users with filters
export const getAllUsers = async (req, res) => {
  try {
    const { role, verificationStatus, search } = req.query;

    // Build query
    let query = {};

    // Filter by role
    if (role && ["customer", "seller", "admin"].includes(role)) {
      query.role = role;
    }

    // Filter by verification status
    if (
      verificationStatus &&
      ["unverified", "pending", "verified", "rejected"].includes(
        verificationStatus,
      )
    ) {
      query.verificationStatus = verificationStatus;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Verification stats
    const unverifiedCustomers = await User.countDocuments({
      role: "customer",
      verificationStatus: "unverified",
    });
    const pendingVerification = await User.countDocuments({
      role: "customer",
      verificationStatus: "pending",
    });
    const verifiedCustomers = await User.countDocuments({
      role: "customer",
      verificationStatus: "verified",
    });
    const rejectedVerification = await User.countDocuments({
      role: "customer",
      verificationStatus: "rejected",
    });

    res.status(200).json({
      success: true,
      count: users.length,
      stats: {
        totalUsers,
        totalCustomers,
        totalSellers,
        totalAdmins,
        verification: {
          unverified: unverifiedCustomers,
          pending: pendingVerification,
          verified: verifiedCustomers,
          rejected: rejectedVerification,
        },
      },
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user by ID with detailed information
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's orders if customer
    let orders = [];
    if (user.role === "customer") {
      orders = await Order.find({ customerId: id })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get seller's products if seller
    let products = [];
    if (user.role === "seller") {
      products = await Product.find({ sellerId: id })
        .select("title price stock isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.status(200).json({
      success: true,
      user,
      additionalInfo: {
        orders,
        products,
      },
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["customer", "seller", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // Update role
    user.role = role;

    // Reset verification status for new customers
    if (role === "customer") {
      user.verificationStatus = "unverified";
    }

    // Reset approval status for new sellers
    if (role === "seller") {
      user.approvalStatus = "pending";
      user.isApproved = false;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Prevent deleting last admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin account",
        });
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= CUSTOMER VERIFICATION =================

// Get pending verification customers
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingCustomers = await User.find({
      role: "customer",
      verificationStatus: "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingCustomers.length,
      customers: pendingCustomers,
    });
  } catch (error) {
    console.error("Get Pending Verifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get customer verification details
export const getCustomerVerificationDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId).select("-password");

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get customer's orders history
    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      customer,
      verificationInfo: {
        status: customer.verificationStatus,
        verifiedAt: customer.verifiedAt,
        verifiedBy: customer.verifiedBy,
        rejectionReason: customer.verificationRejectionReason,
        notes: customer.verificationNotes,
      },
      ordersHistory: {
        totalOrders: orders.length,
        recentOrders: orders.slice(0, 10),
        totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
    });
  } catch (error) {
    console.error("Get Customer Verification Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Approve customer verification
export const approveCustomerVerification = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { notes } = req.body;

    console.log("=== APPROVE CUSTOMER VERIFICATION ===");
    console.log("Customer ID:", customerId);
    console.log("Admin ID:", req.user?._id);
    console.log("Notes:", notes);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }

    const customer = await User.findById(customerId);

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Update verification status
    customer.verificationStatus = "verified";
    customer.verifiedBy = req.user._id;
    customer.verifiedAt = new Date();

    if (notes) {
      customer.verificationNotes = notes;
    }

    await customer.save();

    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.status(200).json({
      success: true,
      message: "Customer verification approved successfully",
      customer: customerResponse,
    });
  } catch (error) {
    console.error("Approve Customer Verification Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while approving customer verification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reject customer verification
export const rejectCustomerVerification = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    console.log("=== REJECT CUSTOMER VERIFICATION ===");
    console.log("Customer ID:", customerId);
    console.log("Rejection reason:", reason);

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
      });
    }

    const customer = await User.findById(customerId);

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.verificationStatus = "rejected";
    customer.verificationRejectionReason = reason;

    await customer.save();

    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.status(200).json({
      success: true,
      message: "Customer verification rejected successfully",
      customer: customerResponse,
    });
  } catch (error) {
    console.error("Reject Customer Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reset customer verification (back to unverified)
export const resetCustomerVerification = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId);

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.verificationStatus = "unverified";
    customer.verifiedBy = null;
    customer.verifiedAt = null;
    customer.verificationRejectionReason = "";
    customer.verificationNotes = "";

    await customer.save();

    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.status(200).json({
      success: true,
      message: "Customer verification reset successfully",
      customer: customerResponse,
    });
  } catch (error) {
    console.error("Reset Customer Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= DASHBOARD STATS =================

export const getDashboardStats = async (req, res) => {
  try {
    // User Stats
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Verification Stats
    const unverifiedCustomers = await User.countDocuments({
      role: "customer",
      verificationStatus: "unverified",
    });
    const pendingVerification = await User.countDocuments({
      role: "customer",
      verificationStatus: "pending",
    });
    const verifiedCustomers = await User.countDocuments({
      role: "customer",
      verificationStatus: "verified",
    });
    const rejectedVerification = await User.countDocuments({
      role: "customer",
      verificationStatus: "rejected",
    });

    // Seller Approval Stats
    const pendingSellers = await User.countDocuments({
      role: "seller",
      approvalStatus: "pending",
    });
    const approvedSellers = await User.countDocuments({
      role: "seller",
      approvalStatus: "approved",
    });
    const rejectedSellers = await User.countDocuments({
      role: "seller",
      approvalStatus: "rejected",
    });

    // Order Stats
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // Product Stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 },
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          sellers: totalSellers,
          admins: totalAdmins,
        },
        verification: {
          unverified: unverifiedCustomers,
          pending: pendingVerification,
          verified: verifiedCustomers,
          rejected: rejectedVerification,
          verificationRate:
            totalCustomers > 0
              ? Math.round((verifiedCustomers / totalCustomers) * 100)
              : 0,
        },
        sellers: {
          pending: pendingSellers,
          approved: approvedSellers,
          rejected: rejectedSellers,
          approvalRate:
            totalSellers > 0
              ? Math.round((approvedSellers / totalSellers) * 100)
              : 0,
        },
        orders: {
          total: totalOrders,
          recent: recentOrders,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
        },
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= SELLER APPROVAL (Keep existing) =================

export const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await User.find({
      role: "seller",
      approvalStatus: "pending",
    }).select("-password");

    res.status(200).json({
      success: true,
      count: pendingSellers.length,
      sellers: pendingSellers,
    });
  } catch (error) {
    console.error("Get Pending Sellers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" })
      .select("-password")
      .sort({ createdAt: -1 });

    const pending = sellers.filter((s) => s.approvalStatus === "pending");
    const approved = sellers.filter((s) => s.approvalStatus === "approved");
    const rejected = sellers.filter((s) => s.approvalStatus === "rejected");

    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers,
      summary: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
    });
  } catch (error) {
    console.error("Get All Sellers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { notes } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID format",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(400).json({
        success: false,
        message: "User is not a seller",
      });
    }

    // Update seller approval status
    seller.isApproved = true;
    seller.approvalStatus = "approved";
    seller.approvedBy = req.user._id;
    seller.approvedAt = new Date();

    if (notes) {
      seller.approvalNotes = notes;
    }

    await seller.save();

    const sellerResponse = seller.toObject();
    delete sellerResponse.password;

    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      seller: sellerResponse,
    });
  } catch (error) {
    console.error("Approve Seller Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while approving seller",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID format",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    seller.isApproved = false;
    seller.approvalStatus = "rejected";
    seller.rejectionReason = reason;

    await seller.save();

    const sellerResponse = seller.toObject();
    delete sellerResponse.password;

    res.status(200).json({
      success: true,
      message: "Seller rejected successfully",
      seller: sellerResponse,
    });
  } catch (error) {
    console.error("Reject Seller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getSellerApprovalDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId).select("-password");

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    res.status(200).json({
      success: true,
      seller,
      approvalInfo: {
        isApproved: seller.isApproved,
        approvalStatus: seller.approvalStatus,
        approvedAt: seller.approvedAt,
        approvedBy: seller.approvedBy,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Get Seller Approval Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
