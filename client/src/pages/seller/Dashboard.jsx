import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiDollarSign,
  FiPlus,
  FiList,
  FiShoppingCart,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiTrendingUp,
  FiEdit,
  FiEye,
  FiTrendingDown,
  FiBox,
  FiAlertCircle,
  FiBarChart2,
} from "react-icons/fi";
import { FaTruck, FaBoxOpen, FaRegClock } from "react-icons/fa";

const SellerDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    user: null,
    approvalStatus: "pending",
    isApproved: false,
    rejectionReason: "",
    message: "",
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    recentRevenue: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // ✅ FIXED: Use API_BASE_URL instead of hardcoded localhost
  const API_BASE = `${API_BASE_URL}/api`;
  const SELLER_API = `${API_BASE}/seller`;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    checkSellerApproval();
  }, [token, navigate]);

  const checkSellerApproval = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard data...");
      const response = await axios.get(`${SELLER_API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      console.log("Dashboard API Response:", data); // Debug log

      if (data.success) {
        setDashboardData({
          user: data.user || user,
          approvalStatus: data.user?.approvalStatus || "pending",
          isApproved: data.user?.isApproved || false,
          rejectionReason: data.rejectionReason || "",
          message: data.message || "",
        });

        // If user is approved OR if we have stats data
        if (data.user?.isApproved || data.stats) {
          console.log("Setting stats:", data.stats);

          // Set stats from backend response
          setStats({
            totalProducts: data.stats?.totalProducts || 0,
            activeProducts: data.stats?.activeProducts || 0,
            totalOrders: data.stats?.totalOrders || 0,
            pendingOrders: data.stats?.pendingOrders || 0,
            processingOrders: data.stats?.processingOrders || 0,
            completedOrders: data.stats?.completedOrders || 0,
            totalRevenue: data.stats?.totalRevenue || 0,
            recentRevenue: data.stats?.recentRevenue || 0,
            lowStockCount: data.stats?.lowStockCount || 0,
          });

          // Set recent orders
          setRecentOrders(data.recentOrders || []);

          // Set low stock products
          setLowStockProducts(data.lowStockProducts || []);
        }
      } else {
        console.error("Dashboard API returned success: false", data);
        toast.error(data.message || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Dashboard Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 403) {
        console.log("Access denied, checking approval status...");
        checkApprovalStatus();
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to load dashboard",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async () => {
    try {
      console.log("Checking approval status...");
      const response = await axios.get(`${SELLER_API}/approval-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      console.log("Approval Status Response:", data);

      setDashboardData({
        user: null,
        approvalStatus: data.approvalStatus,
        isApproved: data.isApproved,
        rejectionReason: data.rejectionReason || "",
        message: data.message,
      });
    } catch (error) {
      console.error("Approval Check Error:", error);
      toast.error("Failed to check approval status");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSellerApproval();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount))
      return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getOrderStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case "processing":
        return <FiRefreshCw className="w-4 h-4 text-blue-600" />;
      case "shipped":
        return <FaTruck className="w-4 h-4 text-purple-600" />;
      case "delivered":
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <FiAlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <FiPackage className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Approved State
  if (!dashboardData.isApproved) {
    const statusMessages = {
      pending: "Your seller account is pending approval",
      rejected: `Your account was rejected: ${dashboardData.rejectionReason || "No reason provided"}`,
      default: "Waiting for admin approval",
    };

    const statusColors = {
      pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
      rejected: "text-red-600 bg-red-50 border-red-200",
      default: "text-gray-600 bg-gray-50 border-gray-200",
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Seller Dashboard
                </h1>
                <p className="text-gray-600 text-sm">Account Status</p>
              </div>
              <div
                className={`px-3 py-1 text-sm rounded border ${statusColors[dashboardData.approvalStatus] || statusColors.default}`}
              >
                {dashboardData.approvalStatus?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            {/* Status Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 border-4 border-gray-300 rounded-full flex items-center justify-center mx-auto relative">
                <div className="w-24 h-24 border-4 border-black border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
                <FiAlertTriangle className="w-10 h-10 text-gray-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {dashboardData.approvalStatus === "pending"
                ? "Waiting for Admin Approval"
                : "Account Not Approved"}
            </h1>

            <p className="text-gray-600 mb-6">
              {statusMessages[dashboardData.approvalStatus] ||
                statusMessages.default}
            </p>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Submitted</span>
                <span className="text-sm text-gray-500">Review</span>
                <span className="text-sm text-gray-500">Approval</span>
              </div>
              <div className="h-1 bg-gray-200">
                <div
                  className={`h-full ${
                    dashboardData.approvalStatus === "approved"
                      ? "bg-green-500 w-full"
                      : dashboardData.approvalStatus === "rejected"
                        ? "bg-red-500 w-2/3"
                        : "bg-yellow-500 w-1/3"
                  }`}
                ></div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white border rounded p-4 mb-6">
              <div className="flex items-start">
                <FiAlertTriangle className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Account Access Restricted
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Your seller dashboard features are temporarily disabled
                    until your account is approved by the admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white border rounded p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-gray-700">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admin Review</p>
                    <p className="text-sm text-gray-600">
                      Our team will review your application
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-gray-700">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Status Update</p>
                    <p className="text-sm text-gray-600">
                      You'll receive an email with the decision
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-gray-700">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Full Access</p>
                    <p className="text-sm text-gray-600">
                      Start selling when approved
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-5 py-2.5 bg-black text-white rounded font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <FiRefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Checking..." : "Check Status"}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {user?.name || "Seller"}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Approved
                </span>
              </div>
            </div>
          </div>

          <div className="text-gray-600 text-sm">
            Manage your store and track performance
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Welcome to Your Seller Dashboard!
              </h2>
              <div className="flex flex-wrap gap-4">
                <p className="text-gray-700">
                  <span className="font-semibold">Business:</span>{" "}
                  <span className="font-bold text-blue-700">
                    {dashboardData.user?.businessName || "Your Store"}
                  </span>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="font-bold text-green-600">Active</span>
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/seller/profile"
                className="inline-block px-5 py-2.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium shadow-sm transition-colors"
              >
                View Store Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card - FIXED */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-green-700" />
                </div>
                <div
                  className={`text-xs font-medium ${stats.totalRevenue > 0 ? "text-green-600" : "text-gray-500"}`}
                >
                  {stats.totalRevenue > 0 ? (
                    <div className="flex items-center bg-green-50 px-2.5 py-1 rounded-lg">
                      <FiTrendingUp className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">Revenue</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      <FiAlertTriangle className="w-3 h-3 mr-1.5" />
                      <span>No Sales Yet</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-gray-600 text-sm">Total Revenue</div>
              </div>
              {stats.recentRevenue > 0 && (
                <div className="text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg inline-flex items-center">
                  <FiBarChart2 className="w-3 h-3 mr-1.5" />+
                  {formatCurrency(stats.recentRevenue)} last 30 days
                </div>
              )}
            </div>

            {/* Orders Card */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <FiShoppingCart className="w-6 h-6 text-blue-700" />
                </div>
                <div
                  className={`text-xs font-medium ${stats.totalOrders > 0 ? "text-blue-600" : "text-gray-500"}`}
                >
                  {stats.totalOrders > 0 ? (
                    <div className="flex items-center bg-blue-50 px-2.5 py-1 rounded-lg">
                      <FiTrendingUp className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">Orders</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      <FiTrendingDown className="w-3 h-3 mr-1.5" />
                      <span>No Orders</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </div>
                <div className="text-gray-600 text-sm">Total Orders</div>
              </div>
              {stats.totalOrders > 0 && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                  {stats.pendingOrders} pending • {stats.processingOrders}{" "}
                  processing
                </div>
              )}
            </div>

            {/* Products Card */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                  <FaBoxOpen className="w-6 h-6 text-purple-700" />
                </div>
                <div
                  className={`text-xs font-medium ${stats.activeProducts > 0 ? "text-purple-600" : "text-gray-500"}`}
                >
                  {stats.activeProducts > 0 ? (
                    <div className="flex items-center bg-purple-50 px-2.5 py-1 rounded-lg">
                      <FiCheckCircle className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      <FiAlertCircle className="w-3 h-3 mr-1.5" />
                      <span>No Products</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalProducts}
                </div>
                <div className="text-gray-600 text-sm">Total Products</div>
              </div>
              {stats.totalProducts > 0 && (
                <div className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg">
                  {stats.activeProducts} active • {stats.lowStockCount} low
                  stock
                </div>
              )}
            </div>

            {/* Pending Orders Card */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                  <FaRegClock className="w-6 h-6 text-yellow-700" />
                </div>
                <div
                  className={`text-xs font-medium ${stats.pendingOrders > 0 ? "text-yellow-600" : "text-gray-500"}`}
                >
                  {stats.pendingOrders > 0 ? (
                    <div className="flex items-center bg-yellow-50 px-2.5 py-1 rounded-lg">
                      <FiAlertTriangle className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">Attention Needed</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-100 px-2.5 py-1 rounded-lg">
                      <FiCheckCircle className="w-3 h-3 mr-1.5" />
                      <span>All Clear</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.pendingOrders}
                </div>
                <div className="text-gray-600 text-sm">Pending Orders</div>
              </div>
              {stats.pendingOrders > 0 && (
                <div className="text-xs text-yellow-700 bg-yellow-50 px-2.5 py-1.5 rounded-lg">
                  Needs your attention
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Overview Section */}
        <div className="bg-white border rounded-xl mb-8 shadow-sm">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <FiBarChart2 className="w-5 h-5 mr-2 text-blue-600" />
              Revenue Overview
            </h2>
            <p className="text-gray-600 text-sm">Sales performance analytics</p>
          </div>
          <div className="p-5">
            {stats.totalRevenue > 0 ? (
              <div className="space-y-6">
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                        <FiDollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          All Time Revenue
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(stats.totalRevenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      From {stats.completedOrders} completed orders
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                        <FiTrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Recent Revenue (30 days)
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(stats.recentRevenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on recent sales activity
                    </div>
                  </div>
                </div>

                {/* Revenue Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-gray-700">
                      Revenue Progress
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.completedOrders} completed orders
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((stats.completedOrders / Math.max(stats.totalOrders, 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>
                      Completion Rate:{" "}
                      {(
                        (stats.completedOrders /
                          Math.max(stats.totalOrders, 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiDollarSign className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No Revenue Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start selling products to see revenue data
                </p>
                <div className="space-x-3">
                  <button
                    onClick={() => navigate("/seller/products/add")}
                    className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium shadow-sm"
                  >
                    Add First Product
                  </button>
                  <button
                    onClick={() => navigate("/seller/products")}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    View Products
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="bg-white border rounded-xl shadow-sm">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-900">Recent Orders</h2>
                  <p className="text-gray-600 text-sm">Last 7 days</p>
                </div>
                <Link
                  to="/seller/orders"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-5">
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order, index) => (
                    <div
                      key={order._id || index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getStatusIcon(order.orderStatus)}
                          <span className="ml-2 font-medium text-gray-900">
                            {order.orderId || `ORDER-${order._id?.slice(-8)}`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.customerName ||
                            order.customerId?.name ||
                            "Customer"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs ${getOrderStatusColor(order.orderStatus)}`}
                          >
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FiShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No recent orders</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Orders will appear here once received
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white border rounded-xl shadow-sm">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-900">Low Stock Alert</h2>
                  <p className="text-gray-600 text-sm">
                    Products with less than 10 in stock
                  </p>
                </div>
                {lowStockProducts.length > 0 && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {lowStockProducts.length} items
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={product._id || index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {product.title}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FiPackage className="w-3 h-3 mr-1.5" />
                          Stock: {product.stock}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs ${product.stock <= 5 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {product.stock <= 5 ? "Very Low" : "Low Stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FiCheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    All products in stock
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    No low stock products
                  </p>
                </div>
              )}
              {lowStockProducts.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/seller/products"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Products →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white border rounded-xl mb-8 shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-bold text-gray-900">Order Status Summary</h2>
            <p className="text-gray-600 text-sm">Last 30 days overview</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-5 border border-yellow-200 rounded-xl bg-yellow-50">
                <div className="text-3xl font-bold text-yellow-700 mb-2">
                  {stats.pendingOrders}
                </div>
                <div className="text-sm font-medium text-yellow-800">
                  Pending
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Awaiting processing
                </div>
              </div>
              <div className="text-center p-5 border border-blue-200 rounded-xl bg-blue-50">
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {stats.processingOrders}
                </div>
                <div className="text-sm font-medium text-blue-800">
                  Processing
                </div>
                <div className="text-xs text-blue-600 mt-1">In progress</div>
              </div>
              <div className="text-center p-5 border border-green-200 rounded-xl bg-green-50">
                <div className="text-3xl font-bold text-green-700 mb-2">
                  {stats.completedOrders}
                </div>
                <div className="text-sm font-medium text-green-800">
                  Completed
                </div>
                <div className="text-xs text-green-600 mt-1">Delivered</div>
              </div>
              <div className="text-center p-5 border border-gray-200 rounded-xl bg-gray-50">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalOrders}
                </div>
                <div className="text-sm font-medium text-gray-800">Total</div>
                <div className="text-xs text-gray-600 mt-1">All orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/seller/products/add")}
              className="bg-white border border-gray-300 rounded-xl p-5 text-center hover:border-gray-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FiPlus className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                Add Product
              </div>
              <div className="text-gray-600 text-xs">Create new listing</div>
            </button>

            <button
              onClick={() => navigate("/seller/products")}
              className="bg-white border border-gray-300 rounded-xl p-5 text-center hover:border-gray-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FiList className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                My Products
              </div>
              <div className="text-gray-600 text-xs">Manage listings</div>
            </button>

            <button
              onClick={() => navigate("/seller/orders")}
              className="bg-white border border-gray-300 rounded-xl p-5 text-center hover:border-gray-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FaTruck className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">Orders</div>
              <div className="text-gray-600 text-xs">View & manage</div>
            </button>

            <button
              onClick={() => navigate("/seller/profile")}
              className="bg-white border border-gray-300 rounded-xl p-5 text-center hover:border-gray-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FiEdit className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                Profile
              </div>
              <div className="text-gray-600 text-xs">Edit store details</div>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Business Name</div>
              <div className="font-medium text-gray-900">
                {dashboardData.user?.businessName || "Not set"}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Approval Status</div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-green-700">Approved</span>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Email</div>
              <div className="font-medium text-gray-900">
                {dashboardData.user?.email || user?.email}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Account Type</div>
              <div className="font-medium text-gray-900">Seller Account</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Products</div>
              <div className="font-medium text-gray-900">
                {stats.totalProducts}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Active Products</div>
              <div className="font-medium text-gray-900">
                {stats.activeProducts}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
              <div className="font-medium text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Orders</div>
              <div className="font-medium text-gray-900">
                {stats.totalOrders}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
              <div className="font-medium text-gray-900">
                {(
                  (stats.completedOrders / Math.max(stats.totalOrders, 1)) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/seller/profile")}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Edit Profile
            </button>
            <Link
              to="/seller/analytics"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
