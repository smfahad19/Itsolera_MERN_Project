import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiSearch,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";

const AdminUsers = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    sellers: 0,
    admins: 0,
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

  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUsers();
  }, [token, navigate, pagination.page, filters.role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.role) params.role = filters.role;

      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setUsers(response.data.users || []);
        setStats(
          response.data.stats || {
            total: 0,
            customers: 0,
            sellers: 0,
            admins: 0,
          },
        );
        setPagination({
          ...pagination,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Role updated successfully");
        fetchUsers();
        setShowRoleMenu(null);
      }
    } catch (error) {
      console.error("Update Role Error:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleUpdateStatus = async (userId, type, status, reason = "") => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        { type, status, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Status updated successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Update Status Error:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Delete User Error:", error);
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
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "approved":
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!filters.search) return true;

    const searchTerm = filters.search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.businessName?.toLowerCase().includes(searchTerm)
    );
  });

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
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {stats.customers}
            </div>
            <div className="text-sm text-gray-500">Customers</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {stats.sellers}
            </div>
            <div className="text-sm text-gray-500">Sellers</div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {stats.admins}
            </div>
            <div className="text-sm text-gray-500">Admins</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Search by name or email..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {pagination.total} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
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
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold mr-3">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.name || "No Name"}
                            </div>
                            {user.businessName && (
                              <div className="text-sm text-gray-500">
                                {user.businessName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role || "customer"}
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {/* Role Update Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowRoleMenu(
                                  showRoleMenu === user._id ? null : user._id,
                                )
                              }
                              className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg"
                              title="Change Role"
                            >
                              <FiUserCheck className="w-5 h-5" />
                            </button>

                            {showRoleMenu === user._id && (
                              <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="p-2 space-y-1">
                                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                    Change Role
                                  </div>
                                  {user.role !== "customer" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateRole(user._id, "customer")
                                      }
                                      className="block w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded"
                                    >
                                      Make Customer
                                    </button>
                                  )}
                                  {user.role !== "seller" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateRole(user._id, "seller")
                                      }
                                      className="block w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded"
                                    >
                                      Make Seller
                                    </button>
                                  )}
                                  {user.role !== "admin" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateRole(user._id, "admin")
                                      }
                                      className="block w-full text-left px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded"
                                    >
                                      Make Admin
                                    </button>
                                  )}
                                  <div className="border-t pt-1">
                                    <button
                                      onClick={() => setShowRoleMenu(null)}
                                      className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Customer Verification Actions */}
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
                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
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
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                                    title="Reject Verification"
                                  >
                                    <FiUserX className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Seller Approval Actions */}
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
                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
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
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                                    title="Reject Seller"
                                  >
                                    <FiUserX className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Delete Button */}
                          {user._id !==
                            JSON.parse(localStorage.getItem("user"))?._id && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
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
    </div>
  );
};

export default AdminUsers;
