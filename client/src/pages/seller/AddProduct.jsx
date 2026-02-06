import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUpload, FiX, FiPlus, FiMinus, FiPlusCircle } from "react-icons/fi";

const AddProduct = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    category: "",
    brand: "",
    isFeatured: false,
    isActive: true,
  });

  // API base URL
  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/seller/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/seller/categories`,
        newCategory,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Category created successfully");
        setCategories((prev) => [...prev, response.data.data]);
        setFormData((prev) => ({
          ...prev,
          category: response.data.data._id,
        }));
        setShowCategoryModal(false);
        setNewCategory({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast.error(error.response?.data?.message || "Failed to create category");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Validate file size and type
    const validFiles = files.filter((file) => {
      const isValidType = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      return true;
    });

    // Check total images limit
    if (selectedImages.length + validFiles.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecification = (index) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };

  const updateSpecification = (index, field, value) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.stock ||
      !formData.category
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (selectedImages.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    setLoading(true);

    try {
      // Prepare form data
      const data = new FormData();

      // Add product data
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("discountPrice", formData.discountPrice || "");
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("brand", formData.brand || "");
      data.append(
        "specifications",
        JSON.stringify(
          specifications.reduce((acc, spec) => {
            if (spec.key && spec.value) {
              acc[spec.key] = spec.value;
            }
            return acc;
          }, {}),
        ),
      );
      data.append("tags", JSON.stringify(tags));
      data.append("isFeatured", formData.isFeatured);
      data.append("isActive", formData.isActive);

      // Add images
      selectedImages.forEach((image) => {
        data.append("images", image);
      });

      // Send request
      await axios.post(`${API_BASE}/seller/products`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product added successfully");
      navigate("/seller/products");
    } catch (error) {
      console.error("Add product error:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 text-sm">
            Fill in the details to list your product
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  placeholder="Enter product title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  placeholder="Describe your product in detail"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Discount Price ($)
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Category & Brand
            </h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm text-gray-700">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <FiPlusCircle className="w-3 h-3 mr-1" />
                    Add New Category
                  </button>
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 border rounded text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Product Images *
            </h2>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-2">
                    Drag & drop images or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Supports JPG, PNG, WebP (Max 5MB each, up to 5 images)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-black text-white px-4 py-1.5 rounded hover:bg-gray-800 text-sm cursor-pointer"
                  >
                    Browse Files
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    Selected Images ({selectedImages.length}/5)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specifications Section */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Specifications
            </h2>

            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) =>
                      updateSpecification(index, "key", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 border rounded text-sm"
                    placeholder="Key (e.g., Color)"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecification(index, "value", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 border rounded text-sm"
                    placeholder="Value (e.g., Black)"
                  />
                  {specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="w-8 h-8 border border-red-300 text-red-600 rounded flex items-center justify-center hover:bg-red-50"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addSpecification}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <FiPlus className="w-3 h-3" />
                <span>Add Specification</span>
              </button>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tags</h2>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-3 py-1.5 border rounded text-sm"
                  placeholder="Enter tags and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 text-sm"
                >
                  Add Tag
                </button>
              </div>

              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white border rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black rounded"
                />
                <span className="text-sm text-gray-700">
                  Mark as Featured Product
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black rounded"
                />
                <span className="text-sm text-gray-700">
                  Publish Product Immediately
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/seller/products")}
              className="px-4 py-1.5 border rounded text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-1.5 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>

        {/* Category Creation Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded p-4 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Create New Category
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full px-3 py-1.5 border rounded text-sm"
                    placeholder="Category description"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="px-4 py-1.5 border rounded text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-black text-white rounded hover:bg-gray-800 text-sm"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProduct;
