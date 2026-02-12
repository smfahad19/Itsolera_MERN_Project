import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiShoppingBag,
  FiEye,
  FiStar,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiTag,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import toast from "react-hot-toast";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [addingToCart, setAddingToCart] = useState(null);

  // Get image URL helper
  const getImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=300&q=80";
    }
    return images[0].url;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const params = {
        limit: 12,
        sortBy: sortBy,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/customer/products`, // ✅ FIXED
        { params },
      );
      setProducts(response.data.data || []);
    } catch (error) {
      console.log("Error loading products:", error.message);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories`); // ✅ FIXED
      setCategories(response.data.categories || []);
    } catch (error) {
      console.log("Error loading categories:", error.message);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      setAddingToCart(productId);

      if (!token) {
        toast.error("Please login to add items to cart");
        navigate("/login");
        return;
      }

      // Find the product
      const product = products.find((p) => p._id === productId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      if (product.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      console.log("🛒 Adding to cart:", { productId, quantity, token });

      const response = await axios.post(
        `${API_BASE_URL}/api/customer/cart/${productId}`, // ✅ FIXED
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Cart response:", response.data);

      if (response.data.success) {
        toast.success(`Added ${quantity} item(s) to cart successfully!`);
      } else {
        toast.error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("❌ Add to cart error:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Product out of stock");
      } else if (error.response?.status === 404) {
        toast.error("Cart API not found. Please check backend routes.");
      } else {
        toast.error(error.response?.data?.message || "Failed to add to cart");
      }
    } finally {
      setAddingToCart(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Amazing Products
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Shop from thousands of quality products with fast delivery and
              best prices
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-black">Free Shipping</h3>
                <p className="text-sm text-gray-600">On orders over $50</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiRefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-black">30-Day Returns</h3>
                <p className="text-sm text-gray-600">Easy return policy</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-black">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% secure</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaStore className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-black">Verified Sellers</h3>
                <p className="text-sm text-gray-600">Trusted quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Shop by Category</h2>
            <Link
              to="/categories"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all <FiChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full ${selectedCategory === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              All Products
            </button>

            {categories.slice(0, 5).map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-4 py-2 rounded-full ${selectedCategory === category._id ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort and Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-black mb-4 md:mb-0">
            Featured Products
            <span className="text-gray-500 text-sm font-normal ml-2">
              ({filteredProducts.length} products)
            </span>
          </h3>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const imageUrl = getImageUrl(product.images);
            return (
              <div
                key={product._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-gray-100 group">
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {product.discountPrice &&
                      product.price > product.discountPrice && (
                        <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          SAVE $
                          {(product.price - product.discountPrice).toFixed(2)}
                        </div>
                      )}
                    {product.isFeatured && (
                      <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        FEATURED
                      </div>
                    )}
                  </div>

                  {product.stock <= 0 && (
                    <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                      OUT OF STOCK
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/products/${product._id}`}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                      title="Quick View"
                    >
                      <FiEye className="w-5 h-5 text-gray-700" />
                    </Link>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {product.category?.name || "Uncategorized"}
                    </span>
                    {product.brand && (
                      <span className="text-xs text-gray-600 font-medium">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                    {product.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(product.ratings?.average || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      ({product.ratings?.count || 0})
                    </span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      {product.discountPrice &&
                      product.price > product.discountPrice ? (
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-gray-900">
                            ${formatPrice(product.discountPrice)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${formatPrice(product.price)}
                          </span>
                          <span className="ml-2 text-xs text-red-500 font-bold">
                            {Math.round(
                              (1 - product.discountPrice / product.price) * 100,
                            )}
                            % OFF
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          ${formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product._id)}
                      disabled={
                        product.stock <= 0 || addingToCart === product._id
                      }
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        product.stock <= 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : addingToCart === product._id
                            ? "bg-gray-600 text-white"
                            : "bg-black text-white hover:bg-gray-800"
                      } transition-colors`}
                      title={
                        product.stock <= 0
                          ? "Out of Stock"
                          : addingToCart === product._id
                            ? "Adding..."
                            : "Add to Cart"
                      }
                    >
                      {addingToCart === product._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <FiShoppingBag className="w-4 h-4" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stock Info */}
                  {product.stock > 0 && product.stock < 10 && (
                    <div className="mt-3 text-xs text-orange-600">
                      Only {product.stock} left in stock!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">
              No products found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {search
                ? `No products matching "${search}"`
                : "No products available in this category"}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
              >
                View All Products
              </button>
              <Link
                to="/categories"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        )}

        {/* View All Products CTA */}
        {filteredProducts.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-flex items-center text-lg text-black font-semibold hover:text-blue-600"
            >
              View All Products
              <FiChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-6">
              Why Shop With Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaStore className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
                <p className="text-gray-600">
                  Thousands of products from trusted sellers
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  30-day money back guarantee on all products
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTruck className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Free shipping on orders over $50
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
