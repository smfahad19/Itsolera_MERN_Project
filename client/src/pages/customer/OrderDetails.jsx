import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiMapPin,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiArrowLeft,
} from "react-icons/fi";

const OrderDetails = () => {
  const { token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get image URL helper function - Improved
  const getImageUrl = (product) => {
    if (!product) return null;

    // Check if product has images array
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      // Check different possible image structures
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage; // If image is direct URL string
      } else if (firstImage.url) {
        return firstImage.url; // If image is { url: "...", public_id: "..." }
      } else if (firstImage.imageUrl) {
        return firstImage.imageUrl; // Alternative property name
      }
    }

    // Check for direct imageUrl property on product
    if (product.imageUrl) {
      return product.imageUrl;
    }

    // Check for productImage in item (fallback)
    if (product.productImage) {
      return product.productImage;
    }

    return null;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    if (token) {
      fetchOrder();
    }
  }, [token, id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/customer/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Order API response:", response.data); // Debug response

      if (response.data.success) {
        const orderData = response.data.order || response.data.data;
        setOrder(orderData);

        // Debug: Log order items structure
        console.log("Order items:", orderData.items);
        if (orderData.items && orderData.items.length > 0) {
          console.log("First item product:", orderData.items[0].productId);
        }
      } else {
        toast.error(response.data.message || "Order not found");
      }
    } catch (error) {
      console.error("Order details error:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist.
          </p>
          <Link
            to="/customer/orders"
            className="inline-flex items-center bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center">
                <Link
                  to="/customer/orders"
                  className="text-black hover:text-gray-700 mr-4"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-black">Order Details</h1>
              </div>
              <p className="text-gray-600 mt-2">
                Order #{order.orderId || order._id}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <span
                className={`px-4 py-2 rounded text-sm font-medium ${getStatusColor(order.orderStatus)}`}
              >
                {order.orderStatus?.toUpperCase() || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status */}
            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-xl font-bold text-black mb-6">
                Order Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiClock className="w-5 h-5 text-black mr-3" />
                    <div>
                      <p className="font-medium text-black">Order Placed</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                </div>

                {order.orderStatus !== "pending" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiRefreshCw className="w-5 h-5 text-black mr-3" />
                      <div>
                        <p className="font-medium text-black">Processing</p>
                        <p className="text-sm text-gray-600">In progress</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-black"></div>
                  </div>
                )}

                {["shipped", "delivered"].includes(order.orderStatus) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiTruck className="w-5 h-5 text-black mr-3" />
                      <div>
                        <p className="font-medium text-black">Shipped</p>
                        <p className="text-sm text-gray-600">On the way</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-black"></div>
                  </div>
                )}

                {order.orderStatus === "delivered" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiCheckCircle className="w-5 h-5 text-black mr-3" />
                      <div>
                        <p className="font-medium text-black">Delivered</p>
                        {order.deliveredAt && (
                          <p className="text-sm text-gray-600">
                            {formatDate(order.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-black"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-xl font-bold text-black mb-6">Order Items</h2>

              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const product = item.productId || {};
                    const imageUrl = getImageUrl(product);

                    // Debug each item
                    console.log(`OrderDetail Item ${index}:`, item);
                    console.log(`OrderDetail Product ${index}:`, product);
                    console.log(`OrderDetail Image URL ${index}:`, imageUrl);

                    return (
                      <div
                        key={index}
                        className="flex items-center p-4 border border-gray-300 rounded"
                      >
                        <div className="w-20 h-20 border border-gray-300 rounded mr-4 overflow-hidden bg-gray-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={
                                product.title || item.productTitle || "Product"
                              }
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <FiPackage className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium text-black">
                            {product.title || item.productTitle || "Product"}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Quantity: {item.quantity || 1}</span>
                            {product.brand && (
                              <span>Brand: {product.brand}</span>
                            )}
                          </div>
                          {product.category?.name && (
                            <div className="text-xs text-gray-500 mt-1">
                              Category: {product.category.name}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-black">
                            ${formatPrice(item.price || product.price || 0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: $
                            {formatPrice(
                              (item.price || product.price || 0) *
                                (item.quantity || 1),
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    No items found in this order
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            {order.shippingAddress && (
              <div className="border border-gray-300 rounded p-6">
                <div className="flex items-center mb-6">
                  <FiMapPin className="w-6 h-6 text-black mr-3" />
                  <h2 className="text-xl font-bold text-black">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-medium text-black">
                      {order.shippingAddress.street || "N/A"}
                      <br />
                      {order.shippingAddress.city || "N/A"},{" "}
                      {order.shippingAddress.state || "N/A"}
                      <br />
                      {order.shippingAddress.country || "N/A"} -{" "}
                      {order.shippingAddress.zipCode || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium text-black">
                      Phone: {order.shippingAddress.phone || "N/A"}
                    </p>
                    {order.shippingAddress.email && (
                      <p className="font-medium text-black mt-2">
                        Email: {order.shippingAddress.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-8">
            {/* Order Summary */}
            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-xl font-bold text-black mb-6">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${formatPrice(order.totalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.shippingCharge === 0
                      ? "FREE"
                      : `$${formatPrice(order.shippingCharge || 0)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    ${formatPrice(order.taxAmount || 0)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span>-${formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${formatPrice(order.finalAmount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-xl font-bold text-black mb-6">
                Payment Information
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-black capitalize">
                    {order.paymentMethod || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 text-xs rounded ${
                      order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.paymentStatus?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium text-black">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                {order.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium text-black">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-xl font-bold text-black mb-6">
                Customer Information
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium text-black">
                    {order.orderId || order._id}
                  </p>
                </div>
                {order.customerId && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-medium text-black">
                        {order.customerId.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer Email</p>
                      <p className="font-medium text-black">
                        {order.customerId.email || "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            to="/customer/orders"
            className="inline-flex items-center bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
