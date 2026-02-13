import User from "../../models/User.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";

// Get dashboard with stats
export const getDashboard = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);

    if (
      seller.role === "seller" &&
      (!seller.isApproved || seller.approvalStatus !== "approved")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your seller account is pending approval. Please wait for admin approval.",
        approvalStatus: seller.approvalStatus,
        isApproved: seller.isApproved,
        rejectionReason: seller.rejectionReason || "",
      });
    }

    // Get real stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total products
    const totalProducts = await Product.countDocuments({
      sellerId: seller._id,
    });

    // Get active products
    const activeProducts = await Product.countDocuments({
      sellerId: seller._id,
      isActive: true,
    });

    // Get orders that have items from this seller
    const sellerOrders = await Order.find({
      "items.sellerId": seller._id,
    });

    const totalOrders = sellerOrders.length;

    // Get pending orders (last 30 days)
    const pendingOrders = sellerOrders.filter(
      (order) =>
        order.orderStatus === "pending" && order.createdAt >= thirtyDaysAgo,
    ).length;

    // Get processing orders (last 30 days)
    const processingOrders = sellerOrders.filter(
      (order) =>
        order.orderStatus === "processing" && order.createdAt >= thirtyDaysAgo,
    ).length;

    // Get completed orders (last 30 days)
    const completedOrders = sellerOrders.filter(
      (order) =>
        order.orderStatus === "delivered" && order.createdAt >= thirtyDaysAgo,
    ).length;

    // Get total revenue (from completed orders)
    let totalRevenue = 0;
    sellerOrders.forEach((order) => {
      if (order.orderStatus === "delivered" && order.paymentStatus === "paid") {
        // Calculate revenue from items belonging to this seller
        const sellerItems = order.items.filter(
          (item) =>
            item.sellerId && item.sellerId.toString() === seller._id.toString(),
        );

        sellerItems.forEach((item) => {
          totalRevenue += item.price * item.quantity;
        });
      }
    });

    // Get recent revenue (last 30 days)
    let recentRevenue = 0;
    sellerOrders.forEach((order) => {
      if (
        order.orderStatus === "delivered" &&
        order.paymentStatus === "paid" &&
        order.createdAt >= thirtyDaysAgo
      ) {
        const sellerItems = order.items.filter(
          (item) =>
            item.sellerId && item.sellerId.toString() === seller._id.toString(),
        );

        sellerItems.forEach((item) => {
          recentRevenue += item.price * item.quantity;
        });
      }
    });

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.find({
      "items.sellerId": seller._id,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId orderStatus totalAmount createdAt paymentStatus");

    // Get low stock products
    const lowStockProducts = await Product.find({
      sellerId: seller._id,
      stock: { $lt: 10 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5)
      .select("title stock price");

    res.status(200).json({
      success: true,
      message: "Welcome to Seller Dashboard",
      user: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
        businessName: seller.businessName,
        approvalStatus: seller.approvalStatus,
        isApproved: seller.isApproved,
      },
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
        recentRevenue,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filter orders where at least one item belongs to this seller
    let query = {
      "items.sellerId": sellerId,
    };

    // Add status filter if provided
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // Get orders with seller's items
    const orders = await Order.find(query)
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    // Filter items to show only seller's items for each order
    const filteredOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) =>
          item.sellerId && item.sellerId.toString() === sellerId.toString(),
      );

      // Calculate seller's total for this order
      const sellerTotal = sellerItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      return {
        ...order,
        items: sellerItems,
        sellerTotalAmount: sellerTotal,
        customerName: order.customerId?.name || "N/A",
        customerEmail: order.customerId?.email || "N/A",
      };
    });

    // Calculate totals
    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders: filteredOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: page > 1,
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
      .populate("customerId", "name email phone")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you don't have permission",
      });
    }

    // Filter items to show only seller's items
    const sellerItems = order.items.filter(
      (item) =>
        item.sellerId && item.sellerId.toString() === sellerId.toString(),
    );

    // Calculate seller's total
    const sellerTotal = sellerItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Create order copy with filtered items
    const orderWithSellerItems = {
      ...order,
      items: sellerItems,
      sellerTotalAmount: sellerTotal,
      customerName: order.customerId?.name || "N/A",
      customerEmail: order.customerId?.email || "N/A",
      customerPhone: order.customerId?.phone || "N/A",
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

// Update order status (for seller) - FIXED VERSION
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

    // Find order with seller's items
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

    // Define allowed transitions
    const allowedTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // No further updates
      cancelled: [], // No further updates
    };

    // Check if transition is allowed
    const currentStatus = order.orderStatus;
    if (
      !allowedTransitions[currentStatus]?.includes(status) &&
      currentStatus !== status
    ) {
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
    } else if (status === "processing" && !order.processedAt) {
      order.processedAt = new Date();
    } else if (status === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    // Save order
    await order.save({ validateBeforeSave: false });

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

    // Only delivered orders can be marked as paid
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

    await order.save({ validateBeforeSave: false });

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

// Get seller stats for dashboard
export const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total products
    const totalProducts = await Product.countDocuments({ sellerId });

    // Get active products
    const activeProducts = await Product.countDocuments({
      sellerId,
      isActive: true,
    });

    // Get total orders with seller's items
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

    // Get completed/delivered orders (last 30 days)
    const completedOrders = await Order.countDocuments({
      "items.sellerId": sellerId,
      orderStatus: "delivered",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total revenue (ALL TIME) - FIXED QUERY
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

    // Get revenue for last 30 days
    const recentRevenueResult = await Order.aggregate([
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
          recentRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
    ]);

    const recentRevenue =
      recentRevenueResult.length > 0 ? recentRevenueResult[0].recentRevenue : 0;

    // Get recent orders (last 7 days)
    const recentOrders = await Order.find({
      "items.sellerId": sellerId,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId orderStatus totalAmount createdAt paymentStatus")
      .lean();

    // Get low stock products
    const lowStockProducts = await Product.find({
      sellerId,
      stock: { $lt: 10 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5)
      .select("title stock price images category")
      .lean();

    // Get order status counts for summary
    const statusCounts = await Order.aggregate([
      {
        $match: {
          "items.sellerId": sellerId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object
    const statusStats = {};
    statusCounts.forEach((stat) => {
      statusStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders: statusStats.pending || 0,
        processingOrders: statusStats.processing || 0,
        completedOrders: statusStats.delivered || 0,
        totalRevenue,
        recentRevenue,
        lowStockCount: lowStockProducts.length,
        // Additional stats
        cancelledOrders: statusStats.cancelled || 0,
        shippedOrders: statusStats.shipped || 0,
      },
      recentOrders: recentOrders.map((order) => ({
        ...order,
        customerName: order.customerId?.name || "Customer",
        customerEmail: order.customerId?.email || "",
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        ...product,
        image: product.images?.[0] || null,
      })),
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

export const getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      seller,
      approvalInfo: {
        isApproved: seller.isApproved,
        approvalStatus: seller.approvalStatus,
        message:
          seller.approvalStatus === "pending"
            ? "Your account is pending admin approval"
            : seller.approvalStatus === "rejected"
              ? `Your account was rejected: ${seller.rejectionReason || "No reason provided"}`
              : "Your account is approved",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateSellerProfile = async (req, res) => {
  try {
    const {
      phone,
      address,
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      businessWebsite,
    } = req.body;

    const seller = await User.findById(req.user._id);

    if (phone) seller.phone = phone;

    if (businessName) seller.businessName = businessName;
    if (businessDescription) seller.businessDescription = businessDescription;
    if (businessAddress) seller.businessAddress = businessAddress;
    if (businessPhone) seller.businessPhone = businessPhone;
    if (businessWebsite) seller.businessWebsite = businessWebsite;
    if (address) seller.address = address;

    if (seller.approvalStatus === "pending") {
      seller.updatedAt = new Date();
    }

    await seller.save();

    const sellerResponse = seller.toObject();
    delete sellerResponse.password;

    res.status(200).json({
      success: true,
      message: "Seller profile updated successfully",
      seller: sellerResponse,
      approvalStatus: seller.approvalStatus,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const checkApprovalStatus = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      approvalStatus: seller.approvalStatus,
      isApproved: seller.isApproved,
      rejectionReason: seller.rejectionReason || "",
      message:
        seller.approvalStatus === "approved"
          ? "Your account is approved and active"
          : seller.approvalStatus === "pending"
            ? "Your account is pending admin approval"
            : `Your account was rejected: ${seller.rejectionReason || "Contact admin for details"}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
