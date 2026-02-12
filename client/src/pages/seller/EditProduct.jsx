import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUpload, FiX, FiPlus, FiMinus, FiArrowLeft } from "react-icons/fi";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useSelector((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // ✅ ADD THIS

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagesToKeep, setImagesToKeep] = useState([]);

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

  const API_BASE = `${API_BASE_URL}/api`;
  const SELLER_API = `${API_BASE}/seller`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          axios.get(`${SELLER_API}/products/${id}`, {
            // ✅ FIXED
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${SELLER_API}/categories`, {
            // ✅ FIXED
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const product = productRes.data.data;
        console.log("Product data:", product);

        let specs = [];
        if (
          product.specifications &&
          typeof product.specifications === "object"
        ) {
          specs = Object.entries(product.specifications).map(
            ([key, value]) => ({
              key,
              value: String(value),
            }),
          );
        }

        setFormData({
          title: product.title || "",
          description: product.description || "",
          price: product.price || "",
          discountPrice: product.discountPrice || "",
          stock: product.stock || "",
          category: product.category?._id || product.category || "",
          brand: product.brand || "",
          isFeatured: product.isFeatured || false,
          isActive: product.isActive ?? true,
        });

        // Initialize images to keep with all existing images
        setImagesToKeep(product.images || []);

        setSpecifications(specs.length > 0 ? specs : [{ key: "", value: "" }]);
        setTags(product.tags || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load product data");
        navigate("/seller/products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      return true;
    });

    const imageFiles = validFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length !== validFiles.length) {
      toast.error("Only image files are allowed");
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageIndex) => {
    const updatedImages = imagesToKeep.filter(
      (_, index) => index !== imageIndex,
    );
    setImagesToKeep(updatedImages);
    toast.success("Image marked for removal");
  };

  const previewSelectedFiles = () => {
    return selectedFiles.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return (
        <div key={index} className="relative">
          <img
            src={objectUrl}
            alt={`Preview ${index + 1}`}
            className="w-full h-32 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => removeSelectedFile(index)}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      );
    });
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

  const handleTagKeyPress = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
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
    setSaving(true);

    try {
      const specificationsObj = {};
      specifications.forEach((spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsObj[spec.key.trim()] = spec.value.trim();
        }
      });

      const productData = new FormData();
      productData.append("title", formData.title);
      productData.append("description", formData.description);
      productData.append("price", formData.price);
      productData.append("discountPrice", formData.discountPrice || "");
      productData.append("stock", formData.stock);
      productData.append("category", formData.category);
      productData.append("brand", formData.brand);
      productData.append("specifications", JSON.stringify(specificationsObj));
      productData.append("tags", JSON.stringify(tags));
      productData.append("isFeatured", formData.isFeatured);
      productData.append("isActive", formData.isActive);

      productData.append("keepImages", JSON.stringify(imagesToKeep));

      selectedFiles.forEach((file) => {
        productData.append("images", file);
      });

      console.log("Sending update request...");
      console.log("Images to keep:", imagesToKeep.length);
      console.log("New images:", selectedFiles.length);

      const response = await axios.put(
        `${SELLER_API}/products/${id}`, // ✅ FIXED
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Update response:", response.data);

      toast.success("Product updated successfully");
      navigate("/seller/products");
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/seller/products")}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-black">Edit Product</h1>
              <p className="text-gray-600 mt-2">Update product details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">
              Basic Information
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter product title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Describe your product in detail"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price ($)
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">
              Category & Brand
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">
              Product Images
            </h2>

            <div className="space-y-6">
              {/* Existing Images */}
              {imagesToKeep.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Current Images ({imagesToKeep.length})
                    <span className="text-xs text-gray-500 ml-2">
                      (Click X to remove)
                    </span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagesToKeep.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url || image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
                  <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag & drop or click to select images
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports JPG, PNG up to 5MB each. Max 5 images.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 cursor-pointer"
                  >
                    Select Images
                  </label>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      New Images to Upload ({selectedFiles.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {previewSelectedFiles()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">
              Specifications
            </h2>

            <div className="space-y-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) =>
                      updateSpecification(index, "key", e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Key (e.g., Color)"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecification(index, "value", e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Value (e.g., Black)"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    disabled={specifications.length === 1}
                    className="w-10 h-10 border border-red-300 text-red-600 rounded flex items-center justify-center hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSpecification}
                className="flex items-center space-x-2 text-black hover:underline"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Specification</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">Tags</h2>

            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter tags and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-xl font-bold text-black mb-6">Settings</h2>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black rounded focus:ring-black"
                />
                <span className="text-gray-700">Mark as Featured Product</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-black rounded focus:ring-black"
                />
                <span className="text-gray-700">Product is Active</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/seller/products")}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Update Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
