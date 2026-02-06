import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../slices/authSlice";
import {
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiShoppingBag,
  FiPackage,
  FiHome,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSellerApproved, setIsSellerApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check seller approval status
  useEffect(() => {
    const checkSellerApproval = async () => {
      if (user?.role === "seller" && token) {
        try {
          setLoading(true);
          const response = await axios.get(
            "http://localhost:5000/api/seller/approval-status",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.data.success) {
            setIsSellerApproved(response.data.isApproved);
          }
        } catch (error) {
          console.error("Error checking seller approval:", error);
          setIsSellerApproved(false);
        } finally {
          setLoading(false);
        }
      }
    };

    checkSellerApproval();
  }, [user, token]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
    setIsProfileMenuOpen(false);
  };

  const handleSellerDashboardClick = () => {
    if (!user || user.role !== "seller") {
      navigate("/");
      return;
    }

    if (!isSellerApproved) {
      toast.error("Your seller account is pending approval");
      navigate("/seller/dashboard"); // Still navigate to show approval pending screen
    } else {
      navigate("/seller/dashboard");
    }
  };

  const handleDashboardClick = () => {
    if (!user) {
      navigate("/");
      return;
    }

    switch (user.role) {
      case "seller":
        handleSellerDashboardClick();
        break;
      case "admin":
        navigate("/admin/dashboard");
        break;
      case "customer":
      default:
        navigate("/customer/dashboard");
        break;
    }
  };

  // Check if seller links should be shown
  const shouldShowSellerLinks = user?.role === "seller" && isSellerApproved;

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-black">MarketHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-black hover:text-gray-700">
              <FiHome className="w-4 h-4 inline mr-1" />
              Home
            </Link>

            {/* Show Seller Dashboard link only if approved */}
            {shouldShowSellerLinks && (
              <button
                onClick={handleSellerDashboardClick}
                className="text-black hover:text-gray-700"
              >
                <FaStore className="w-4 h-4 inline mr-1" />
                Seller Dashboard
              </button>
            )}

            {/* Show pending approval badge if seller is not approved */}
            {user?.role === "seller" && !isSellerApproved && !loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <FaStore className="w-3 h-3 mr-1" />
                Pending Approval
              </span>
            )}

            {token && user?.role === "customer" && (
              <>
                <Link
                  to="/customer/orders"
                  className="text-black hover:text-gray-700"
                >
                  <FiPackage className="w-4 h-4 inline mr-1" />
                  Orders
                </Link>
                <Link to="/cart" className="text-black hover:text-gray-700">
                  <FiShoppingBag className="w-4 h-4 inline mr-1" />
                  Cart
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Dashboard Button for logged in users */}
            {token && user && (
              <button
                onClick={handleDashboardClick}
                className="hidden md:flex items-center space-x-1 text-black hover:text-gray-700"
              >
                <span>Dashboard</span>
              </button>
            )}

            {/* Profile Menu */}
            {token && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2"
                >
                  <div className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-black hidden md:block">
                    {user.name}
                    {user.role === "seller" && !isSellerApproved && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-300">
                      <p className="text-sm font-medium text-black">
                        {user.name}
                        {user.role === "seller" && !isSellerApproved && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-600 capitalize">
                        {user.role} Account
                      </p>
                    </div>

                    <div className="py-2">
                      {/* Dashboard link */}
                      <button
                        onClick={() => {
                          handleDashboardClick();
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-black hover:bg-gray-100"
                      >
                        Dashboard
                      </button>

                      {/* Customer specific links */}
                      {user.role === "customer" && (
                        <>
                          <Link
                            to="/customer/profile"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/customer/orders"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Orders
                          </Link>
                          <Link
                            to="/cart"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Cart
                          </Link>
                        </>
                      )}

                      {/* Seller specific links - only show if approved */}
                      {user.role === "seller" && isSellerApproved && (
                        <>
                          <Link
                            to="/seller/profile"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Store Settings
                          </Link>
                          <Link
                            to="/seller/products"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            My Products
                          </Link>
                        </>
                      )}

                      {/* Seller not approved message */}
                      {user.role === "seller" &&
                        !isSellerApproved &&
                        !loading && (
                          <div className="px-4 py-2 text-xs text-yellow-700 bg-yellow-50 border-t border-yellow-100">
                            <p className="font-medium">Account Pending</p>
                            <p>Waiting for admin approval</p>
                          </div>
                        )}

                      {/* Logout */}
                      <div className="border-t border-gray-300 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-black hover:bg-gray-100"
                        >
                          <FiLogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-black hover:text-gray-700">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="border border-black text-black px-4 py-2 hover:bg-black hover:text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-black"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-300 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-black py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {token && user && (
                <>
                  <button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-black py-2"
                  >
                    Dashboard
                    {user.role === "seller" && !isSellerApproved && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </button>

                  {/* Show seller links only if approved */}
                  {user.role === "seller" && isSellerApproved && (
                    <>
                      <Link
                        to="/seller/profile"
                        className="text-black py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Store Settings
                      </Link>
                      <Link
                        to="/seller/products"
                        className="text-black py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Products
                      </Link>
                    </>
                  )}

                  {/* Customer links */}
                  {user.role === "customer" && (
                    <>
                      <Link
                        to="/customer/orders"
                        className="text-black py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        to="/cart"
                        className="text-black py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Cart
                      </Link>
                    </>
                  )}
                </>
              )}

              {!token && (
                <>
                  <Link
                    to="/login"
                    className="text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-black py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Seller approval status in mobile */}
              {user?.role === "seller" && !isSellerApproved && !loading && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-800">
                    Account Pending Approval
                  </p>
                  <p className="text-xs text-yellow-700">
                    Waiting for admin review
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
