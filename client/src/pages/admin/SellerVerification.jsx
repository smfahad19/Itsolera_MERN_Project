import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUserCheck,
  FiUserX,
  FiEye,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowLeft,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

const SellerVerification = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "pending",
    search: "",
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchApplications();
  }, [token, navigate, filters.status]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      let endpoint = `${API_BASE_URL}/api/admin/sellers`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filters.status,
          limit: 100,
        },
      });

      console.log("API Response:", response.data); // Debug log

      if (response.data.success) {
        // Handle different response structures
        const sellers = response.data.sellers || response.data.data || [];
        const statsData = response.data.stats || {
          pending: sellers.filter((s) => s.approvalStatus === "pending").length,
          approved: sellers.filter((s) => s.approvalStatus === "approved")
            .length,
          rejected: sellers.filter((s) => s.approvalStatus === "rejected")
            .length,
          total: sellers.length,
        };

        setApplications(sellers);
        setStats(statsData);
      }
    } catch (error) {
      console.error(
        "API Error Details:",
        error.response?.data || error.message,
      );

      // Try alternative endpoints if first fails
      try {
        const fallbackResponse = await axios.get(
          `${API_BASE_URL}/api/sellers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (fallbackResponse.data.success) {
          const sellers = fallbackResponse.data.sellers || [];
          setApplications(sellers);
          setStats({
            pending: sellers.filter((s) => s.approvalStatus === "pending")
              .length,
            approved: sellers.filter((s) => s.approvalStatus === "approved")
              .length,
            rejected: sellers.filter((s) => s.approvalStatus === "rejected")
              .length,
            total: sellers.length,
          });
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        toast.error("Failed to load seller applications");
        setApplications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId, notes = "") => {
    try {
      // Try multiple possible endpoints
      let endpoint = `${API_BASE_URL}/api/admin/sellers/${sellerId}/approve`;

      const response = await axios.put(
        endpoint,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller approved successfully");
        fetchApplications();
        setShowDetails(false);
      }
    } catch (error) {
      console.error("Approve Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to approve seller");
    }
  };

  const handleRejectSeller = async (sellerId, reason = "", notes = "") => {
    if (!reason.trim()) {
      reason = prompt("Please enter rejection reason:");
      if (!reason) return;
    }

    try {
      let endpoint = `${API_BASE_URL}/api/admin/sellers/${sellerId}/reject`;

      const response = await axios.put(
        endpoint,
        { reason, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller application rejected");
        fetchApplications();
        setShowDetails(false);
      }
    } catch (error) {
      console.error("Reject Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to reject seller");
    }
  };

  const handleSuspendSeller = async (
    sellerId,
    reason = "",
    days = 30,
    notes = "",
  ) => {
    if (!reason.trim()) {
      reason = prompt("Please enter suspension reason:");
      if (!reason) return;
    }

    try {
      let endpoint = `${API_BASE_URL}/api/admin/sellers/${sellerId}/suspend`;

      const response = await axios.put(
        endpoint,
        { reason, suspensionDays: days, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller suspended successfully");
        fetchApplications();
        setShowDetails(false);
      }
    } catch (error) {
      console.error("Suspend Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to suspend seller");
    }
  };

  const viewApplicationDetails = async (sellerId) => {
    try {
      let endpoint = `${API_BASE_URL}/api/admin/sellers/${sellerId}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Seller Details Response:", response.data);

      if (response.data.success) {
        setSelectedApplication(response.data);
        setShowDetails(true);
      } else {
        // If endpoint returns different structure
        setSelectedApplication({
          seller: response.data,
          businessInfo: response.data,
          stats: {},
        });
        setShowDetails(true);
      }
    } catch (error) {
      console.error(
        "View Details Error:",
        error.response?.data || error.message,
      );

      // Fallback: Create dummy data for demo
      const dummyData = {
        seller: applications.find((app) => app._id === sellerId) || {},
        businessInfo: applications.find((app) => app._id === sellerId) || {},
        stats: {
          totalProducts: 0,
          totalOrders: 0,
          activeProducts: 0,
          totalRevenue: 0,
        },
      };

      setSelectedApplication(dummyData);
      setShowDetails(true);

      toast.error("Using demo data. Check API endpoint.");
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "approved":
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

  const getDisplayStatus = (seller) => {
    if (!seller) return "pending";

    // Check for suspension
    if (seller.suspensionEnd && new Date(seller.suspensionEnd) > new Date()) {
      return "suspended";
    }

    // Check rejection reason for suspension
    if (seller.rejectionReason?.toLowerCase().includes("suspend")) {
      return "suspended";
    }

    return seller.approvalStatus || "pending";
  };

  // Filter applications based on search
  const filteredApplications = applications.filter((seller) => {
    if (!filters.search) return true;

    const searchTerm = filters.search.toLowerCase();
    return (
      seller.name?.toLowerCase().includes(searchTerm) ||
      seller.email?.toLowerCase().includes(searchTerm) ||
      seller.businessName?.toLowerCase().includes(searchTerm) ||
      seller.phone?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller applications...</p>
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
                  Seller Verification
                </h1>
                <p className="text-sm text-gray-500">
                  Review and verify seller applications
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchApplications}
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
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-500">Total Sellers</div>
              </div>
              <FiUsers className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-500">Pending Review</div>
              </div>
              <FiAlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
              <FiXCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {["pending", "approved", "rejected", "suspended"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilters({ ...filters, status })}
                    className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                      filters.status === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or business..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((seller) => {
                    const displayStatus = getDisplayStatus(seller);

                    return (
                      <tr
                        key={seller._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold mr-3">
                              {seller.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {seller.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {seller.email || "N/A"}
                              </div>
                              {seller.phone && (
                                <div className="text-sm text-gray-500">
                                  {seller.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {seller.businessName || "No business name"}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {seller.businessType || "Not specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}
                          >
                            {displayStatus}
                          </span>
                          {seller.createdAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Applied:{" "}
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewApplicationDetails(seller._id)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>

                            {displayStatus === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApproveSeller(seller._id)
                                  }
                                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                                  title="Approve"
                                >
                                  <FiUserCheck className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt(
                                      "Enter rejection reason:",
                                    );
                                    if (reason)
                                      handleRejectSeller(seller._id, reason);
                                  }}
                                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                                  title="Reject"
                                >
                                  <FiUserX className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {displayStatus === "approved" && (
                              <button
                                onClick={() => {
                                  const reason = prompt(
                                    "Enter suspension reason:",
                                  );
                                  if (reason)
                                    handleSuspendSeller(seller._id, reason);
                                }}
                                className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg"
                                title="Suspend"
                              >
                                <FiXCircle className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
            <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Seller Applications Found
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.search
                ? `No results found for "${filters.search}"`
                : `There are no ${filters.status} seller applications.`}
            </p>
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: "" })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* API Debug Info (remove in production) */}
        <div className="mt-4 text-xs text-gray-500">
          API Base URL: {API_BASE_URL}
          <br />
          Total applications: {applications.length}
          <br />
          Status filter: {filters.status}
        </div>
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Seller Application Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Simple Details View */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seller Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Seller Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <div className="font-medium">
                          {selectedApplication.seller?.name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <div className="font-medium">
                          {selectedApplication.seller?.email || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <div className="font-medium">
                          {selectedApplication.seller?.phone || "Not provided"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Status Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">
                          Current Status:
                        </span>
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(getDisplayStatus(selectedApplication.seller))}`}
                        >
                          {getDisplayStatus(selectedApplication.seller)}
                        </div>
                      </div>
                      {selectedApplication.seller?.createdAt && (
                        <div>
                          <span className="text-sm text-gray-500">
                            Applied On:
                          </span>
                          <div className="font-medium">
                            {new Date(
                              selectedApplication.seller.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">
                        Business Name:
                      </span>
                      <div className="font-medium">
                        {selectedApplication.businessInfo?.businessName ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Business Type:
                      </span>
                      <div className="font-medium capitalize">
                        {selectedApplication.businessInfo?.businessType ||
                          "Not specified"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-500">Address:</span>
                      <div className="font-medium">
                        {selectedApplication.businessInfo?.businessAddress ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>

                  {getDisplayStatus(selectedApplication.seller) ===
                    "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleApproveSeller(selectedApplication.seller?._id)
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve Seller
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason)
                            handleRejectSeller(
                              selectedApplication.seller?._id,
                              reason,
                            );
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Reject Application
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerVerification;
