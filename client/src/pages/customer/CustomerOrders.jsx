import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiChevronRight,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiEye,
  FiMapPin,
  FiShoppingBag,
} from "react-icons/fi";

const CustomerOrders = () => {
  const { token } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("status") || "all";
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });

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
    if (!token) return;
    fetchOrders();
  }, [token, filter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/customer/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: filter === "all" ? undefined : filter,
            page,
            limit: 10,
          },
        },
      );

      console.log("Orders API response:", response.data); // Debug

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || {});

        // Debug: Log image data
        if (response.data.orders && response.data.orders.length > 0) {
          console.log(
            "First order item structure:",
            response.data.orders[0].items?.[0],
          );
        }
      }
    } catch (error) {
      toast.error("Failed to load orders");
      console.error("Orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-5 h-5 text-yellow-600" />;
      case "processing":
        return <FiRefreshCw className="w-5 h-5 text-blue-600" />;
      case "shipped":
        return <FiTruck className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FiPackage className="w-5 h-5 text-gray-600" />;
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
      month: "short",
      day: "numeric",
    });
  };

  const handleFilterChange = (status) => {
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[
              "all",
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  filter === status
                    ? status === "all"
                      ? "bg-blue-600 text-white"
                      : getStatusColor(status)
                          .replace("100", "600")
                          .replace("text", "bg")
                          .replace("800", "50") +
                        " " +
                        getStatusColor(status).split(" ")[1]
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? `All Orders (${pagination.totalOrders || 0})`
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.orderStatus)}
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                            order.orderStatus,
                          )}`}
                        >
                          {order.orderStatus?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Order #{order.orderId || order._id?.substring(0, 8)}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Placed on</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  {order.items?.slice(0, 2).map((item, index) => {
                    const product = item.productId || {};
                    const imageUrl = getImageUrl(product);

                    // Debug each item
                    console.log(`Item ${index} product:`, product);
                    console.log(`Item ${index} imageUrl:`, imageUrl);

                    return (
                      <div
                        key={index}
                        className="flex items-center py-4 border-b last:border-0"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
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
                            <div className="w-full h-full flex items-center justify-center">
                              <FiShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {product.title || item.productTitle || "Product"}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                          <p className="font-bold text-gray-900">
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
                  })}

                  {order.items?.length > 2 && (
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 text-sm">
                        + {order.items.length - 2} more items
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center">
                        <FiDollarSign className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 text-xl font-bold text-gray-900">
                          ${formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {order.shippingAddress && (
                        <div className="flex items-center">
                          <FiMapPin className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {order.shippingAddress.city || "N/A"},{" "}
                            {order.shippingAddress.country || "N/A"}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800"
                    >
                      View Details
                      <FiChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => fetchOrders(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchOrders(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "You haven't placed any orders yet."
                : `You don't have any ${filter} orders.`}
            </p>
            <Link
              to="/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
