import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Customer Pages
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerOrders from "./pages/customer/CustomerOrders";
import OrderDetails from "./pages/customer/OrderDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import ProductDetails from "./pages/customer/ProductDetails";

// Seller Pages
import SellerDashboard from "./pages/seller/Dashboard";
import SellerProfile from "./pages/seller/SellerProfile";
import SellerProducts from "./pages/seller/SellerProducts";
import AddProduct from "./pages/seller/AddProduct";
import EditProduct from "./pages/seller/EditProduct";
import SellerOrders from "./pages/seller/SellerOrders"; // Add this import

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/customer/Products";

// Component to handle role-based redirection
const RoleBasedRedirect = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case "seller":
      return <Navigate to="/seller/dashboard" />;
    case "admin":
      return <Navigate to="/admin/dashboard" />;
    case "customer":
    default:
      return <Navigate to="/customer/dashboard" />;
  }
};

// Component to handle authenticated user redirect
const AuthenticatedRedirect = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  if (token) {
    return <RoleBasedRedirect />;
  }

  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-white">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <AuthenticatedRedirect>
                  <Home />
                </AuthenticatedRedirect>
              }
            />
            <Route
              path="/login"
              element={
                <AuthenticatedRedirect>
                  <Login />
                </AuthenticatedRedirect>
              }
            />
            <Route
              path="/register"
              element={
                <AuthenticatedRedirect>
                  <Register />
                </AuthenticatedRedirect>
              }
            />

            {/* Customer Protected Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/orders"
              element={
                <ProtectedRoute>
                  <CustomerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />

            {/* Seller Protected Routes */}
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute>
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/seller/profile"
              element={
                <ProtectedRoute>
                  <SellerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products"
              element={
                <ProtectedRoute>
                  <SellerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/add"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/edit/:id"
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route - redirect based on auth status */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </Provider>
  );
};

export default App;
