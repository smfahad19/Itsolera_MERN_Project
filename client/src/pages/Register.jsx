import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../slices/authSlice";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token && user) {
      if (user.role === "customer") {
        navigate("/customer/dashboard");
      } else if (user.role === "seller") {
        navigate("/seller/dashboard");
      } else if (user.role === "admin") {
        navigate("/admin/dashboard");
      }
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="Enter email"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="Create password"
                required
                minLength="6"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-3">Account Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={formData.role === "customer"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Customer (Shop and buy products)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={formData.role === "seller"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Seller (Sell products - Admin approval required)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded hover:bg-black disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-gray-900 hover:text-black">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
