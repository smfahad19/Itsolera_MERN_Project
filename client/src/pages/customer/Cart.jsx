import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
} from "react-icons/fi";

const Cart = () => {
  const { token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Get image URL helper function
  const getImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }
    return images[0].url;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    console.log("Token:", token);
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCart = async () => {
    console.log("Fetching cart...");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/customer/cart`, // ✅ FIXED
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Cart API response:", response.data);

      if (response.data.success) {
        const cartData = response.data.data ||
          response.data.cart || { items: [], totalAmount: 0 };

        const items = Array.isArray(cartData.items) ? cartData.items : [];
        const totalPrice = cartData.totalAmount || cartData.totalPrice || 0;

        setCart({
          items,
          totalPrice,
          totalItems: items.reduce(
            (total, item) => total + (item.quantity || 1),
            0,
          ),
        });
      } else {
        toast.error(response.data.message || "Failed to load cart");
        setCart({ items: [], totalPrice: 0, totalItems: 0 });
      }
    } catch (error) {
      console.error("Cart fetch error:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load cart");
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    console.log("Updating quantity for:", productId, "to:", newQuantity);
    setUpdating(productId);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/customer/cart/${productId}`, // ✅ FIXED
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Update response:", response.data);

      if (response.data.success) {
        await fetchCart();
        toast.success("Cart updated");
      } else {
        toast.error(response.data.message || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId) => {
    console.log("Removing item:", productId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/customer/cart/${productId}`, // ✅ FIXED
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Remove response:", response.data);

      if (response.data.success) {
        await fetchCart();
        toast.success("Item removed from cart");
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Remove error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;

    console.log("Clearing cart...");
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/customer/cart`, // ✅ FIXED
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Clear cart response:", response.data);

      if (response.data.success) {
        setCart({ items: [], totalPrice: 0, totalItems: 0 });
        toast.success("Cart cleared");
      } else {
        toast.error(response.data.message || "Failed to clear cart");
      }
    } catch (error) {
      console.error("Clear error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to clear cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">
                {cart.totalItems || 0} item{cart.totalItems !== 1 ? "s" : ""} in
                cart
              </p>
            </div>
            {cart.items && cart.items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-black hover:text-gray-800 text-sm border border-black px-3 py-1 rounded"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cart.items && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="border border-gray-300 rounded">
                {cart.items.map((item) => {
                  const product = item.productId || {};
                  const price = item.price || product.price || 0;
                  const quantity = item.quantity || 1;
                  const imageUrl = getImageUrl(product.images);

                  return (
                    <div
                      key={item._id || product._id}
                      className="p-4 border-b last:border-b-0"
                    >
                      <div className="flex">
                        <div className="w-20 h-20 border border-gray-300 mr-4 overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.title || "Product"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-black">
                                {product.title || "Product"}
                              </h3>
                              {product.brand && (
                                <p className="text-gray-600 text-xs mt-1">
                                  Brand: {product.brand}
                                </p>
                              )}
                              <p className="text-gray-600 text-xs mt-1">
                                Stock: {product.stock || 0}
                              </p>
                              <p className="text-gray-600 text-xs">
                                Price: ${formatPrice(price)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(product._id)}
                              className="text-black hover:text-gray-700"
                              title="Remove item"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center">
                              <button
                                onClick={() =>
                                  updateQuantity(product._id, quantity - 1)
                                }
                                disabled={
                                  quantity <= 1 || updating === product._id
                                }
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l disabled:opacity-50"
                                title="Decrease quantity"
                              >
                                <FiMinus className="w-3 h-3" />
                              </button>
                              <span className="w-10 text-center text-sm border border-gray-300 py-1">
                                {updating === product._id ? (
                                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                                ) : (
                                  quantity
                                )}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(product._id, quantity + 1)
                                }
                                disabled={
                                  quantity >= (product.stock || 0) ||
                                  updating === product._id
                                }
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r disabled:opacity-50"
                                title="Increase quantity"
                              >
                                <FiPlus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-black">
                                ${formatPrice(price * quantity)}
                              </p>
                              <p className="text-xs text-gray-600">
                                ${formatPrice(price)} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <Link
                  to="/customer/dashboard"
                  className="inline-flex items-center text-black hover:text-gray-700 text-sm"
                >
                  <FiArrowRight className="w-3 h-3 mr-1 rotate-180" />
                  Continue Shopping
                </Link>
              </div>
            </div>

            <div>
              <div className="border border-gray-300 rounded p-4">
                <h2 className="text-lg font-bold text-black mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${formatPrice(cart.totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {(cart.totalPrice || 0) >= 50 ? "FREE" : "$10.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">
                      ${formatPrice((cart.totalPrice || 0) * 0.1)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        $
                        {formatPrice(
                          (cart.totalPrice || 0) +
                            ((cart.totalPrice || 0) >= 50 ? 0 : 10) +
                            (cart.totalPrice || 0) * 0.1,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/checkout"
                    className="block w-full bg-black hover:bg-gray-800 text-white text-center py-2 rounded text-sm font-medium"
                  >
                    Proceed to Checkout
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">
                    Free shipping on orders over $50
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Add some products to your cart
            </p>
            <div className="space-x-3">
              <Link
                to="/customer/dashboard"
                className="inline-flex items-center bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
              >
                Browse Products
              </Link>
              <Link
                to="/"
                className="inline-flex items-center border border-gray-300 text-black px-4 py-2 rounded text-sm hover:bg-gray-100"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
