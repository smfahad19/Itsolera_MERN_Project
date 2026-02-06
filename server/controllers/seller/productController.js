import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import cloudinary from "../../config/cloudinary.js";

// Category management functions for seller
export const createCategoryBySeller = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { name, description } = req.body;

    // Check if seller is approved
    const seller = req.user;
    if (!seller.isApproved || seller.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Create category with current timestamp
    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getSellerCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name description image")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "marketplace/products",
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { format: "webp" },
      ],
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

export const createProduct = async (req, res) => {
  let uploadedImages = [];

  try {
    const sellerId = req.user._id;

    const seller = req.user;
    if (!seller.isApproved || seller.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved",
      });
    }

    const {
      title,
      description,
      price,
      discountPrice,
      stock,
      category,
      brand,
      specifications,
      tags,
      isFeatured,
      isActive,
    } = req.body;

    const parsedSpecifications = specifications
      ? JSON.parse(specifications)
      : {};
    const parsedTags = tags ? JSON.parse(tags) : [];

    if (!title || !description || !price || !stock || !category) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const uploadedImage = await uploadToCloudinary(file);
          uploadedImages.push(uploadedImage);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload images to Cloudinary",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    const product = new Product({
      title,
      description,
      price,
      discountPrice: discountPrice || null,
      stock,
      category,
      brand: brand || "",
      images: uploadedImages,
      sellerId,
      specifications: parsedSpecifications,
      tags: parsedTags,
      isFeatured: isFeatured === "true",
      isActive: isActive !== undefined ? isActive === "true" : true,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    if (uploadedImages && uploadedImages.length > 0) {
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cleanupError) {
          console.error("Failed to cleanup image:", cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await Product.findOne({
      _id: id,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission",
      });
    }

    const {
      title,
      description,
      price,
      discountPrice,
      stock,
      category,
      brand,
      specifications,
      tags,
      isFeatured,
      isActive,
      keepImages = "[]", // New field for images to keep
    } = req.body;

    // Update fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (discountPrice !== undefined)
      product.discountPrice = discountPrice || null;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand;

    if (specifications) {
      const parsedSpecifications =
        typeof specifications === "string"
          ? JSON.parse(specifications)
          : specifications;
      product.specifications = parsedSpecifications;
    }

    if (tags) {
      const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      product.tags = parsedTags;
    }

    if (isFeatured !== undefined) product.isFeatured = isFeatured === "true";
    if (isActive !== undefined) product.isActive = isActive === "true";

    // Handle images
    let finalImages = [];

    // Parse keepImages if provided
    if (keepImages) {
      const imagesToKeep = JSON.parse(keepImages);
      // Keep only the images that exist in product.images and are in imagesToKeep
      finalImages = product.images.filter((existingImage) =>
        imagesToKeep.some((img) => img.public_id === existingImage.public_id),
      );
    } else {
      // If keepImages not provided, keep all existing images
      finalImages = [...product.images];
    }

    // Handle new image uploads if any
    if (req.files && req.files.length > 0) {
      // Upload new images to Cloudinary
      let uploadedImages = [];
      try {
        for (const file of req.files) {
          const uploadedImage = await uploadToCloudinary(file);
          uploadedImages.push(uploadedImage);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new images to Cloudinary",
        });
      }

      // Add new images to final images
      finalImages = [...finalImages, ...uploadedImages];
    }

    // Delete images that are not in finalImages
    const imagesToDelete = product.images.filter(
      (existingImage) =>
        !finalImages.some((img) => img.public_id === existingImage.public_id),
    );

    // Delete old images from Cloudinary
    for (const image of imagesToDelete) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }

    // Update product images
    product.images = finalImages;

    // Validate discount price
    if (product.discountPrice && product.discountPrice > product.price) {
      return res.status(400).json({
        success: false,
        message: "Discount price cannot be greater than original price",
      });
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Delete product with Cloudinary image cleanup
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await Product.findOne({
      _id: id,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission",
      });
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get seller's products
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 10, search, category, status } = req.query;

    const query = { sellerId };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      if (status === "active") {
        query.isActive = true;
      } else if (status === "inactive") {
        query.isActive = false;
      } else if (status === "lowstock") {
        query.stock = { $lt: 10 };
        query.isActive = true;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    // Get categories for filter
    const categories = await Product.distinct("category", { sellerId });
    const categoryDetails = await Category.find({
      _id: { $in: categories },
    }).select("name");

    res.status(200).json({
      success: true,
      data: products,
      filters: {
        categories: categoryDetails,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Seller Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single seller product
export const getSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await Product.findOne({
      _id: id,
      sellerId,
    }).populate("category", "name description");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get Seller Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update stock
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const sellerId = req.user._id;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock quantity is required",
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        sellerId,
      },
      { stock },
      { new: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Stock Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
