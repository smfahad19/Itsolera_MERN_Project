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
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiX,
  FiInfo,
  FiShoppingCart,
  FiXCircle,
  FiAlertTriangle,
  FiCreditCard,
  FiCheck,
} from "react-icons/fi";

const SellerOrders = () => {
  const { token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("status") || "all";
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Payment Status Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderToUpdatePayment, setOrderToUpdatePayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // API URLs - ✅ FIXED: Use API_BASE_URL instead of hardcoded localhost
  const API_BASE = `${API_BASE_URL}/api`;
  const SELLER_API = `${API_BASE}/seller`;

  // Cancellation reasons
  const cancellationReasons = [
    "Product out of stock",
    "Customer request",
    "Shipping address issue",
    "Payment issue",
    "Price mismatch",
    "Technical error",
    "Other",
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "paid", label: "Paid", color: "text-green-600" },
    { value: "failed", label: "Failed", color: "text-red-600" },
  ];

  useEffect(() => {
    if (!token) return;
    fetchOrders();
  }, [token, filter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${SELLER_API}/orders`, // ✅ FIXED
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: filter === "all" ? undefined : filter,
            page,
            limit: 10,
          },
        },
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      toast.error("Failed to load orders");
      console.error("Orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setModalLoading(true);
      const response = await axios.get(
        `${SELLER_API}/orders/${orderId}`, // ✅ FIXED
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Failed to load order details");
      console.error("Order details error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // Open payment status modal
  const openPaymentModal = (order) => {
    setOrderToUpdatePayment(order);
    setPaymentStatus(order.paymentStatus || "pending");
    setShowPaymentModal(true);
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setOrderToUpdatePayment(null);
    setPaymentStatus("");
  };

  // Update payment status
  const updatePaymentStatus = async () => {
    if (!orderToUpdatePayment) return;

    if (!paymentStatus) {
      toast.error("Please select a payment status");
      return;
    }

    try {
      setUpdatingPayment(true);
      const response = await axios.put(
        `${SELLER_API}/orders/${orderToUpdatePayment._id}/payment-status`, // ✅ FIXED
        {
          paymentStatus: paymentStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(`Payment status updated to ${paymentStatus}`);

        // Refresh orders list
        fetchOrders(pagination.currentPage);

        // Close modal and update modal if open
        closePaymentModal();
        if (
          showModal &&
          selectedOrder &&
          selectedOrder._id === orderToUpdatePayment._id
        ) {
          fetchOrderDetails(orderToUpdatePayment._id);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update payment status",
      );
      console.error("Update payment status error:", error);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Open cancellation modal
  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelReason("");
    setCustomReason("");
    setShowCancelModal(true);
  };

  // Close cancellation modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason("");
    setCustomReason("");
  };

  // Cancel order function
  const cancelOrder = async () => {
    if (!orderToCancel) return;

    // Validation
    if (!cancelReason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    if (cancelReason === "Other" && !customReason.trim()) {
      toast.error("Please specify the cancellation reason");
      return;
    }

    const finalReason = cancelReason === "Other" ? customReason : cancelReason;

    try {
      setCancelling(true);
      const response = await axios.put(
        `${SELLER_API}/orders/${orderToCancel._id}/status`, // ✅ FIXED
        {
          status: "cancelled",
          reason: finalReason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Order cancelled successfully");

        // Refresh orders list
        fetchOrders(pagination.currentPage);

        // Close modals
        closeCancelModal();
        if (showModal) {
          setShowModal(false);
          setSelectedOrder(null);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
      console.error("Cancel order error:", error);
    } finally {
      setCancelling(false);
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
      case "cancelled":
        return <FiXCircle className="w-5 h-5 text-red-600" />;
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case "paid":
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case "failed":
        return <FiXCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FiCreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleFilterChange = (status) => {
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  const updateOrderStatus = async (orderId, newStatus, reason = "") => {
    try {
      const requestData = { status: newStatus };
      if (reason) {
        requestData.reason = reason;
      }

      const response = await axios.put(
        `${SELLER_API}/orders/${orderId}/status`, // ✅ FIXED
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(`Order ${newStatus} successfully`);
        fetchOrders(pagination.currentPage);

        // Update modal if open
        if (selectedOrder && selectedOrder._id === orderId) {
          fetchOrderDetails(orderId);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update order status",
      );
      console.error(error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const canCancelOrder = (order) => {
    return ["pending", "processing"].includes(order.orderStatus);
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Link
                  to="/seller/dashboard"
                  className="flex items-center text-gray-600 hover:text-black mr-4"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-2">
                Manage and track customer orders
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.totalOrders || 0}
              </p>
            </div>
          </div>
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
                      <div className="flex items-center space-x-2">
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(
                            order.paymentStatus,
                          )}`}
                        >
                          Payment: {order.paymentStatus?.toUpperCase()}
                        </span>
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
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center py-4 border-b last:border-0"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productTitle || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiShoppingBag className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.productTitle || "Product"}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Quantity: {item.quantity || 1}</span>
                          <span>Price: {formatCurrency(item.price)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(item.price * (item.quantity || 1))}
                        </p>
                      </div>
                    </div>
                  ))}

                  {order.items?.length > 3 && (
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 text-sm">
                        + {order.items.length - 3} more items
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
                          {formatCurrency(order.totalAmount)}
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

                    <div className="flex items-center space-x-3">
                      {order.orderStatus === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "processing")
                            }
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Start Processing
                          </button>
                          <button
                            onClick={() => openCancelModal(order)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      {order.orderStatus === "processing" && (
                        <>
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "shipped")
                            }
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                          >
                            Mark as Shipped
                          </button>
                          <button
                            onClick={() => openCancelModal(order)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      {order.orderStatus === "shipped" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order._id, "delivered")
                          }
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Mark as Delivered
                        </button>
                      )}

                      {order.orderStatus === "delivered" && (
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center"
                        >
                          <FiCreditCard className="w-4 h-4 mr-1" />
                          Update Payment
                        </button>
                      )}

                      {canCancelOrder(order) &&
                        order.orderStatus !== "pending" &&
                        order.orderStatus !== "processing" && (
                          <button
                            onClick={() => openCancelModal(order)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel Order
                          </button>
                        )}

                      <button
                        onClick={() => fetchOrderDetails(order._id)}
                        className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800"
                      >
                        View Details
                        <FiChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
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
                ? "You haven't received any orders yet."
                : `You don't have any ${filter} orders.`}
            </p>
            <Link
              to="/seller/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Manage Products
            </Link>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-white/20 bg-opacity-30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Order Details
                </h2>
                <p className="text-sm text-gray-600">
                  Order #
                  {selectedOrder.orderId || selectedOrder._id?.substring(0, 8)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
              ) : (
                <>
                  {/* Order Status Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-4 py-2 rounded-lg ${getStatusColor(selectedOrder.orderStatus)}`}
                        >
                          <span className="font-semibold">
                            {selectedOrder.orderStatus?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                            <span
                              className={`ml-2 px-3 py-1 text-sm rounded-full ${getPaymentStatusColor(
                                selectedOrder.paymentStatus,
                              )}`}
                            >
                              Payment:{" "}
                              {selectedOrder.paymentStatus?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-gray-600">
                          {formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>

                      {/* Status Update Buttons in Modal */}
                      <div className="flex space-x-2">
                        {selectedOrder.orderStatus === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  selectedOrder._id,
                                  "processing",
                                )
                              }
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
                            >
                              <FiRefreshCw className="w-4 h-4 mr-2" />
                              Start Processing
                            </button>
                            <button
                              onClick={() => openCancelModal(selectedOrder)}
                              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center"
                            >
                              <FiXCircle className="w-4 h-4 mr-2" />
                              Cancel Order
                            </button>
                          </>
                        )}
                        {selectedOrder.orderStatus === "processing" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusUpdate(selectedOrder._id, "shipped")
                              }
                              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center"
                            >
                              <FiTruck className="w-4 h-4 mr-2" />
                              Mark as Shipped
                            </button>
                            <button
                              onClick={() => openCancelModal(selectedOrder)}
                              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center"
                            >
                              <FiXCircle className="w-4 h-4 mr-2" />
                              Cancel Order
                            </button>
                          </>
                        )}
                        {selectedOrder.orderStatus === "shipped" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(selectedOrder._id, "delivered")
                            }
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center"
                          >
                            <FiCheckCircle className="w-4 h-4 mr-2" />
                            Mark as Delivered
                          </button>
                        )}

                        {selectedOrder.orderStatus === "delivered" && (
                          <button
                            onClick={() => openPaymentModal(selectedOrder)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center"
                          >
                            <FiCreditCard className="w-4 h-4 mr-2" />
                            Update Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Information Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiCreditCard className="w-5 h-5 mr-2" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <div className="flex items-center mt-1">
                          {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                          <span
                            className={`ml-2 font-medium ${
                              selectedOrder.paymentStatus === "paid"
                                ? "text-green-600"
                                : selectedOrder.paymentStatus === "failed"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                          >
                            {selectedOrder.paymentStatus?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium">
                          {selectedOrder.paymentMethod?.toUpperCase() || "COD"}
                        </p>
                      </div>
                      {selectedOrder.paidAt && (
                        <div>
                          <p className="text-sm text-gray-600">Paid At</p>
                          <p className="font-medium">
                            {formatDate(selectedOrder.paidAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show cancellation reason if order is cancelled */}
                  {selectedOrder.orderStatus === "cancelled" &&
                    selectedOrder.cancelledReason && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <FiAlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <span className="font-semibold text-red-800">
                            Cancellation Reason:
                          </span>
                          <span className="ml-2 text-red-700">
                            {selectedOrder.cancelledReason}
                          </span>
                        </div>
                        {selectedOrder.cancelledAt && (
                          <p className="text-sm text-red-600 mt-1">
                            Cancelled on:{" "}
                            {formatDate(selectedOrder.cancelledAt)}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Order Items Section */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 border rounded-lg"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productTitle || "Product"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FiShoppingBag className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.productTitle}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Quantity: {item.quantity}</span>
                              <span>Price: {formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      {selectedOrder.shippingCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping</span>
                          <span>
                            {formatCurrency(selectedOrder.shippingCharge)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                        </div>
                      )}
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount</span>
                          <span>
                            -{formatCurrency(selectedOrder.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(
                            selectedOrder.finalAmount ||
                              selectedOrder.totalAmount,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && orderToUpdatePayment && (
        <div className="fixed inset-0 bg-white/20 bg-opacity-30 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-auto">
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiCreditCard className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Update Payment Status
                  </h2>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Update payment status for order #
                {orderToUpdatePayment.orderId ||
                  orderToUpdatePayment._id?.substring(0, 8)}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Current Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Status</p>
                <div className="flex items-center mt-1">
                  {getPaymentStatusIcon(orderToUpdatePayment.paymentStatus)}
                  <span
                    className={`ml-2 font-medium ${
                      orderToUpdatePayment.paymentStatus === "paid"
                        ? "text-green-600"
                        : orderToUpdatePayment.paymentStatus === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {orderToUpdatePayment.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Payment Status Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Payment Status *
                </label>
                <div className="space-y-2">
                  {paymentStatusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        paymentStatus === option.value
                          ? "border-indigo-500 bg-indigo-50"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentStatus"
                        value={option.value}
                        checked={paymentStatus === option.value}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <span className={`font-medium ${option.color}`}>
                          {option.label}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {option.value === "paid"
                            ? "Customer has paid for this order"
                            : option.value === "pending"
                              ? "Payment is still pending"
                              : "Payment has failed or was declined"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <FiInfo className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Note: Only delivered orders can be marked as "Paid". This
                      will update the revenue calculation in your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closePaymentModal}
                  disabled={updatingPayment}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePaymentStatus}
                  disabled={updatingPayment || !paymentStatus}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updatingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 mr-2" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Cancel Order
                  </h2>
                </div>
                <button
                  onClick={closeCancelModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Are you sure you want to cancel order #
                {orderToCancel.orderId || orderToCancel._id?.substring(0, 8)}?
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Cancellation Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cancellation Reason *
                </label>
                <div className="space-y-2">
                  {cancellationReasons.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <span className="ml-3 text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Reason */}
              {cancelReason === "Other" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify the reason *
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter cancellation reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows="3"
                  />
                </div>
              )}

              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Important Note
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Once cancelled, this action cannot be undone. The customer
                      will be notified about the cancellation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancelling}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={cancelOrder}
                  disabled={
                    cancelling ||
                    !cancelReason ||
                    (cancelReason === "Other" && !customReason.trim())
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-4 h-4 mr-2" />
                      Confirm Cancellation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
