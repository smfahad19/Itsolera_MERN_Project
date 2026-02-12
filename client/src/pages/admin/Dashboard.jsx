import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSettings,
  FiEye,
  FiRefreshCw,
  FiHome,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ YAHAN USE KARO

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
    approvedSellers: 0,
    rejectedSellers: 0,
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

      // ✅ ENV VARIABLE USE KARO
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const data = response.data.stats;
        setStats({
          totalUsers: data.users?.total || 0,
          totalCustomers: data.users?.customers || 0,
          totalSellers: data.users?.sellers || 0,
          totalAdmins: data.users?.admins || 0,
          pendingSellers: data.sellers?.pending || 0,
          approvedSellers: data.sellers?.approved || 0,
          rejectedSellers: data.sellers?.rejected || 0,
        });
      }

      // ✅ ENV VARIABLE USE KARO
      try {
        const usersRes = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 },
        });

        if (usersRes.data.success) {
          setRecentUsers(usersRes.data.users?.slice(0, 5) || []);
        }
      } catch (userError) {
        console.log("Users fetch error:", userError.message);
      }

      // ✅ ENV VARIABLE USE KARO
      try {
        const sellersRes = await axios.get(
          `${API_BASE_URL}/api/admin/sellers/pending`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 5 },
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
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "seller":
        return "bg-blue-100 text-blue-800";
      case "customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user?.name || "Admin"}
                </p>
              </div>
              <div className="hidden md:flex space-x-2">
                <Link
                  to="/admin/dashboard"
                  className="flex items-center px-3 py-2 text-gray-900 font-medium bg-gray-100 rounded-lg"
                >
                  <FiHome className="w-5 h-5 mr-2" />
                  Overview
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <FiUsers className="w-5 h-5 mr-2" />
                  Users
                </Link>
                <Link
                  to="/admin/sellers"
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <FiUserCheck className="w-5 h-5 mr-2" />
                  Seller Verification
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <FiSettings className="w-5 h-5 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
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

          {/* Total Sellers Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalSellers}
                  </div>
                  <div className="text-sm text-gray-500">Total Sellers</div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium text-green-600">
                      {stats.approvedSellers}
                    </div>
                    <div className="text-xs text-gray-500">Approved</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-yellow-600">
                      {stats.pendingSellers}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-600">
                      {stats.rejectedSellers}
                    </div>
                    <div className="text-xs text-gray-500">Rejected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Sellers Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiAlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Need approval</span>
                  </div>
                  <Link
                    to="/admin/sellers"
                    className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                  >
                    Review Now
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Rate Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalSellers > 0
                      ? Math.round(
                          (stats.approvedSellers / stats.totalSellers) * 100,
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-500">Approval Rate</div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {stats.approvedSellers > stats.rejectedSellers ? (
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stats.approvedSellers > stats.rejectedSellers
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stats.approvedSellers} approved
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Overall</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Users */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Users
                </h2>
                <Link
                  to="/admin/users"
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
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
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
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
                    <p className="text-sm text-gray-500 mt-1">
                      New users will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Sellers */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Seller Applications
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
                      className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {seller.businessName || seller.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {seller.email || "No Email"}
                          </div>
                          {seller.businessType && (
                            <div className="text-xs text-gray-500 mt-1">
                              {seller.businessType}
                            </div>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
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
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/sellers/${seller._id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <FiEye className="w-4 h-4 inline mr-1" />
                            Review
                          </Link>
                          <Link
                            to={`/admin/users/${seller._id}`}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No pending applications</p>
                  <p className="text-sm text-gray-500 mt-1">
                    All seller applications are processed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Platform Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalUsers}
                </div>
                <div className="text-sm font-medium text-gray-800">
                  Total Users
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Across all roles
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.totalCustomers}
                </div>
                <div className="text-sm font-medium text-gray-800">
                  Customers
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Active shoppers
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.totalSellers}
                </div>
                <div className="text-sm font-medium text-gray-800">Sellers</div>
                <div className="text-xs text-gray-600 mt-1">
                  Business accounts
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.totalAdmins}
                </div>
                <div className="text-sm font-medium text-gray-800">Admins</div>
                <div className="text-xs text-gray-600 mt-1">
                  System administrators
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/users"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-gray-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <FiUsers className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Manage Users</div>
                  <div className="text-sm text-gray-500 mt-1">
                    View, edit, and manage all users
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/sellers"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-gray-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <FiUserCheck className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Seller Verification
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Review and approve seller applications
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow hover:border-gray-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <FiSettings className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Platform Settings
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Configure system preferences
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <FiCheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    System is running normally
                  </div>
                  <div className="text-xs text-gray-500">
                    All services operational
                  </div>
                </div>
                <div className="text-xs text-gray-500">Just now</div>
              </div>

              <div className="flex items-center p-3 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <FiUsers className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    User management active
                  </div>
                  <div className="text-xs text-gray-500">
                    Admin privileges enabled
                  </div>
                </div>
                <div className="text-xs text-gray-500">5 min ago</div>
              </div>

              <div className="flex items-center p-3 border border-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <FiUserCheck className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Seller verification active
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.pendingSellers} applications pending
                  </div>
                </div>
                <div className="text-xs text-gray-500">10 min ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
