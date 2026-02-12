import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiShoppingBag,
  FiStar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Products = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [inStock, setInStock] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  const getImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=300&q=80";
    }
    return images[0].url;
  };

  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    fetchProducts();
  }, [
    selectedCategory,
    sortBy,
    currentPage,
    minPrice,
    maxPrice,
    selectedBrands,
    inStock,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: 12,
        sortBy: sortBy,
      };

      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (minPrice) {
        params.minPrice = minPrice;
      }

      if (maxPrice) {
        params.maxPrice = maxPrice;
      }

      if (selectedBrands.length > 0) {
        params.brands = selectedBrands.join(",");
      }

      if (inStock) {
        params.inStock = "true";
      }

      console.log("📡 API Params:", params);

      const response = await axios.get(
        `${API_BASE_URL}/api/customer/products`, // ✅ FIXED
        { params },
      );

      setProducts(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setBrands(response.data.filters?.brands || []);

      if (response.data.data && response.data.data.length > 0) {
        const categoryMap = new Map();

        response.data.data.forEach((product) => {
          if (product.category && product.category._id) {
            if (!categoryMap.has(product.category._id)) {
              categoryMap.set(product.category._id, {
                _id: product.category._id,
                name: product.category.name,
              });
            }
          }
        });

        const extractedCategories = Array.from(categoryMap.values());
        setCategories(extractedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
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

      const product = products.find((p) => p._id === productId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      if (product.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      console.log("Adding to cart:", { productId, quantity, token });

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

      console.log("Cart response:", response.data);

      if (response.data.success) {
        toast.success(`Added ${quantity} item(s) to cart successfully!`);
      } else {
        toast.error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error(" Add to cart error:", error);
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

  const handleBrandToggle = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setSelectedBrands([]);
    setInStock(false);
    setCurrentPage(1);
  };

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
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                All Products
              </h1>
              <p className="text-gray-600">
                Browse our wide selection of products
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {user && (
                <span className="text-gray-600">
                  Welcome, {user.name || user.email}
                </span>
              )}
              <span className="text-gray-600">
                Showing {products.length} products
              </span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 ${viewMode === "grid" ? "bg-black text-white" : "bg-white text-gray-700"}`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 ${viewMode === "list" ? "bg-black text-white" : "bg-white text-gray-700"}`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-black">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              {/* Categories - Only show if categories exist */}
              {categories.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-black mb-4">
                    Categories ({categories.length})
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full text-left px-3 py-2 rounded ${selectedCategory === "all" ? "bg-black text-white" : "hover:bg-gray-100"}`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category._id)}
                        className={`w-full text-left px-3 py-2 rounded ${selectedCategory === category._id ? "bg-black text-white" : "hover:bg-gray-100"}`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-bold text-black mb-4">Price Range</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Min ($)
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Max ($)
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Brands - Only show if brands exist */}
              {brands.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-black mb-4">Brands</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <span className="text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-8">
                <h3 className="font-bold text-black mb-4">Stock Status</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <span className="text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Sort Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <FiFilter className="w-4 h-4 text-gray-500" />
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
              <div className="mt-4 md:mt-0">
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>

            {/* Active Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">
                  Category:{" "}
                  {categories.find((c) => c._id === selectedCategory)?.name ||
                    "Selected"}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedBrands.length > 0 && (
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">
                  Brands: {selectedBrands.length} selected
                  <button
                    onClick={() => setSelectedBrands([])}
                    className="ml-2 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              )}
              {(minPrice || maxPrice) && (
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">
                  Price: ${minPrice || 0} - ${maxPrice || "∞"}
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="ml-2 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              )}
              {inStock && (
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center">
                  In Stock Only
                  <button
                    onClick={() => setInStock(false)}
                    className="ml-2 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const imageUrl = getImageUrl(product.images);
                  return (
                    <div
                      key={product._id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {/* Product Image */}
                      <div className="relative h-56 bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {product.stock <= 0 && (
                          <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                            OUT OF STOCK
                          </div>
                        )}
                        {product.discountPrice &&
                          product.discountPrice < product.price && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              SAVE{" "}
                              {Math.round(
                                (1 - product.discountPrice / product.price) *
                                  100,
                              )}
                              %
                            </div>
                          )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.category?.name || "Uncategorized"}
                          </span>
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
                                  star <=
                                  Math.round(product.ratings?.average || 0)
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

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            {product.discountPrice &&
                            product.discountPrice < product.price ? (
                              <div className="flex items-baseline">
                                <span className="text-2xl font-bold text-gray-900">
                                  ${formatPrice(product.discountPrice)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ${formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-2xl font-bold text-gray-900">
                                ${formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Link
                            to={`/products/${product._id}`}
                            className="flex-1 py-2 text-center border border-gray-300 text-black hover:bg-gray-50 rounded"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => addToCart(product._id)}
                            disabled={
                              product.stock <= 0 || addingToCart === product._id
                            }
                            className={`flex-1 py-2 rounded flex items-center justify-center ${
                              product.stock <= 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}
                          >
                            {addingToCart === product._id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Add to Cart"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-6">
                {products.map((product) => {
                  const imageUrl = getImageUrl(product.images);
                  return (
                    <div
                      key={product._id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Product Image */}
                        <div className="md:w-1/4 relative">
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                          {product.stock <= 0 && (
                            <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                              OUT OF STOCK
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="md:w-3/4 p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {product.category?.name || "Uncategorized"}
                                </span>
                                {product.brand && (
                                  <span className="ml-2 text-xs text-gray-600">
                                    • {product.brand}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {product.title}
                              </h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {product.description}
                              </p>

                              {/* Rating */}
                              <div className="flex items-center mb-4">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <=
                                        Math.round(
                                          product.ratings?.average || 0,
                                        )
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 ml-2">
                                  ({product.ratings?.count || 0} reviews)
                                </span>
                              </div>

                              {/* Stock Info */}
                              {product.stock > 0 && product.stock < 10 && (
                                <div className="text-sm text-orange-600 mb-2">
                                  Only {product.stock} left in stock!
                                </div>
                              )}
                            </div>

                            <div className="mt-4 md:mt-0 md:ml-6">
                              {/* Price */}
                              <div className="mb-4">
                                {product.discountPrice &&
                                product.discountPrice < product.price ? (
                                  <div className="text-right">
                                    <span className="text-2xl font-bold text-gray-900">
                                      ${formatPrice(product.discountPrice)}
                                    </span>
                                    <div className="text-sm text-gray-500 line-through">
                                      ${formatPrice(product.price)}
                                    </div>
                                    <div className="text-xs text-red-500 font-bold">
                                      Save{" "}
                                      {Math.round(
                                        (1 -
                                          product.discountPrice /
                                            product.price) *
                                          100,
                                      )}
                                      %
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-2xl font-bold text-gray-900">
                                    ${formatPrice(product.price)}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2">
                                <Link
                                  to={`/products/${product._id}`}
                                  className="px-4 py-2 border border-gray-300 text-black hover:bg-gray-50 rounded"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => addToCart(product._id)}
                                  disabled={
                                    product.stock <= 0 ||
                                    addingToCart === product._id
                                  }
                                  className={`px-4 py-2 rounded flex items-center justify-center ${
                                    product.stock <= 0
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-black text-white hover:bg-gray-800"
                                  }`}
                                >
                                  {addingToCart === product._id ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <>
                                      <FiShoppingBag className="w-4 h-4 mr-1" />
                                      Add
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${currentPage === 1 ? "text-gray-400" : "hover:bg-gray-100"}`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded ${currentPage === pageNum ? "bg-black text-white" : "hover:bg-gray-100"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded ${currentPage === totalPages ? "text-gray-400" : "hover:bg-gray-100"}`}
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* No Products */}
            {products.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  No products found
                </h3>
                <p className="text-gray-600 mb-8">
                  Try changing your filters or search criteria
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
