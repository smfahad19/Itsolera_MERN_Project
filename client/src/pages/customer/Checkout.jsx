import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiTruck,
  FiMapPin,
  FiUser,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";

const Checkout = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: "",
  });

  // Get image URL helper function
  const getImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }
    // Images array contains objects: { public_id: "...", url: "..." }
    return images[0].url;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    if (token) {
      fetchCart();
      loadUserAddress();
    } else {
      toast.error("Please login to checkout");
      navigate("/login");
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/customer/cart",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Cart API response:", response.data); // Debug

      if (response.data.success) {
        const cartData = response.data.data || response.data.cart;
        setCart({
          items: cartData?.items || [],
          totalPrice: cartData?.totalAmount || cartData?.totalPrice || 0,
          totalItems: cartData?.items?.length || 0,
        });

        if (!cartData?.items || cartData.items.length === 0) {
          toast.error("Your cart is empty");
          navigate("/cart");
        }
      } else {
        toast.error("Failed to load cart");
        navigate("/cart");
      }
    } catch (error) {
      console.error("Cart error:", error);
      toast.error("Failed to load cart");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddress = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/customer/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.customer?.address) {
        setShippingAddress((prev) => ({
          ...prev,
          ...response.data.customer.address,
          phone: response.data.customer.phone || "",
        }));
      }
    } catch (error) {
      console.error("Address error:", error);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotals = () => {
    const subtotal = cart.totalPrice || 0;
    const shipping = subtotal >= 50 ? 0 : 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const handleSubmitOrder = async () => {
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.country ||
      !shippingAddress.zipCode
    ) {
      toast.error("Please complete your shipping address");
      return;
    }

    if (!shippingAddress.phone) {
      toast.error("Phone number is required");
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.productId?._id || item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod: "cod",
        clearCart: true,
        notes: "",
      };

      console.log("Sending order data:", orderData);

      const response = await axios.post(
        "http://localhost:5000/api/customer/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Order response:", response.data);

      if (response.data.success) {
        toast.success("Order placed successfully!");
        navigate(`/customer/orders/${response.data.order._id}`);
      } else {
        toast.error(response.data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const { subtotal, shipping, tax, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="border border-gray-300 rounded p-6">
              <div className="flex items-center mb-6">
                <FiMapPin className="w-6 h-6 text-black mr-3" />
                <h2 className="text-xl font-bold text-black">
                  Shipping Address
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="NY"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="United States"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="10001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="+1 (123) 456-7890"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-6">
              <div className="flex items-center mb-6">
                <FiTruck className="w-6 h-6 text-black mr-3" />
                <h2 className="text-xl font-bold text-black">Payment Method</h2>
              </div>

              <div className="p-4 border border-gray-300 rounded">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <FiTruck className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Cash on Delivery</h3>
                    <p className="text-sm text-gray-600">
                      Pay when you receive your order
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  <strong>Note:</strong> Our delivery partner will collect
                  payment when your order is delivered.
                </p>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-6">
              <div className="flex items-center mb-6">
                <FiUser className="w-6 h-6 text-black mr-3" />
                <h2 className="text-xl font-bold text-black">
                  Contact Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="border border-gray-300 rounded p-6">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-bold text-black">Order Summary</h2>
              </div>

              <div className="mb-6 max-h-64 overflow-y-auto">
                {cart.items && cart.items.length > 0 ? (
                  cart.items.map((item) => {
                    const product = item.productId || {};
                    const price = item.price || product.price || 0;
                    const quantity = item.quantity || 1;
                    const imageUrl = getImageUrl(product.images);

                    return (
                      <div
                        key={item._id || product._id}
                        className="flex items-center py-3 border-b"
                      >
                        <div className="w-12 h-12 border border-gray-300 mr-4 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.title || "Product"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-xs text-gray-400">Img</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black line-clamp-1">
                            {product.title || "Product"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {quantity} × ${formatPrice(price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-black">
                            ${formatPrice(price * quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No items in cart
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-300 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "FREE" : `$${formatPrice(shipping)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span>Total</span>
                  <span>${formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 border border-gray-300 rounded">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-black">
                    Cash on Delivery
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Pay cash when you receive your order.
                </p>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={processing || !cart.items || cart.items.length === 0}
                className={`w-full mt-6 py-3 rounded font-medium flex items-center justify-center ${
                  processing || !cart.items || cart.items.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black hover:bg-gray-800 text-white"
                }`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5 mr-2" />
                    Place Order
                  </>
                )}
              </button>

              <Link
                to="/cart"
                className="block w-full mt-4 text-center text-black hover:text-gray-700 font-medium"
              >
                <FiArrowLeft className="inline w-4 h-4 mr-1" />
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
