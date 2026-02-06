import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = "cod", notes } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order",
      });
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.country ||
      !shippingAddress.zipCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    let totalAmount = 0;
    let shippingCharge = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    // Process each item
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}`,
        });
      }

      // Calculate item total
      const price = product.discountPrice || product.price;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      // Update product stock
      product.stock -= item.quantity;
      await product.save({ validateBeforeSave: false });

      // Update item with product details
      item.price = price;
      item.productTitle = product.title;
      item.productImage = product.images?.[0] || "";
      item.sellerId = product.sellerId;
    }

    // Calculate shipping (free over $50)
    shippingCharge = totalAmount >= 50 ? 0 : 10;

    // Calculate tax (10% of total)
    taxAmount = totalAmount * 0.1;

    // Calculate final amount
    const finalAmount =
      totalAmount + shippingCharge + taxAmount - discountAmount;

    // Generate unique orderId
    const generateOrderId = () => {
      const prefix = "ORD";
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `${prefix}${timestamp}${random}`;
    };

    // Create order with orderId
    const order = new Order({
      orderId: generateOrderId(), // Generate orderId here
      customerId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      totalAmount,
      shippingCharge,
      taxAmount,
      discountAmount,
      finalAmount,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Save the order
    await order.save();

    // Clear cart if order was created from cart
    if (req.body.clearCart) {
      await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};
// Get all orders
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customerId: req.user._id };

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate({
        path: "items.productId",
        select: "title image",
      })
      .populate({
        path: "items.sellerId",
        select: "name businessName",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customerId: req.user._id,
    })
      .populate({
        path: "items.productId",
        select: "title description image specifications",
      })
      .populate({
        path: "items.sellerId",
        select: "name businessName email phone",
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: id,
      customerId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in ${order.orderStatus} status`,
      });
    }

    // Update order status
    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledReason = reason;

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
};
