import mongoose from "mongoose";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import cloudinary from "../../config/cloudinary.js";

// ============== CLOUDINARY UPLOAD - MEMORY STORAGE VERSION ==============
const uploadToCloudinary = async (file) => {
  try {
    console.log("Uploading to Cloudinary:", file.originalname);

    // For memory storage - use buffer, NOT path
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "marketplace/products",
          resource_type: "auto",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
            { format: "webp" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });

    console.log("Cloudinary upload successful:", result.public_id);

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

// ============== CATEGORY FUNCTIONS ==============
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// ============== PRODUCT FUNCTIONS ==============
export const createProduct = async (req, res) => {
  let uploadedImages = [];

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "MongoDB not connected. State:",
        mongoose.connection.readyState,
      );
      return res.status(500).json({
        success: false,
        message: "Database connection error",
      });
    }

    console.log("=== Create Product Request ===");
    console.log("User ID:", req.user?._id);
    console.log("Files received:", req.files?.length || 0);

    const sellerId = req.user._id;
    const seller = req.user;

    // Check seller approval
    if (!seller.isApproved || seller.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved",
      });
    }

    // Parse request body
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

    // Parse JSON fields with error handling
    let parsedSpecifications = {};
    let parsedTags = [];

    try {
      if (specifications) {
        parsedSpecifications =
          typeof specifications === "string"
            ? JSON.parse(specifications)
            : specifications;
      }
    } catch (e) {
      console.error("Error parsing specifications:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid specifications format. Must be valid JSON.",
      });
    }

    try {
      if (tags) {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          throw new Error("Tags must be an array");
        }
      }
    } catch (e) {
      console.error("Error parsing tags:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid tags format. Must be a JSON array.",
      });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product title is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product description is required",
      });
    }

    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    if (!stock || isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock quantity is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Handle image uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Upload images to Cloudinary directly from buffer
    console.log(`Uploading ${req.files.length} images to Cloudinary...`);

    for (const file of req.files) {
      try {
        const uploadedImage = await uploadToCloudinary(file);
        uploadedImages.push(uploadedImage);
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        throw new Error(
          `Failed to upload image ${file.originalname}: ${uploadError.message}`,
        );
      }
    }

    console.log(`Successfully uploaded ${uploadedImages.length} images`);

    // Validate discount price
    const numericPrice = Number(price);
    const numericDiscountPrice = discountPrice ? Number(discountPrice) : null;

    if (numericDiscountPrice && numericDiscountPrice > numericPrice) {
      // Clean up uploaded images from Cloudinary
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Cloudinary image:", cleanupError);
        }
      }

      return res.status(400).json({
        success: false,
        message: "Discount price cannot be greater than original price",
      });
    }

    // Create product
    const product = new Product({
      title: title.trim(),
      description: description.trim(),
      price: numericPrice,
      discountPrice: numericDiscountPrice,
      stock: Number(stock),
      category,
      brand: brand ? brand.trim() : "",
      images: uploadedImages,
      sellerId,
      specifications: parsedSpecifications,
      tags: parsedTags,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await product.save();
    console.log("Product saved successfully:", product._id);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("=== Create Product Error ===");
    console.error("Error message:", error.message);

    // Clean up uploaded Cloudinary images
    if (uploadedImages.length > 0) {
      console.log(`Cleaning up ${uploadedImages.length} Cloudinary images...`);
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Cloudinary image:", cleanupError);
        }
      }
    }

    // Handle specific errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product entry",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const updateProduct = async (req, res) => {
  let uploadedImages = [];

  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    console.log("=== Update Product Request ===");
    console.log("Product ID:", id);

    // Find product
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

    // Parse request body
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
      keepImages = "[]",
    } = req.body;

    // Update fields with validation
    if (title) product.title = title.trim();
    if (description) product.description = description.trim();

    if (price) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid price is required",
        });
      }
      product.price = numericPrice;
    }

    if (discountPrice !== undefined) {
      const numericDiscountPrice = discountPrice ? Number(discountPrice) : null;
      product.discountPrice = numericDiscountPrice;
    }

    if (stock !== undefined) {
      const numericStock = Number(stock);
      if (isNaN(numericStock) || numericStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Valid stock quantity is required",
        });
      }
      product.stock = numericStock;
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      product.category = category;
    }

    if (brand !== undefined) product.brand = brand.trim();

    // Parse specifications
    if (specifications) {
      try {
        const parsedSpecifications =
          typeof specifications === "string"
            ? JSON.parse(specifications)
            : specifications;
        product.specifications = parsedSpecifications;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid specifications format",
        });
      }
    }

    // Parse tags
    if (tags) {
      try {
        const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsedTags)) {
          throw new Error("Tags must be an array");
        }
        product.tags = parsedTags;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid tags format",
        });
      }
    }

    if (isFeatured !== undefined) {
      product.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    if (isActive !== undefined) {
      product.isActive = isActive === "true" || isActive === true;
    }

    // Handle images
    let finalImages = [];

    // Parse keepImages
    try {
      const imagesToKeep = JSON.parse(keepImages);
      finalImages = product.images.filter((existingImage) =>
        imagesToKeep.some((img) => img.public_id === existingImage.public_id),
      );
    } catch (e) {
      console.error("Error parsing keepImages:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid keepImages format",
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Upload new images
      for (const file of req.files) {
        try {
          const uploadedImage = await uploadToCloudinary(file);
          uploadedImages.push(uploadedImage);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          throw new Error("Failed to upload new images");
        }
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
        console.log(`Deleted Cloudinary image: ${image.public_id}`);
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

    product.updatedAt = new Date();
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    // Clean up newly uploaded Cloudinary images
    if (uploadedImages.length > 0) {
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Cloudinary image:", cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    console.log("Delete product request:", { id, sellerId });

    // ✅ FIX: Find product and verify ownership in ONE query
    const product = await Product.findOne({
      _id: id,
      sellerId: sellerId, // This ensures seller owns the product
    });

    if (!product) {
      console.log("Product not found or unauthorized");
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission",
      });
    }

    console.log("Found product:", product._id);

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
          console.log(`Deleted Cloudinary image: ${image.public_id}`);
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
          // Continue with deletion even if image delete fails
        }
      }
    }

    // ✅ FIX: Use deleteOne() instead of findByIdAndDelete
    await Product.deleteOne({ _id: id, sellerId: sellerId });

    console.log("Product deleted successfully:", id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 10, search, category, status } = req.query;

    const query = { sellerId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const sellerId = req.user._id;

    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity is required",
      });
    }

    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0) {
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
      {
        stock: numericStock,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
