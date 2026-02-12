import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiStar,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";

const ProductDetails = () => {
  const { id } = useParams();
  const { token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  // Get image URL helper
  const getImageUrl = (images, index = 0) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop";
    }
    if (index >= images.length) index = 0;
    return images[index].url;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      console.log("🔄 Fetching product with ID:", id);

      // First validate if the ID looks valid
      if (!id || id === "undefined" || !/^[0-9a-fA-F]{24}$/.test(id)) {
        toast.error("Invalid product ID");
        navigate("/customer/dashboard");
        return;
      }

      // Use customer API for product details
      const response = await axios.get(
        `${API_BASE_URL}/api/customer/products/${id}`, // ✅ FIXED
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {},
      );

      if (response.data.success) {
        if (response.data.data) {
          setProduct(response.data.data);
        } else {
          setProduct(response.data.product);
        }
      } else {
        toast.error(response.data.message || "Product not found");
        navigate("/customer/dashboard");
      }
    } catch (error) {
      console.error("Product details error:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.data?.error?.includes("Cast to ObjectId")) {
        toast.error("Invalid product ID format");
      } else if (error.response?.status === 404) {
        toast.error("Product not found");
      } else {
        toast.error("Failed to load product details");
      }

      navigate("/customer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!token) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/customer/cart/${id}`, // ✅ FIXED
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        toast.success(`Added ${quantity} item(s) to cart successfully!`);
      } else {
        toast.error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            Product Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/customer/dashboard" className="hover:text-black">
              Home
            </Link>
            <FiChevronRight className="w-4 h-4 mx-2" />
            <span className="text-black">
              {product.category?.name || "Uncategorized"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            {/* Main Image */}
            <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
              <div className="h-96 bg-gray-100">
                <img
                  src={getImageUrl(product.images, currentImage)}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex w-20 h-20 border ${currentImage === index ? "border-black" : "border-gray-300"} rounded overflow-hidden`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-black mb-4">
              {product.title}
            </h1>

            {/* Category and Brand */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                {product.category?.name || "Uncategorized"}
              </span>
              {product.brand && (
                <span className="text-sm text-gray-600">
                  Brand: {product.brand}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center mb-6">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(product.ratings?.average || 0)
                        ? "text-black"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-8">
              {product.discountPrice &&
              product.discountPrice < product.price ? (
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-black">
                    ${formatPrice(product.discountPrice)}
                  </span>
                  <span className="ml-3 text-xl text-gray-500 line-through">
                    ${formatPrice(product.price)}
                  </span>
                  <span className="ml-3 text-sm bg-black text-white px-2 py-1 rounded">
                    Save{" "}
                    {Math.round(
                      (1 - product.discountPrice / product.price) * 100,
                    )}
                    %
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-black">
                  ${formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-black mb-3">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mb-8">
              <div
                className={`inline-block px-4 py-2 rounded ${product.stock > 0 ? "border border-gray-300" : "border border-gray-300 bg-gray-100"}`}
              >
                {product.stock > 0
                  ? `${product.stock} items in stock`
                  : "Out of stock"}
              </div>
              {product.stock > 0 && product.stock < 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  Only {product.stock} left in stock!
                </p>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            {product.stock > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center disabled:opacity-50"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="w-16 text-center text-lg">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 flex items-center justify-center disabled:opacity-50"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={addToCart}
                    className="flex-1 bg-black hover:bg-gray-800 text-white py-3 px-6 rounded font-medium flex items-center justify-center"
                  >
                    <FiShoppingBag className="w-5 h-5 mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-300 pt-8">
              <h2 className="text-xl font-bold text-black mb-4">
                Product Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FiTruck className="w-5 h-5 text-black mr-3" />
                  <span className="text-gray-600">
                    Free shipping on orders over $50
                  </span>
                </div>
                <div className="flex items-center">
                  <FiShield className="w-5 h-5 text-black mr-3" />
                  <span className="text-gray-600">100% secure payment</span>
                </div>
                <div className="flex items-center">
                  <FiRefreshCw className="w-5 h-5 text-black mr-3" />
                  <span className="text-gray-600">30-day return policy</span>
                </div>
                <div className="flex items-center">
                  <FaStore className="w-5 h-5 text-black mr-3" />
                  <span className="text-gray-600">Verified seller</span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-8">
              <Link
                to="/customer/dashboard"
                className="inline-flex items-center text-black hover:text-gray-700"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
