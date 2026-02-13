import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import Category from "../../models/Category.js";

// ==================== DASHBOARD & PROFILE ====================

// Get seller dashboard
export const getDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get total products
    const totalProducts = await Product.countDocuments({ sellerId });

    // Get active products
    const activeProducts = await Product.countDocuments({
      sellerId,
      isActive: true,
    });

    // Get total orders
    const totalOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
    });

    // Get pending orders
    const pendingOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
      orderStatus: "pending",
    });

    // Get revenue from delivered orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerId,
          orderStatus: "delivered",
          paymentStatus: "paid",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.sellerId": sellerId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get low stock products
    const lowStockProducts = await Product.find({
      sellerId,
      stock: { $lt: 10 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5)
      .select("title stock price images");

    // Get recent orders
    const recentOrders = await Order.find({
      "items.sellerId": sellerId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name email")
      .select("orderId orderStatus totalAmount createdAt");

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
          totalOrders,
          pendingOrders,
          totalRevenue,
          lowStockCount: lowStockProducts.length,
        },
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get seller profile
export const getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id).select(
      "-password -refreshToken",
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    res.status(200).json({
      success: true,
      data: seller,
    });
  } catch (error) {
    console.error("Get Seller Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update seller profile
export const updateSellerProfile = async (req, res) => {
  try {
    const { name, email, phone, address, storeName, storeDescription, taxId } =
      req.body;

    const seller = await User.findById(req.user._id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Update fields
    if (name) seller.name = name;
    if (email) seller.email = email;
    if (phone) seller.phone = phone;
    if (address) seller.address = address;

    // Update seller specific fields
    if (!seller.sellerProfile) seller.sellerProfile = {};
    if (storeName) seller.sellerProfile.storeName = storeName;
    if (storeDescription)
      seller.sellerProfile.storeDescription = storeDescription;
    if (taxId) seller.sellerProfile.taxId = taxId;

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: seller,
    });
  } catch (error) {
    console.error("Update Seller Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Check seller approval status
export const checkApprovalStatus = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        isApproved: seller.isApproved,
        approvalStatus: seller.approvalStatus,
        rejectionReason: seller.rejectionReason,
        sellerProfile: seller.sellerProfile,
      },
    });
  } catch (error) {
    console.error("Check Approval Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==================== ORDER MANAGEMENT ====================

// Get seller's orders
export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query to find orders with items belonging to this seller
    let query = {
      "items.sellerId": sellerId,
    };

    // Add status filter if provided
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // Get orders
    const orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate totals
    const totalOrders = await Order.countDocuments(query);

    // Calculate revenue from delivered orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerId,
          orderStatus: "delivered",
          paymentStatus: "paid",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.sellerId": sellerId,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get order status counts
    const statusCounts = await Order.aggregate([
      {
        $match: { "items.sellerId": sellerId },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert status counts to object
    const statusStats = {};
    statusCounts.forEach((stat) => {
      statusStats[stat._id] = stat.count;
    });

    // Process orders to include only seller's items and add product details
    const processedOrders = orders.map((order) => {
      const orderObj = order.toObject();

      // Filter items for this seller
      const sellerItems = orderObj.items.filter(
        (item) =>
          item.sellerId && item.sellerId.toString() === sellerId.toString(),
      );

      // Calculate seller's total amount
      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      return {
        ...orderObj,
        items: sellerItems,
        totalAmount: sellerTotal, // Override total amount with seller's portion
      };
    });

    res.status(200).json({
      success: true,
      orders: processedOrders,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders: statusStats.pending || 0,
        processingOrders: statusStats.processing || 0,
        shippedOrders: statusStats.shipped || 0,
        deliveredOrders: statusStats.delivered || 0,
        cancelledOrders: statusStats.cancelled || 0,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get Seller Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single seller order
export const getSellerOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      "items.sellerId": sellerId,
    })
      .populate("customerId", "name email phone address")
      .populate("items.productId", "title images price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you don't have permission",
      });
    }

    // Filter items to show only seller's items
    const sellerItems = order.items
      .filter(
        (item) =>
          item.sellerId && item.sellerId.toString() === sellerId.toString(),
      )
      .map((item) => ({
        ...item.toObject(),
        productTitle: item.productId?.title || "Product",
        productImage: item.productId?.images?.[0] || null,
      }));

    // Calculate seller's total amount
    const sellerTotal = sellerItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order copy with filtered items
    const orderWithSellerItems = {
      ...order.toObject(),
      items: sellerItems,
      totalAmount: sellerTotal,
      originalTotalAmount: order.totalAmount,
    };

    res.status(200).json({
      success: true,
      order: orderWithSellerItems,
    });
  } catch (error) {
    console.error("Get Seller Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update order status (for seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Allowed status transitions
    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findOne({
      _id: id,
      "items.sellerId": sellerId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you don't have permission",
      });
    }

    // Check if seller can update this order
    const sellerItems = order.items.filter(
      (item) =>
        item.sellerId && item.sellerId.toString() === sellerId.toString(),
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this order",
      });
    }

    // Get current status
    const currentStatus = order.orderStatus;

    // VALIDATION RULES FOR STATUS TRANSITIONS
    const validTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // Cannot change from delivered
      cancelled: [], // Cannot change from cancelled
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${currentStatus} to ${status}`,
      });
    }

    // Validation for cancellation
    if (status === "cancelled") {
      // Check if order can be cancelled (only pending or processing)
      if (!["pending", "processing"].includes(order.orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Only pending or processing orders can be cancelled",
        });
      }

      // Require reason for cancellation
      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
      }
    }

    // Validation for delivered
    if (status === "delivered") {
      // Check if payment is completed
      if (order.paymentStatus !== "paid") {
        return res.status(400).json({
          success: false,
          message: "Cannot mark order as delivered until payment is completed",
        });
      }
    }

    // Update order status
    order.orderStatus = status;

    // Set timestamps and reasons for specific statuses
    if (status === "delivered") {
      order.deliveredAt = new Date();
    } else if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancelledReason = reason;
    }

    // If status is processing or shipped, add timestamps
    if (status === "processing" && !order.processedAt) {
      order.processedAt = new Date();
    }

    if (status === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    // Save order
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update payment status (for seller)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required",
      });
    }

    // Allowed payment statuses
    const allowedStatuses = ["pending", "paid", "failed"];

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findOne({
      _id: id,
      "items.sellerId": sellerId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you don't have permission",
      });
    }

    // Check if order is delivered before marking as paid
    if (paymentStatus === "paid" && order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be marked as paid",
      });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;

    if (paymentStatus === "paid") {
      order.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      order,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get seller dashboard stats
export const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total products
    const totalProducts = await Product.countDocuments({ sellerId });

    // Get active products
    const activeProducts = await Product.countDocuments({
      sellerId,
      isActive: true,
    });

    // Get total orders
    const totalOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
    });

    // Get pending orders (last 30 days)
    const pendingOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
      orderStatus: "pending",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get processing orders (last 30 days)
    const processingOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
      orderStatus: "processing",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get completed orders (last 30 days)
    const completedOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
      orderStatus: "delivered",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total revenue (from completed orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerId,
          orderStatus: "delivered",
          paymentStatus: "paid",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.sellerId": sellerId,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.find({
      "items.sellerId": sellerId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId orderStatus totalAmount createdAt");

    // Process recent orders to show seller's total
    const processedRecentOrders = recentOrders.map((order) => {
      const orderObj = order.toObject();
      const sellerItems =
        orderObj.items?.filter(
          (item) =>
            item.sellerId && item.sellerId.toString() === sellerId.toString(),
        ) || [];

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      return {
        ...orderObj,
        totalAmount: sellerTotal,
      };
    });

    // Get low stock products
    const lowStockProducts = await Product.find({
      sellerId,
      stock: { $lt: 10 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5)
      .select("title stock price images");

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders: processedRecentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("Get Seller Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
