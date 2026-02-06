import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiEye,
  FiArrowLeft,
  FiRefreshCw,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiCalendar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";

const AdminUsers = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    sellers: 0,
    admins: 0,
    pendingVerification: 0,
    pendingSellers: 0,
  });
  const [filters, setFilters] = useState({
    role: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });

  // New state for user details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUsers();
  }, [token, navigate, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.role) params.role = filters.role;

      const response = await axios.get(
        "http://localhost:5000/api/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        },
      );

      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
        setStats(response.data.stats);
        setPagination({
          ...pagination,
          totalPages: response.data.pagination.totalPages,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // NEW FUNCTION: Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setUserDetails(response.data);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Fetch User Details Error:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // NEW FUNCTION: Handle view user details
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user._id);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSearch = () => {
    let filtered = users;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.businessName &&
            user.businessName.toLowerCase().includes(searchLower)),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
        if (showUserModal) {
          fetchUserDetails(userId); // Refresh details if modal is open
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleUpdateStatus = async (userId, type, status, reason = "") => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { type, status, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers();
        if (showUserModal) {
          fetchUserDetails(userId); // Refresh details if modal is open
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        setShowUserModal(false); // Close modal if user is deleted
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleBadgeColor = (role) => {
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

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "approved":
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage all platform users
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchUsers}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.customers}
            </div>
            <div className="text-sm text-gray-500">Customers</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.sellers}
            </div>
            <div className="text-sm text-gray-500">Sellers</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.admins}
            </div>
            <div className="text-sm text-gray-500">Admins</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingVerification}
            </div>
            <div className="text-sm text-gray-500">Pending Verification</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingSellers}
            </div>
            <div className="text-sm text-gray-500">Pending Sellers</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyUp={handleSearch}
                  placeholder="Search by name, email, or business..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiFilter className="w-4 h-4" />
              <span>
                Showing {filteredUsers.length} of {pagination.total} users
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            {user.businessName && (
                              <div className="text-sm text-gray-500">
                                {user.businessName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role}
                          </span>
                          {user.role === "customer" && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.verificationStatus)}`}
                            >
                              {user.verificationStatus || "unverified"}
                            </span>
                          )}
                          {user.role === "seller" && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.approvalStatus)}`}
                            >
                              {user.approvalStatus || "pending"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Changed from Link to button */}
                          <button
                            onClick={() => handleViewUserDetails(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>

                          {user.role === "customer" && (
                            <>
                              {user.verificationStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(
                                        user._id,
                                        "verification",
                                        "verified",
                                      )
                                    }
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Approve Verification"
                                  >
                                    <FiUserCheck className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt(
                                        "Enter rejection reason:",
                                      );
                                      if (reason)
                                        handleUpdateStatus(
                                          user._id,
                                          "verification",
                                          "rejected",
                                          reason,
                                        );
                                    }}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Reject Verification"
                                  >
                                    <FiUserX className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {user.role === "seller" && (
                            <>
                              {user.approvalStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(
                                        user._id,
                                        "approval",
                                        "approved",
                                      )
                                    }
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Approve Seller"
                                  >
                                    <FiUserCheck className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt(
                                        "Enter rejection reason:",
                                      );
                                      if (reason)
                                        handleUpdateStatus(
                                          user._id,
                                          "approval",
                                          "rejected",
                                          reason,
                                        );
                                    }}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Reject Seller"
                                  >
                                    <FiUserX className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {user._id !==
                            JSON.parse(localStorage.getItem("user"))?._id && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete User"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    }
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 border rounded ${
                      pagination.page === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 border rounded ${
                      pagination.page === pagination.totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  User Details
                </h2>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setUserDetails(null);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      Loading user details...
                    </p>
                  </div>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <div className="font-medium">
                          {userDetails.user.name}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <div className="font-medium">
                          {userDetails.user.email}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <div className="font-medium">
                          {userDetails.user.phone || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Role</label>
                        <div className="font-medium capitalize">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userDetails.user.role)}`}
                          >
                            {userDetails.user.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          Joined Date
                        </label>
                        <div className="font-medium">
                          {formatDateTime(userDetails.user.createdAt)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">User ID</label>
                        <div className="font-medium text-sm">
                          {userDetails.user._id}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Status Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userDetails.user.role === "customer" && (
                        <>
                          <div>
                            <label className="text-sm text-gray-500">
                              Verification Status
                            </label>
                            <div className="font-medium">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(userDetails.user.verificationStatus)}`}
                              >
                                {userDetails.user.verificationStatus ||
                                  "unverified"}
                              </span>
                            </div>
                          </div>
                          {userDetails.user.verifiedAt && (
                            <div>
                              <label className="text-sm text-gray-500">
                                Verified At
                              </label>
                              <div className="font-medium">
                                {formatDateTime(userDetails.user.verifiedAt)}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {userDetails.user.role === "seller" && (
                        <>
                          <div>
                            <label className="text-sm text-gray-500">
                              Approval Status
                            </label>
                            <div className="font-medium">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(userDetails.user.approvalStatus)}`}
                              >
                                {userDetails.user.approvalStatus || "pending"}
                              </span>
                            </div>
                          </div>
                          {userDetails.user.approvedAt && (
                            <div>
                              <label className="text-sm text-gray-500">
                                Approved At
                              </label>
                              <div className="font-medium">
                                {formatDateTime(userDetails.user.approvedAt)}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {userDetails.additionalInfo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Additional Information
                      </h3>

                      {userDetails.user.role === "customer" &&
                        userDetails.additionalInfo.orders && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <FiShoppingBag className="w-4 h-4" />
                              Recent Orders (
                              {userDetails.additionalInfo.orders.length})
                            </h4>
                            {userDetails.additionalInfo.orders.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead>
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Order ID
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Date
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Amount
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {userDetails.additionalInfo.orders.map(
                                      (order) => (
                                        <tr key={order._id}>
                                          <td className="px-3 py-2 text-sm">
                                            {order._id.substring(0, 8)}...
                                          </td>
                                          <td className="px-3 py-2 text-sm">
                                            {formatDate(order.createdAt)}
                                          </td>
                                          <td className="px-3 py-2 text-sm">
                                            $
                                            {order.totalAmount?.toFixed(2) ||
                                              "0.00"}
                                          </td>
                                          <td className="px-3 py-2 text-sm">
                                            <span
                                              className={`inline-flex px-2 py-1 rounded text-xs ${order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                            >
                                              {order.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">
                                No orders yet
                              </p>
                            )}
                          </div>
                        )}

                      {userDetails.user.role === "seller" && (
                        <div className="space-y-4">
                          {userDetails.additionalInfo.products && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <FiPackage className="w-4 h-4" />
                                Recent Products (
                                {userDetails.additionalInfo.products.length})
                              </h4>
                              {userDetails.additionalInfo.products.length >
                              0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Product
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Price
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Stock
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {userDetails.additionalInfo.products.map(
                                        (product) => (
                                          <tr key={product._id}>
                                            <td className="px-3 py-2 text-sm truncate max-w-xs">
                                              {product.title}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              $
                                              {product.price?.toFixed(2) ||
                                                "0.00"}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              {product.stock || 0}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              <span
                                                className={`inline-flex px-2 py-1 rounded text-xs ${product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                              >
                                                {product.isActive
                                                  ? "Active"
                                                  : "Inactive"}
                                              </span>
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  No products yet
                                </p>
                              )}
                            </div>
                          )}

                          {userDetails.additionalInfo.sellerOrders && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <FiDollarSign className="w-4 h-4" />
                                Recent Orders (
                                {userDetails.additionalInfo.sellerOrders.length}
                                )
                              </h4>
                              {userDetails.additionalInfo.sellerOrders.length >
                              0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Order ID
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Date
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Amount
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {userDetails.additionalInfo.sellerOrders.map(
                                        (order) => (
                                          <tr key={order._id}>
                                            <td className="px-3 py-2 text-sm">
                                              {order._id.substring(0, 8)}...
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              $
                                              {order.totalAmount?.toFixed(2) ||
                                                "0.00"}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              <span
                                                className={`inline-flex px-2 py-1 rounded text-xs ${order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                              >
                                                {order.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  No orders yet
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setUserDetails(null);
                        setSelectedUser(null);
                      }}
                      className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>

                    {selectedUser._id !==
                      JSON.parse(localStorage.getItem("user"))?._id && (
                      <button
                        onClick={() => handleDeleteUser(selectedUser._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete User
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Unable to load user details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
