import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSave,
  FiEdit2,
  FiCalendar,
  FiShield,
} from "react-icons/fi";

const CustomerProfile = () => {
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
  });

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/customer/profile`, // ✅ FIXED
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          const customerData = response.data.customer;
          setProfile(customerData);
          setFormData({
            phone: customerData?.phone || "",
            address: customerData?.address || {
              street: "",
              city: "",
              state: "",
              country: "",
              zipCode: "",
            },
          });
        }
      } catch (error) {
        toast.error("Failed to load profile");
        console.error("Profile error:", error);
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
      const response = await axios.put(
        `${API_BASE_URL}/api/customer/profile`, // ✅ FIXED
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setProfile(response.data.customer);
        setEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">
                Manage your personal information
              </p>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h2>
              </div>

              <div className="p-6">
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Name cannot be changed
                      </p>
                    </div>

                    {/* Email Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex items-center">
                        <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>

                      <div className="space-y-4">
                        <div>
                          <input
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street Address"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="City"
                          />

                          <input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Country"
                          />

                          <input
                            type="text"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleInputChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ZIP Code"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiSave className="w-4 h-4" />
                        <span>Save Changes</span>
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
                          });
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Profile Info Display */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <FiUser className="w-6 h-6 text-blue-600" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {user?.name}
                        </h3>
                        <p className="text-gray-600">Customer Account</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-gray-900">{user?.email}</p>
                        </div>
                      </div>

                      {profile?.phone && (
                        <div className="flex items-center">
                          <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="text-gray-900">{profile.phone}</p>
                          </div>
                        </div>
                      )}

                      {profile?.address?.street && (
                        <div className="flex items-start">
                          <FiMapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="text-gray-900">
                              {profile.address.street}
                              {profile.address.city &&
                                `, ${profile.address.city}`}
                              {profile.address.state &&
                                `, ${profile.address.state}`}
                              {profile.address.country &&
                                `, ${profile.address.country}`}
                              {profile.address.zipCode &&
                                ` - ${profile.address.zipCode}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Account Information
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="text-gray-900 font-medium">Customer</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <span className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      <FiShield className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3">Security Note</h3>
              <p className="text-sm text-blue-700">
                For security reasons, some information like email cannot be
                changed here. Contact support if you need to update your email
                address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
