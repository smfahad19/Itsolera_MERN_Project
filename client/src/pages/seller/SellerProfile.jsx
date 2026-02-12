import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiGlobe as FiLink,
} from "react-icons/fi";

const SellerProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    businessPhone: "",
    businessWebsite: "",
  });

  const API_BASE = `${API_BASE_URL}/api`;

  const API_ENDPOINTS = {
    seller: {
      profile: `${API_BASE}/seller/profile`,
      updateProfile: `${API_BASE}/seller/profile`,
      approvalStatus: `${API_BASE}/seller/approval-status`,
    },
  };

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.seller.profile, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sellerData = response.data.seller || response.data;
        setProfile(sellerData);

        setFormData({
          phone: sellerData.phone || "",
          address: sellerData.address || {
            street: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
          },
          businessName: sellerData.businessName || "",
          businessDescription: sellerData.businessDescription || "",
          businessAddress: sellerData.businessAddress || "",
          businessPhone: sellerData.businessPhone || "",
          businessWebsite: sellerData.businessWebsite || "",
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        phone: formData.phone,
        address: formData.address,
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        businessWebsite: formData.businessWebsite,
      };

      const response = await axios.put(
        API_ENDPOINTS.seller.updateProfile, // ✅ FIXED
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setProfile(response.data.seller);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Store Settings
              </h1>
              <p className="text-gray-600 text-sm">
                Manage your seller profile and store information
              </p>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1.5 bg-black text-white rounded hover:bg-gray-800 text-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Store Info */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  Store Information
                </h2>
              </div>

              <div className="p-4">
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Business Name */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="Enter your business name"
                      />
                    </div>

                    {/* Business Description */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Business Description
                      </label>
                      <textarea
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="Describe your business"
                      />
                    </div>

                    {/* Business Address */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Business Address
                      </label>
                      <input
                        type="text"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="Business address"
                      />
                    </div>

                    {/* Business Phone */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Business Phone
                      </label>
                      <input
                        type="tel"
                        name="businessPhone"
                        value={formData.businessPhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="Business phone number"
                      />
                    </div>

                    {/* Business Website */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Business Website
                      </label>
                      <input
                        type="url"
                        name="businessWebsite"
                        value={formData.businessWebsite}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Personal Phone */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Personal Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                        placeholder="Your phone number"
                      />
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 text-sm">
                        Personal Address
                      </h3>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Street
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-1.5 border rounded text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-1.5 border rounded text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-1.5 border rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-1.5 border rounded text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-1.5 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-black text-white rounded hover:bg-gray-800 text-sm"
                      >
                        Save Changes
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            phone: profile?.phone || "",
                            address: profile?.address || {
                              street: "",
                              city: "",
                              state: "",
                              country: "",
                              zipCode: "",
                            },
                            businessName: profile?.businessName || "",
                            businessDescription:
                              profile?.businessDescription || "",
                            businessAddress: profile?.businessAddress || "",
                            businessPhone: profile?.businessPhone || "",
                            businessWebsite: profile?.businessWebsite || "",
                          });
                        }}
                        className="px-4 py-1.5 border rounded text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Business Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          {profile?.businessName || "Your Business"}
                        </h3>
                        {profile?.businessDescription && (
                          <p className="text-gray-600 text-sm">
                            {profile.businessDescription}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {profile?.businessAddress && (
                          <div className="flex items-start">
                            <FiHome className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
                            <span className="text-gray-700 text-sm">
                              {profile.businessAddress}
                            </span>
                          </div>
                        )}

                        {profile?.businessPhone && (
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-700 text-sm">
                              {profile.businessPhone}
                            </span>
                          </div>
                        )}

                        {profile?.businessWebsite && (
                          <div className="flex items-center">
                            <FiLink className="w-4 h-4 text-gray-400 mr-2" />
                            <a
                              href={profile.businessWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {profile.businessWebsite}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Personal Information
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-600">Name</p>
                            <p className="text-gray-900">{user?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <FiMail className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="text-gray-900">{user?.email}</p>
                          </div>
                        </div>

                        {profile?.phone && (
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-xs text-gray-600">Phone</p>
                              <p className="text-gray-900">{profile.phone}</p>
                            </div>
                          </div>
                        )}

                        {profile?.address?.street && (
                          <div className="flex items-start">
                            <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
                            <div>
                              <p className="text-xs text-gray-600">Address</p>
                              <p className="text-gray-900">
                                {profile.address.street}
                                {profile.address.city &&
                                  `, ${profile.address.city}`}
                                {profile.address.state &&
                                  `, ${profile.address.state}`}
                                {profile.address.country &&
                                  `, ${profile.address.country}`}
                                {profile.address.zipCode &&
                                  ` ${profile.address.zipCode}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Status & Links */}
          <div className="space-y-6">
            {/* Approval Status */}
            <div className="bg-white border rounded">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  Account Status
                </h2>
              </div>

              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      profile?.isApproved
                        ? "bg-green-500"
                        : profile?.approvalStatus === "rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {profile?.isApproved
                        ? "Approved"
                        : profile?.approvalStatus?.charAt(0).toUpperCase() +
                            profile?.approvalStatus?.slice(1) || "Pending"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile?.isApproved
                        ? "Your account is active"
                        : "Waiting for admin approval"}
                    </p>
                  </div>
                </div>

                {profile?.approvalStatus === "pending" && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <p className="text-yellow-800">
                      Your application is under review
                    </p>
                  </div>
                )}

                {profile?.approvalStatus === "rejected" &&
                  profile?.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="font-medium text-red-800">
                        Rejection Reason:
                      </p>
                      <p className="text-red-700">{profile.rejectionReason}</p>
                    </div>
                  )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border rounded">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  <a
                    href="/seller/products"
                    className="block text-gray-700 hover:text-black hover:underline text-sm"
                  >
                    Manage Products →
                  </a>
                  <a
                    href="/seller/orders"
                    className="block text-gray-700 hover:text-black hover:underline text-sm"
                  >
                    View Orders →
                  </a>
                  <a
                    href="/seller/dashboard"
                    className="block text-gray-700 hover:text-black hover:underline text-sm"
                  >
                    Dashboard →
                  </a>
                  <a
                    href="/seller/products/add"
                    className="block text-gray-700 hover:text-black hover:underline text-sm"
                  >
                    Add New Product →
                  </a>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white border rounded">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">
                  Account Information
                </h2>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Account Type</p>
                    <p className="font-medium text-gray-900">Seller Account</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Joined</p>
                    <p className="text-gray-900">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Last Updated</p>
                    <p className="text-gray-900">
                      {profile?.updatedAt
                        ? new Date(profile.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
