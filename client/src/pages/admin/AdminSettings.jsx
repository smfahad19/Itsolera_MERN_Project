import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiRefreshCw,
  FiArrowLeft,
  FiUsers,
  FiPackage,
  FiTag,
  FiGrid,
  FiTrash2,
  FiEdit,
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiDollarSign,
  FiShoppingCart,
  FiBox,
  FiStar,
  FiCalendar,
  FiClock,
} from "react-icons/fi";

const AdminSettings = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentCategory: "",
  });

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productFilters, setProductFilters] = useState({
    search: "",
    category: "",
    isActive: "",
  });

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({
    role: "",
    search: "",
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [token, navigate, activeTab]);

  // ==================== CATEGORIES ====================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Fetch Categories Error:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/categories`,
        newCategory,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Category added successfully");
        setNewCategory({ name: "", description: "", parentCategory: "" });
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    }
  };

  const handleEditCategory = async (categoryId, updatedData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/categories/${categoryId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Category updated successfully");
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This will also delete all subcategories and products.",
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/categories/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  };

  const handleToggleCategoryStatus = async (categoryId, currentStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/categories/${categoryId}/status`,
        { isActive: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(
          `Category ${!currentStatus ? "activated" : "deactivated"}`,
        );
        fetchCategories();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update category status",
      );
    }
  };

  // ==================== PRODUCTS ====================
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: productFilters,
      });

      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Fetch Products Error:", error);
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductStatusChange = async (productId, currentStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/products/${productId}/status`,
        { isActive: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(
          `Product ${!currentStatus ? "activated" : "deactivated"}`,
        );
        fetchProducts();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update product status",
      );
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: userFilters,
      });

      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success(`User role changed to ${newRole}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user role",
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  // ==================== PRODUCT VIEWING ====================
  const handleViewProduct = async (productId) => {
    try {
      setSelectedProduct(productId);
      setProductDetailsLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setProductDetails(response.data.product);
        setShowProductModal(true);
      }
    } catch (error) {
      console.error("Fetch Product Details Error:", error);
      toast.error("Failed to load product details");
    } finally {
      setProductDetailsLoading(false);
    }
  };

  const handleEditProduct = (productId) => {
    navigate(`/admin/products/edit/${productId}`);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setProductDetails(null);
  };

  const tabs = [
    {
      id: "categories",
      name: "Categories",
      icon: <FiTag className="w-4 h-4" />,
    },
    {
      id: "products",
      name: "Products",
      icon: <FiPackage className="w-4 h-4" />,
    },
    {
      id: "users",
      name: "Users",
      icon: <FiUsers className="w-4 h-4" />,
    },
  ];

  if (loading && activeTab === "categories") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">
                  Manage Categories, Products, and Users
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Add Category Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Category
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category
                  </label>
                  <select
                    value={newCategory.parentCategory}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        parentCategory: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Select parent category (optional)</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Category
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Categories ({categories.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <tr key={category._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingCategory?._id === category._id ? (
                              <input
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              />
                            ) : (
                              <div className="font-medium text-gray-900">
                                {category.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingCategory?._id === category._id ? (
                              <input
                                type="text"
                                value={editingCategory.description}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">
                                {category.description || "No description"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingCategory?._id === category._id ? (
                              <select
                                value={editingCategory.parentCategory || ""}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    parentCategory: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              >
                                <option value="">None</option>
                                {categories
                                  .filter((c) => c._id !== category._id)
                                  .map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                      {cat.name}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {category.parentCategory
                                  ? categories.find(
                                      (c) => c._id === category.parentCategory,
                                    )?.name || "N/A"
                                  : "None"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {editingCategory?._id === category._id ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleEditCategory(
                                        category._id,
                                        editingCategory,
                                      )
                                    }
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Save"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCategory(null)}
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Cancel"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingCategory(category)}
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                    title="Edit"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleCategoryStatus(
                                        category._id,
                                        category.isActive,
                                      )
                                    }
                                    className={`p-1 ${
                                      category.isActive
                                        ? "text-yellow-600 hover:text-yellow-900"
                                        : "text-green-600 hover:text-green-900"
                                    }`}
                                    title={
                                      category.isActive
                                        ? "Deactivate"
                                        : "Activate"
                                    }
                                  >
                                    {category.isActive ? (
                                      <FiAlertCircle className="w-4 h-4" />
                                    ) : (
                                      <FiCheck className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteCategory(category._id)
                                    }
                                    className="text-red-600 hover:text-red-900 p-1"
                                    title="Delete"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <FiGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No categories found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Products Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Products Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Products
                  </label>
                  <input
                    type="text"
                    value={productFilters.search}
                    onChange={(e) => {
                      setProductFilters({
                        ...productFilters,
                        search: e.target.value,
                      });
                      fetchProducts();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Search by product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={productFilters.category}
                    onChange={(e) => {
                      setProductFilters({
                        ...productFilters,
                        category: e.target.value,
                      });
                      fetchProducts();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={productFilters.isActive}
                    onChange={(e) => {
                      setProductFilters({
                        ...productFilters,
                        isActive: e.target.value,
                      });
                      fetchProducts();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Products ({products.length})
                </h2>
                <button
                  onClick={fetchProducts}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
              {productsLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.length > 0 ? (
                        products.map((product) => (
                          <tr key={product._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {product.images?.[0]?.url ? (
                                  <img
                                    src={product.images[0].url}
                                    alt={product.title}
                                    className="h-10 w-10 rounded object-cover mr-3"
                                    onClick={() =>
                                      handleViewProduct(product._id)
                                    }
                                    style={{ cursor: "pointer" }}
                                  />
                                ) : (
                                  <div
                                    className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center mr-3"
                                    onClick={() =>
                                      handleViewProduct(product._id)
                                    }
                                    style={{ cursor: "pointer" }}
                                  >
                                    <FiPackage className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div
                                    className="font-medium text-gray-900 truncate max-w-xs hover:text-blue-600 cursor-pointer"
                                    onClick={() =>
                                      handleViewProduct(product._id)
                                    }
                                  >
                                    {product.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {product.brand || "No brand"}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    ID: {product._id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {product.category?.name || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ${product.price?.toFixed(2)}
                              </div>
                              {product.discountPrice && (
                                <div className="text-xs text-gray-500 line-through">
                                  ${product.discountPrice.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm font-medium ${
                                  product.stock <= 0
                                    ? "text-red-600"
                                    : product.stock < 10
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              >
                                {product.stock}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewProduct(product._id)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditProduct(product._id)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Edit"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleProductStatusChange(
                                      product._id,
                                      product.isActive,
                                    )
                                  }
                                  className={`p-1 ${
                                    product.isActive
                                      ? "text-yellow-600 hover:text-yellow-900"
                                      : "text-green-600 hover:text-green-900"
                                  }`}
                                  title={
                                    product.isActive ? "Deactivate" : "Activate"
                                  }
                                >
                                  {product.isActive ? (
                                    <FiAlertCircle className="w-4 h-4" />
                                  ) : (
                                    <FiCheck className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(product._id)
                                  }
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No products found</p>
                              <button
                                onClick={() => navigate("/admin/products/add")}
                                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                              >
                                Add New Product
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Users Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Users Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <input
                    type="text"
                    value={userFilters.search}
                    onChange={(e) => {
                      setUserFilters({
                        ...userFilters,
                        search: e.target.value,
                      });
                      fetchUsers();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Search by name or email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={userFilters.role}
                    onChange={(e) => {
                      setUserFilters({ ...userFilters, role: e.target.value });
                      fetchUsers();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="seller">Sellers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Users ({users.length})
                </h2>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
              {usersLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  {user.businessName && (
                                    <div className="text-sm text-gray-500">
                                      {user.businessName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : user.role === "seller"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.role === "seller" ? (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.approvalStatus === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : user.approvalStatus === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {user.approvalStatus}
                                </span>
                              ) : user.role === "customer" ? (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.verificationStatus === "verified"
                                      ? "bg-green-100 text-green-800"
                                      : user.verificationStatus === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {user.verificationStatus || "unverified"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    navigate(`/admin/users/${user._id}`)
                                  }
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <select
                                  value={user.role}
                                  onChange={(e) =>
                                    handleUserRoleChange(
                                      user._id,
                                      e.target.value,
                                    )
                                  }
                                  className="text-xs border rounded px-2 py-1"
                                  title="Change Role"
                                >
                                  <option value="customer">Customer</option>
                                  <option value="seller">Seller</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No users found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Product Details
                </h3>
                <button
                  onClick={closeProductModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {productDetailsLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Loading product details...
                  </p>
                </div>
              ) : productDetails ? (
                <div className="space-y-6">
                  {/* Product Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {productDetails.title}
                      </h4>
                      <p className="text-gray-600">
                        {productDetails.brand || "No brand"}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            productDetails.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {productDetails.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-sm text-gray-500">
                          ID: {productDetails._id}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${productDetails.price?.toFixed(2)}
                      </div>
                      {productDetails.discountPrice && (
                        <div className="text-lg text-gray-500 line-through">
                          ${productDetails.discountPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Images */}
                  {productDetails.images &&
                    productDetails.images.length > 0 && (
                      <div>
                        <h5 className="text-lg font-semibold mb-3">Images</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {productDetails.images.map((image, index) => (
                            <div
                              key={index}
                              className="border rounded-lg overflow-hidden"
                            >
                              <img
                                src={image.url}
                                alt={`${productDetails.title} - ${index + 1}`}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-lg font-semibold mb-2">
                          Description
                        </h5>
                        <p className="text-gray-700">
                          {productDetails.description || "No description"}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-lg font-semibold mb-2">Category</h5>
                        <div className="flex items-center">
                          <FiTag className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{productDetails.category?.name || "N/A"}</span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-lg font-semibold mb-2">
                          Stock Information
                        </h5>
                        <div className="flex items-center">
                          <FiBox className="w-4 h-4 mr-2 text-gray-500" />
                          <span
                            className={`font-medium ${
                              productDetails.stock <= 0
                                ? "text-red-600"
                                : productDetails.stock < 10
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {productDetails.stock} units available
                          </span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-lg font-semibold mb-2">
                          Specifications
                        </h5>
                        <div className="space-y-2">
                          {productDetails.specifications &&
                            Object.entries(productDetails.specifications).map(
                              ([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">
                                    {key}:
                                  </span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ),
                            )}
                          {(!productDetails.specifications ||
                            Object.keys(productDetails.specifications)
                              .length === 0) && (
                            <p className="text-gray-500">No specifications</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-lg font-semibold mb-2">
                          Additional Information
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <FiDollarSign className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              Price:{" "}
                              <strong>
                                ${productDetails.price?.toFixed(2)}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FiShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              Minimum Order:{" "}
                              <strong>
                                {productDetails.minimumOrder || 1} units
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FiStar className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              Rating:{" "}
                              <strong>{productDetails.rating || "N/A"}</strong>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              Created:{" "}
                              <strong>
                                {new Date(
                                  productDetails.createdAt,
                                ).toLocaleDateString()}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FiClock className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              Last Updated:{" "}
                              <strong>
                                {new Date(
                                  productDetails.updatedAt,
                                ).toLocaleDateString()}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-lg font-semibold mb-2">Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {productDetails.tags &&
                          productDetails.tags.length > 0 ? (
                            productDetails.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500">No tags</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-lg font-semibold mb-2">
                          Seller Information
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-gray-600">Seller:</span>
                            <span className="ml-2 font-medium">
                              {productDetails.seller?.name ||
                                productDetails.seller?.businessName ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2">
                              {productDetails.seller?.email || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      onClick={closeProductModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleEditProduct(productDetails._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FiEdit className="w-4 h-4 inline mr-2" />
                      Edit Product
                    </button>
                    <button
                      onClick={() => {
                        closeProductModal();
                        handleProductStatusChange(
                          productDetails._id,
                          productDetails.isActive,
                        );
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        productDetails.isActive
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                    >
                      {productDetails.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Product details not found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
