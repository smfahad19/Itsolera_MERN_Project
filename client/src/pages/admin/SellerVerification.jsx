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
  FiFilter,
} from "react-icons/fi";

const SellerVerification = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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

      const response = await axios.get(
        "http://localhost:5000/api/admin/sellers",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filters.status },
        },
      );

      if (response.data.success) {
        setApplications(response.data.sellers);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Fetch Applications Error:", error);
      toast.error("Failed to load seller applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId, notes = "") => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/sellers/${sellerId}/approve`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller approved successfully");
        fetchApplications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve seller");
    }
  };

  const handleRejectSeller = async (sellerId, reason = "", notes = "") => {
    if (!reason.trim()) {
      reason = prompt("Please enter rejection reason:");
      if (!reason) return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/sellers/${sellerId}/reject`,
        { reason, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller application rejected");
        fetchApplications();
      }
    } catch (error) {
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
      const response = await axios.put(
        `http://localhost:5000/api/admin/sellers/${sellerId}/suspend`,
        { reason, suspensionDays: days, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Seller suspended successfully");
        fetchApplications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to suspend seller");
    }
  };

  const handleVerifyDocument = async (sellerId, documentIndex) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/sellers/${sellerId}/documents/verify`,
        { documentIndex, verified: true },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Document verified");
        fetchApplications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify document");
    }
  };

  const viewApplicationDetails = async (sellerId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/sellers/${sellerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setSelectedApplication(response.data);
        setShowDetails(true);
      }
    } catch (error) {
      toast.error("Failed to load application details");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        // Check if it's actually a suspension
        const isSuspended =
          selectedApplication?.seller?.rejectionReason?.includes("SUSPENDED:");
        return isSuspended
          ? "bg-orange-100 text-orange-800"
          : "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (seller) => {
    if (seller.rejectionReason?.includes("SUSPENDED:")) {
      return "suspended";
    }
    return seller.approvalStatus;
  };

  const getDocumentStatus = (documents) => {
    if (!documents || documents.length === 0) return "No documents";
    const verified = documents.filter((d) => d.verified).length;
    return `${verified}/${documents.length} verified`;
  };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Sellers</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {/* REMOVED "suspended" from filters */}
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilters({ ...filters, status })}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      filters.status === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sellers..."
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
        <div className="bg-white border rounded-lg overflow-hidden">
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
                    Documents
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
                {applications.length > 0 ? (
                  applications.map((seller) => {
                    const isSuspended =
                      seller.rejectionReason?.includes("SUSPENDED:");
                    const displayStatus = isSuspended
                      ? "suspended"
                      : seller.approvalStatus;

                    return (
                      <tr key={seller._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold mr-3">
                              {seller.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {seller.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {seller.email}
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
                          <div className="text-sm text-gray-900">
                            {seller.businessName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {seller.businessType}
                          </div>
                          {seller.businessAddress && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {seller.businessAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {getDocumentStatus(seller.businessDocuments)}
                          </div>
                          {seller.businessDocuments &&
                            seller.businessDocuments.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {seller.businessDocuments.map((doc, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1"
                                  >
                                    {doc.verified ? (
                                      <FiCheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <FiAlertCircle className="w-3 h-3 text-yellow-500" />
                                    )}
                                    <span className="capitalize">
                                      {doc.documentType?.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}
                          >
                            {displayStatus}
                          </span>
                          {isSuspended && seller.suspensionEnd && (
                            <div className="text-xs text-orange-500 mt-1">
                              Until:{" "}
                              {new Date(
                                seller.suspensionEnd,
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {seller.approvedAt && !isSuspended && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(seller.approvedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewApplicationDetails(seller._id)}
                              className="p-1 text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>

                            {seller.approvalStatus === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApproveSeller(seller._id)
                                  }
                                  className="p-1 text-green-600 hover:text-green-900"
                                  title="Approve"
                                >
                                  <FiUserCheck className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectSeller(seller._id)}
                                  className="p-1 text-red-600 hover:text-red-900"
                                  title="Reject"
                                >
                                  <FiUserX className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {seller.approvalStatus === "approved" && (
                              <button
                                onClick={() => handleSuspendSeller(seller._id)}
                                className="p-1 text-orange-600 hover:text-orange-900"
                                title="Suspend"
                              >
                                <FiXCircle className="w-5 h-5" />
                              </button>
                            )}

                            {isSuspended && (
                              <button
                                onClick={() =>
                                  handleRejectSeller(
                                    seller._id,
                                    "Remove suspension",
                                    "",
                                  )
                                }
                                className="p-1 text-blue-600 hover:text-blue-900 text-xs"
                                title="Remove Suspension"
                              >
                                Unsuspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No {filters.status} applications found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <div className="font-medium">
                        {selectedApplication.seller.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <div className="font-medium">
                        {selectedApplication.seller.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <div className="font-medium">
                        {selectedApplication.seller.phone || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Business Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-500">
                        Business Name
                      </label>
                      <div className="font-medium">
                        {selectedApplication.businessInfo.businessName}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        Business Type
                      </label>
                      <div className="font-medium capitalize">
                        {selectedApplication.businessInfo.businessType}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <div className="font-medium">
                        {selectedApplication.businessInfo.businessAddress}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <h3 className="font-medium text-gray-900 mb-3">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.businessInfo.businessDocuments?.map(
                      (doc, idx) => (
                        <div key={idx} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {doc.documentType?.replace(/_/g, " ")}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${doc.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {doc.verified ? "Verified" : "Pending"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {doc.documentName}
                          </div>
                          {doc.documentUrl && (
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              <FiEye className="w-4 h-4" />
                              View Document
                            </a>
                          )}
                          {!doc.verified && (
                            <button
                              onClick={() =>
                                handleVerifyDocument(
                                  selectedApplication.seller._id,
                                  idx,
                                )
                              }
                              className="mt-2 text-sm text-green-600 hover:text-green-800"
                            >
                              Mark as Verified
                            </button>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                {selectedApplication.businessInfo.bankDetails && (
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Bank Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">
                          Account Name
                        </label>
                        <div className="font-medium">
                          {
                            selectedApplication.businessInfo.bankDetails
                              .accountName
                          }
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          Account Number
                        </label>
                        <div className="font-medium">
                          {
                            selectedApplication.businessInfo.bankDetails
                              .accountNumber
                          }
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          Bank Name
                        </label>
                        <div className="font-medium">
                          {
                            selectedApplication.businessInfo.bankDetails
                              .bankName
                          }
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          IFSC Code
                        </label>
                        <div className="font-medium">
                          {
                            selectedApplication.businessInfo.bankDetails
                              .ifscCode
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">
                        Total Products
                      </label>
                      <div className="font-medium">
                        {selectedApplication.stats.totalProducts}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        Total Orders
                      </label>
                      <div className="font-medium">
                        {selectedApplication.stats.totalOrders}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        Active Products
                      </label>
                      <div className="font-medium">
                        {selectedApplication.stats.activeProducts}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        Total Revenue
                      </label>
                      <div className="font-medium">
                        ${selectedApplication.stats.totalRevenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Approval Status
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <div
                        className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedApplication.seller.rejectionReason?.includes("SUSPENDED:") ? "suspended" : selectedApplication.approvalInfo.approvalStatus)}`}
                      >
                        {selectedApplication.seller.rejectionReason?.includes(
                          "SUSPENDED:",
                        )
                          ? "suspended"
                          : selectedApplication.approvalInfo.approvalStatus}
                      </div>
                    </div>
                    {selectedApplication.seller.suspensionEnd && (
                      <div>
                        <label className="text-sm text-gray-500">
                          Suspension End
                        </label>
                        <div className="font-medium">
                          {new Date(
                            selectedApplication.seller.suspensionEnd,
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedApplication.approvalInfo.approvedAt &&
                      !selectedApplication.seller.rejectionReason?.includes(
                        "SUSPENDED:",
                      ) && (
                        <div>
                          <label className="text-sm text-gray-500">
                            Approved At
                          </label>
                          <div className="font-medium">
                            {new Date(
                              selectedApplication.approvalInfo.approvedAt,
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}
                    {selectedApplication.approvalInfo.rejectionReason && (
                      <div>
                        <label className="text-sm text-gray-500">
                          {selectedApplication.seller.rejectionReason?.includes(
                            "SUSPENDED:",
                          )
                            ? "Suspension Reason"
                            : "Rejection Reason"}
                        </label>
                        <div
                          className={`font-medium ${selectedApplication.seller.rejectionReason?.includes("SUSPENDED:") ? "text-orange-600" : "text-red-600"}`}
                        >
                          {selectedApplication.seller.rejectionReason?.includes(
                            "SUSPENDED:",
                          )
                            ? selectedApplication.seller.rejectionReason.replace(
                                "SUSPENDED: ",
                                "",
                              )
                            : selectedApplication.approvalInfo.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                {selectedApplication.approvalInfo.approvalStatus ===
                  "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveSeller(selectedApplication.seller._id);
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Seller
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Enter rejection reason:");
                        if (reason) {
                          handleRejectSeller(
                            selectedApplication.seller._id,
                            reason,
                          );
                          setShowDetails(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  </>
                )}

                {selectedApplication.approvalInfo.approvalStatus ===
                  "approved" && (
                  <button
                    onClick={() => {
                      const reason = prompt("Enter suspension reason:");
                      if (reason) {
                        handleSuspendSeller(
                          selectedApplication.seller._id,
                          reason,
                        );
                        setShowDetails(false);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Suspend Seller
                  </button>
                )}

                {selectedApplication.seller.rejectionReason?.includes(
                  "SUSPENDED:",
                ) && (
                  <button
                    onClick={() => {
                      const reason = prompt(
                        "Enter reason for removing suspension:",
                      );
                      if (reason) {
                        handleRejectSeller(
                          selectedApplication.seller._id,
                          reason,
                        );
                        setShowDetails(false);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Remove Suspension
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerVerification;
