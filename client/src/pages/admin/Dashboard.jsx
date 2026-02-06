import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiSettings,
  FiEye,
  FiRefreshCw,
  FiCalendar,
  FiShoppingCart,
  FiHome,
  FiBell,
  FiMail,
} from "react-icons/fi";

const AdminDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalSellers: 0,
    totalAdmins: 0,
    pendingSellers: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    recentOrders: 0,
    totalRevenue: 0,
    recentRevenue: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSellers, setRecentSellers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const response = await axios.get(
        "http://localhost:5000/api/admin/dashboard/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }

      // Fetch recent users
      try {
        const usersRes = await axios.get(
          "http://localhost:5000/api/admin/all-users",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 5 },
          },
        );

        if (usersRes.data.success) {
          setRecentUsers(usersRes.data.users?.slice(0, 5) || []);
        }
      } catch (userError) {
        console.log("Users fetch error:", userError.message);
      }

      // Fetch pending sellers
      try {
        const sellersRes = await axios.get(
          "http://localhost:5000/api/admin/sellers/pending",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (sellersRes.data.success) {
          setRecentSellers(sellersRes.data.sellers?.slice(0, 5) || []);
        }
      } catch (sellerError) {
        console.log("Sellers fetch error:", sellerError.message);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);

      // Check if it's a 404 error for API routes
      if (error.response?.status === 404) {
        // Use mock data for development
        setStats({
          totalUsers: 150,
          totalCustomers: 120,
          totalSellers: 25,
          totalAdmins: 5,
          pendingSellers: 8,
          totalProducts: 450,
          activeProducts: 420,
          totalOrders: 1250,
          recentOrders: 45,
          totalRevenue: 125000,
          recentRevenue: 8500,
        });

        setRecentUsers([
          {
            _id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "customer",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "seller",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "3",
            name: "Bob Wilson",
            email: "bob@example.com",
            role: "customer",
            createdAt: new Date().toISOString(),
          },
        ]);

        setRecentSellers([
          {
            _id: "1",
            name: "Tech Store",
            businessName: "Tech Store Pro",
            approvalStatus: "pending",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            name: "Fashion Hub",
            businessName: "Fashion Hub Ltd",
            approvalStatus: "pending",
            createdAt: new Date().toISOString(),
          },
        ]);

        toast.error("API routes not found. Using mock data for development.");
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "approved":
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "rejected":
      case "cancelled":
      case "suspended":
        return "text-red-600 bg-red-50 border-red-200";
      case "inactive":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "approved":
      case "delivered":
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
      case "cancelled":
      case "suspended":
        return <FiUserX className="w-4 h-4 text-red-600" />;
      default:
        return <FiUserCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "seller":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "customer":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user?.name || "Admin"}
                </p>
              </div>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/admin/dashboard"
                  className="flex items-center text-blue-600 font-medium"
                >
                  <FiHome className="w-5 h-5 mr-2" />
                  Overview
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center text-gray-600 hover:text-blue-600"
                >
                  <FiUsers className="w-5 h-5 mr-2" />
                  Users
                </Link>
                <Link
                  to="/admin/orders"
                  className="flex items-center text-gray-600 hover:text-blue-600"
                >
                  <FiShoppingCart className="w-5 h-5 mr-2" />
                  Orders
                </Link>
                <Link
                  to="/admin/sellers"
                  className="flex items-center text-gray-600 hover:text-blue-600"
                >
                  <FiUserCheck className="w-5 h-5 mr-2" />
                  Sellers
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh Data"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-700">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users Card */}
          <div className="bg-white border rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium text-green-600">
                      {stats.totalCustomers}
                    </div>
                    <div className="text-xs text-gray-500">Customers</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600">
                      {stats.totalSellers}
                    </div>
                    <div className="text-xs text-gray-500">Sellers</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-600">
                      {stats.totalAdmins}
                    </div>
                    <div className="text-xs text-gray-500">Admins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white border rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {stats.recentRevenue > 0 ? (
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stats.recentRevenue > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stats.recentRevenue > 0 ? "+" : ""}
                      {formatCurrency(stats.recentRevenue)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Last 30 days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white border rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders}
                  </div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {stats.recentOrders} new this week
                    </span>
                  </div>
                  <Link
                    to="/admin/orders"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Sellers Card */}
          <div className="bg-white border rounded-lg shadow-sm hover:shadow transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.pendingSellers}
                  </div>
                  <div className="text-sm text-gray-500">Pending Sellers</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiAlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Need approval</span>
                  </div>
                  <Link
                    to="/admin/sellers/pending"
                    className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    Review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Users */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Users
                </h2>
                <Link
                  to="/admin/users"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-medium text-gray-700 mr-3">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || "No Email"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(
                            user.role || "customer",
                          )}`}
                        >
                          {user.role || "customer"}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No recent users</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Sellers */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Sellers
                </h2>
                {recentSellers.length > 0 && (
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {recentSellers.length} pending
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {recentSellers.length > 0 ? (
                <div className="space-y-4">
                  {recentSellers.map((seller) => (
                    <div
                      key={seller._id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {seller.businessName || seller.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {seller.email || "No Email"}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            seller.approvalStatus || "pending",
                          )}`}
                        >
                          {seller.approvalStatus || "pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">
                          Applied: {formatDate(seller.createdAt)}
                        </span>
                        <Link
                          to={`/admin/sellers/${seller._id}/details`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-600">No pending sellers</p>
                  <p className="text-sm text-gray-500 mt-1">
                    All sellers are approved
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-white border rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Platform Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-700 mb-2">
                  {stats.totalCustomers}
                </div>
                <div className="text-sm font-medium text-blue-800">
                  Customers
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Registered users
                </div>
              </div>

              <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-700 mb-2">
                  {stats.totalSellers}
                </div>
                <div className="text-sm font-medium text-green-800">
                  Sellers
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {stats.pendingSellers} pending
                </div>
              </div>

              <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-700 mb-2">
                  {stats.totalProducts}
                </div>
                <div className="text-sm font-medium text-purple-800">
                  Products
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {stats.activeProducts} active
                </div>
              </div>

              <div className="text-center p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                <div className="text-2xl font-bold text-indigo-700 mb-2">
                  {stats.totalOrders}
                </div>
                <div className="text-sm font-medium text-indigo-800">
                  Orders
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  {stats.recentOrders} recent
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-medium text-gray-900">Manage Users</div>
              <div className="text-sm text-gray-500 mt-1">View all users</div>
            </Link>

            <Link
              to="/admin/sellers/pending"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FiUserCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="font-medium text-gray-900">Approve Sellers</div>
              <div className="text-sm text-gray-500 mt-1">
                Review applications
              </div>
            </Link>

            <Link
              to="/admin/products"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FiPackage className="w-6 h-6 text-green-600" />
              </div>
              <div className="font-medium text-gray-900">Manage Products</div>
              <div className="text-sm text-gray-500 mt-1">
                View all products
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FiSettings className="w-6 h-6 text-gray-600" />
              </div>
              <div className="font-medium text-gray-900">Settings</div>
              <div className="text-sm text-gray-500 mt-1">
                Platform settings
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
