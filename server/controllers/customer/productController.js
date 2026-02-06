import Product from "../../models/Product.js";
import Category from "../../models/Category.js";

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      brands,
      sortBy = "createdAt",
      inStock,
    } = req.query;

    const query = { isActive: true };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.finalPrice = {};
      if (minPrice) query.finalPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.finalPrice.$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brands) {
      const brandArray = brands.split(",");
      query.brand = { $in: brandArray };
    }

    // Stock filter
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Sorting options
    const sortOptions = {
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      newest: { createdAt: -1 },
      rating: { "ratings.average": -1 },
      popular: { "ratings.count": -1 },
    };

    const sort = sortOptions[sortBy] || { createdAt: -1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("sellerId", "name")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    // Get available brands for filtering
    const brandsList = await Product.distinct("brand", query);

    res.status(200).json({
      success: true,
      data: products,
      filters: {
        brands: brandsList.filter((brand) => brand),
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
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get single product for customer
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .populate("category", "name slug description")
      .populate("sellerId", "name rating")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      isActive: true,
    })
      .limit(4)
      .populate("category", "name")
      .select("title price discountPrice images ratings");

    res.status(200).json({
      success: true,
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const featuredProducts = await Product.find({
      isFeatured: true,
      isActive: true,
      stock: { $gt: 0 },
    })
      .limit(limit)
      .populate("category", "name")
      .select("title price discountPrice images ratings stock");

    res.status(200).json({
      success: true,
      data: featuredProducts,
    });
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured products",
      error: error.message,
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get all subcategories (if any)
    const subcategories = await Category.find({ parentCategory: category._id });
    const categoryIds = [category._id, ...subcategories.map((sub) => sub._id)];

    const query = {
      category: { $in: categoryIds },
      isActive: true,
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      category: {
        name: category.name,
        description: category.description,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category products",
      error: error.message,
    });
  }
};

// Get discounted products
export const getDiscountedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const discountedProducts = await Product.find({
      discountPrice: { $exists: true, $ne: null },
      isActive: true,
      stock: { $gt: 0 },
    })
      .limit(limit)
      .populate("category", "name")
      .select("title price discountPrice images ratings stock");

    res.status(200).json({
      success: true,
      data: discountedProducts,
    });
  } catch (error) {
    console.error("Get discounted products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discounted products",
      error: error.message,
    });
  }
};
