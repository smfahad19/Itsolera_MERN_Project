import mongoose from "mongoose";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";

// ==================== USER MANAGEMENT ====================

// Get all users with filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      verificationStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    // Filter by role
    if (role && ["customer", "seller", "admin"].includes(role)) {
      query.role = role;
    }

    // Filter by verification status (for customers)
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
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    // Get counts for stats
    const counts = {
      total: await User.countDocuments(),
      customers: await User.countDocuments({ role: "customer" }),
      sellers: await User.countDocuments({ role: "seller" }),
      admins: await User.countDocuments({ role: "admin" }),
      pendingVerification: await User.countDocuments({
        role: "customer",
        verificationStatus: "pending",
      }),
      pendingSellers: await User.countDocuments({
        role: "seller",
        approvalStatus: "pending",
      }),
    };

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      stats: counts,
      users: users.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verificationStatus: user.verificationStatus,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus,
        businessName: user.businessName,
        phone: user.phone,
        createdAt: user.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1,
      },
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let additionalInfo = {};

    // Get user's orders if customer
    if (user.role === "customer") {
      const orders = await Order.find({ customerId: id })
        .sort({ createdAt: -1 })
        .limit(10);
      additionalInfo.orders = orders;
    }

    // Get seller's products if seller
    if (user.role === "seller") {
      const products = await Product.find({ sellerId: id })
        .select("title price stock isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(10);
      additionalInfo.products = products;

      const orders = await Order.find({ sellerId: id })
        .sort({ createdAt: -1 })
        .limit(10);
      additionalInfo.sellerOrders = orders;
    }

    res.status(200).json({
      success: true,
      user,
      additionalInfo,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
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

    const oldRole = user.role;
    user.role = role;

    // Reset verification status for new customers
    if (role === "customer") {
      user.verificationStatus = "unverified";
      user.verificationRejectionReason = "";
      user.verificationNotes = "";
    }

    // Reset approval status for new sellers
    if (role === "seller") {
      user.approvalStatus = "pending";
      user.isApproved = false;
      user.rejectionReason = "";
      user.approvalNotes = "";
    }

    // If changing from seller to other role, reset seller specific fields
    if (oldRole === "seller" && role !== "seller") {
      user.businessName = "";
      user.businessDescription = "";
      user.businessAddress = "";
      user.businessPhone = "";
      user.businessWebsite = "";
      user.businessType = "individual";
      user.taxId = "";
      user.registrationNumber = "";
      user.businessDocuments = [];
      user.bankDetails = {};
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${role} successfully`,
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

// Update user verification/approval status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, reason, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (type === "verification" && user.role === "customer") {
      if (!["unverified", "pending", "verified", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification status",
        });
      }

      user.verificationStatus = status;

      if (status === "verified") {
        user.verifiedAt = new Date();
        user.verifiedBy = req.user._id;
      } else if (status === "rejected") {
        user.verificationRejectionReason = reason || "";
      }

      if (notes) {
        user.verificationNotes = notes;
      }
    } else if (type === "approval" && user.role === "seller") {
      // REMOVE "suspended" from this check since it's not in the enum
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid approval status",
        });
      }

      user.approvalStatus = status;
      user.isApproved = status === "approved";

      if (status === "approved") {
        user.approvedAt = new Date();
        user.approvedBy = req.user._id;
      } else if (status === "rejected") {
        user.rejectionReason = reason || "";
      }

      if (notes) {
        user.approvalNotes = notes;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type for user role",
      });
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `User ${type} status updated to ${status} successfully`,
      user: userResponse,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

// ==================== CUSTOMER VERIFICATION ====================

// Get pending verification customers
export const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pendingCustomers = await User.find({
      role: "customer",
      verificationStatus: "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPending = await User.countDocuments({
      role: "customer",
      verificationStatus: "pending",
    });

    res.status(200).json({
      success: true,
      count: pendingCustomers.length,
      total: totalPending,
      customers: pendingCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPending / limit),
        hasNext: skip + pendingCustomers.length < totalPending,
        hasPrev: page > 1,
      },
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

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

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
        totalSpent: orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0,
        ),
        averageOrderValue:
          orders.length > 0
            ? (
                orders.reduce(
                  (sum, order) => sum + (order.totalAmount || 0),
                  0,
                ) / orders.length
              ).toFixed(2)
            : 0,
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
    });
  }
};

// Reject customer verification
export const rejectCustomerVerification = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason, notes } = req.body;

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
    if (notes) {
      customer.verificationNotes = notes;
    }

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

// ==================== SELLER MANAGEMENT ====================

// Get all sellers with filters
export const getAllSellers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { role: "seller" };

    // REMOVE "suspended" from status filter since it's not in the enum
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.approvalStatus = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const sellers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSellers = await User.countDocuments(query);

    // Get counts - REMOVE "suspended" from counts
    const counts = {
      total: await User.countDocuments({ role: "seller" }),
      pending: await User.countDocuments({
        role: "seller",
        approvalStatus: "pending",
      }),
      approved: await User.countDocuments({
        role: "seller",
        approvalStatus: "approved",
      }),
      rejected: await User.countDocuments({
        role: "seller",
        approvalStatus: "rejected",
      }),
    };

    res.status(200).json({
      success: true,
      count: sellers.length,
      total: totalSellers,
      stats: counts,
      sellers: sellers.map((seller) => ({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        businessType: seller.businessType,
        approvalStatus: seller.approvalStatus,
        isApproved: seller.isApproved,
        rejectionReason: seller.rejectionReason,
        businessDocuments: seller.businessDocuments,
        createdAt: seller.createdAt,
        approvedAt: seller.approvedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalSellers / limit),
        hasNext: skip + sellers.length < totalSellers,
        hasPrev: page > 1,
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

// Get pending sellers
export const getPendingSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pendingSellers = await User.find({
      role: "seller",
      approvalStatus: "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPending = await User.countDocuments({
      role: "seller",
      approvalStatus: "pending",
    });

    res.status(200).json({
      success: true,
      count: pendingSellers.length,
      total: totalPending,
      sellers: pendingSellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPending / limit),
        hasNext: skip + pendingSellers.length < totalPending,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Pending Sellers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get seller details
export const getSellerApprovalDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId).select("-password");

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Get seller's products
    const products = await Product.find({ sellerId })
      .select("title price stock isActive category createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get seller's orders
    const orders = await Order.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      seller,
      businessInfo: {
        businessName: seller.businessName,
        businessDescription: seller.businessDescription,
        businessAddress: seller.businessAddress,
        businessPhone: seller.businessPhone,
        businessWebsite: seller.businessWebsite,
        businessType: seller.businessType,
        taxId: seller.taxId,
        registrationNumber: seller.registrationNumber,
        businessDocuments: seller.businessDocuments,
        bankDetails: seller.bankDetails,
      },
      approvalInfo: {
        isApproved: seller.isApproved,
        approvalStatus: seller.approvalStatus,
        approvedAt: seller.approvedAt,
        approvedBy: seller.approvedBy,
        rejectionReason: seller.rejectionReason,
        approvalNotes: seller.approvalNotes,
      },
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        activeProducts: products.filter((p) => p.isActive).length,
        totalRevenue: orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0,
        ),
      },
      recentProducts: products,
      recentOrders: orders,
    });
  } catch (error) {
    console.error("Get Seller Approval Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Approve seller
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
    });
  }
};

// Reject seller
export const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason, notes } = req.body;

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

    if (notes) {
      seller.approvalNotes = notes;
    }

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

// Suspend seller - FIXED: Use "rejected" status instead of "suspended"
export const suspendSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason, suspensionDays = 30, notes } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required",
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

    const suspensionEnd = new Date();
    suspensionEnd.setDate(suspensionEnd.getDate() + parseInt(suspensionDays));

    // Instead of "suspended", use "rejected" and add suspension info
    seller.approvalStatus = "rejected";
    seller.isApproved = false;
    seller.rejectionReason = `SUSPENDED: ${reason} (Until: ${suspensionEnd.toDateString()})`;
    seller.suspensionEnd = suspensionEnd;

    if (notes) {
      seller.approvalNotes = notes;
    }

    await seller.save();

    const sellerResponse = seller.toObject();
    delete sellerResponse.password;

    res.status(200).json({
      success: true,
      message: `Seller suspended until ${suspensionEnd.toDateString()}`,
      seller: sellerResponse,
    });
  } catch (error) {
    console.error("Suspend Seller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Verify seller document
export const verifySellerDocument = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { documentIndex, verified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (!seller.businessDocuments || !seller.businessDocuments[documentIndex]) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    seller.businessDocuments[documentIndex].verified = verified;
    seller.businessDocuments[documentIndex].verifiedAt = new Date();

    await seller.save();

    res.status(200).json({
      success: true,
      message: `Document ${verified ? "verified" : "unverified"} successfully`,
      document: seller.businessDocuments[documentIndex],
    });
  } catch (error) {
    console.error("Verify Seller Document Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

// Get all products with filters (Admin)
export const getAllProducts = async (req, res) => {
  try {
    const { search, category, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    // Filter by active status
    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("sellerId", "name email businessName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalProducts / limit),
        hasNext: skip + products.length < totalProducts,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update product status (Admin)
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
      product,
    });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete product (Admin)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async (req, res) => {
  try {
    // User Stats
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Customer Verification Stats
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

    // Seller Approval Stats - REMOVE "suspended" from counts
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

    // Order Stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const totalRevenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const recentRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const recentRevenue = recentRevenueResult[0]?.total || 0;

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
          totalRevenue: totalRevenue,
          recentRevenue: recentRevenue,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
        },
      },
      timeline: {
        date: new Date().toISOString(),
        period: "30 days",
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

// ==================== CATEGORY MANAGEMENT ====================

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parentCategory", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get All Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id).populate(
      "parentCategory",
      "name",
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      description,
      parentCategory: parentCategory || null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if another category with same name exists
    if (name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: id },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
    }

    category.name = name;
    category.description = description || "";
    category.parentCategory = parentCategory || null;
    category.updatedAt = new Date();

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update category status
export const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = isActive;
    category.updatedAt = new Date();

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${isActive ? "activated" : "deactivated"} successfully`,
      category,
    });
  } catch (error) {
    console.error("Update Category Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has subcategories
    const hasSubcategories = await Category.countDocuments({
      parentCategory: id,
    });

    if (hasSubcategories > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with subcategories",
      });
    }

    // Check if category has products
    const hasProducts = await Product.countDocuments({ category: id });

    if (hasProducts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with products",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get product by ID with populated fields
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("sellerId", "name email businessName")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Transform the response to match frontend expectations
    const transformedProduct = {
      ...product,
      seller: product.sellerId,
    };
    delete transformedProduct.sellerId; // sellerId hata do

    res.status(200).json({
      success: true,
      product: transformedProduct,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
};
