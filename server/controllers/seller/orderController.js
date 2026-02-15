import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

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
      .populate("customerId", "name email")
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

    res.status(200).json({
      success: true,
      orders,
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
      .populate("customerId", "name email phone address")
      .populate("items.productId", "title images");

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

    // Create order copy with filtered items
    const orderWithSellerItems = {
      ...order.toObject(),
      items: sellerItems,
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

    // Validation for cancellation
    if (status === "cancelled") {
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

    // Update order status
    order.orderStatus = status;

    // Set timestamps and reasons for specific statuses
    if (status === "delivered") {
      order.deliveredAt = new Date();
    } else if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancelledReason = reason;
    }

    // Save order without validation for sellerId
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

    // Get recent orders
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

    // Get low stock products
    const lowStockProducts = await Product.find({
      sellerId,
      stock: { $lt: 10 },
      isActive: true,
    })
      .sort({ stock: 1 })
      .limit(5)
      .select("title stock price");

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
      recentOrders,
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
