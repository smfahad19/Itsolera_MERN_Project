import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiGrid,
  FiList,
} from "react-icons/fi";

const SellerProducts = () => {
  const { token } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/seller/products",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setProducts(response.data.data || []);
      } catch (error) {
        toast.error("Failed to load products");
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setDeleting(productId);
    try {
      await axios.delete(
        `http://localhost:5000/api/seller/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
      console.log(error);
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch =
      search === "" ||
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());

    // Status filter
    if (filter === "all") return matchesSearch;
    if (filter === "active") return matchesSearch && product.isActive;
    if (filter === "inactive") return matchesSearch && !product.isActive;
    if (filter === "low-stock")
      return matchesSearch && product.stock < 10 && product.stock > 0;
    if (filter === "out-of-stock") return matchesSearch && product.stock === 0;

    return matchesSearch;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Format price function
  const formatPrice = (price) => {
    if (!price) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Get image URL from images array
  const getImageUrl = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }

    // Images array में object होते हैं { public_id, url }
    return images[0].url || null;
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">My Products</h1>
              <p className="text-gray-600 mt-2">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                listed
              </p>
            </div>

            <Link
              to="/seller/products/add"
              className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : ""}`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-100" : ""}`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">All Products</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products */}
        {filteredProducts.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const imageUrl = getImageUrl(product.images);
                return (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative">
                      <div className="h-48 bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiPackage className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-2 left-2">
                        {!product.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${getStockStatus(
                            product.stock,
                          )}`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-black line-clamp-1">
                          {product.title}
                        </h3>
                        <div className="text-right">
                          <span className="text-lg font-bold text-black">
                            {formatPrice(
                              product.discountPrice || product.price,
                            )}
                          </span>
                          {product.discountPrice &&
                            product.discountPrice < product.price && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(product.price)}
                              </div>
                            )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Category */}
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/seller/products/edit/${product._id}`}
                          className="flex-1 flex items-center justify-center space-x-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </Link>

                        <button
                          onClick={() => deleteProduct(product._id)}
                          disabled={deleting === product._id}
                          className="flex-1 flex items-center justify-center space-x-1 border border-red-300 text-red-600 py-2 rounded hover:bg-red-50"
                        >
                          {deleting === product._id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <FiTrash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </>
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
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const imageUrl = getImageUrl(product.images);
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 mr-3 overflow-hidden">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FiPackage className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-black">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {product.category?.name || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-black">
                              {formatPrice(
                                product.discountPrice || product.price,
                              )}
                            </div>
                            {product.discountPrice &&
                              product.discountPrice < product.price && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(product.price)}
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded ${getStockStatus(
                                product.stock,
                              )}`}
                            >
                              {product.stock} units
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                product.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Link
                                to={`/products/${product._id}`}
                                target="_blank"
                                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded"
                                title="View"
                              >
                                <FiEye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/seller/products/edit/${product._id}`}
                                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                disabled={deleting === product._id}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                {deleting === product._id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiTrash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">
              {search ? "No matching products found" : "No products yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {search
                ? "Try a different search term"
                : "Start by adding your first product"}
            </p>
            <Link
              to="/seller/products/add"
              className="inline-flex items-center space-x-2 bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Your First Product</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
