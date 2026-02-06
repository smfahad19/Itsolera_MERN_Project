import User from "../../models/User.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";

// Dashboard Controller
export const getDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;

    const totalOrders = await Order.countDocuments({ customerId });
    const pendingOrders = await Order.countDocuments({
      customerId,
      orderStatus: "pending",
    });
    const deliveredOrders = await Order.countDocuments({
      customerId,
      orderStatus: "delivered",
    });

    // Get cart items
    const cart = await Cart.findOne({ userId: customerId });
    const cartItems = cart ? cart.items.length : 0;

    // Get total spent
    const orders = await Order.find({ customerId });
    const totalSpent = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // Get recent orders
    const recentOrders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.productId", "title image")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          cartItems,
          totalSpent,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Profile Controllers
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateCustomerProfile = async (req, res) => {
  try {
    const { phone, address } = req.body;

    const customer = await User.findById(req.user._id);

    if (phone) customer.phone = phone;

    if (address) {
      if (typeof address === "string") {
        try {
          const fixedString = address
            .replace(/'/g, '"')
            .replace(/(\w+):/g, '"$1":');

          const parsedAddress = JSON.parse(fixedString);
          customer.address = parsedAddress;
        } catch (parseError) {
          customer.address = {
            street: address,
            city: "",
            state: "",
            country: "",
            zipCode: "",
          };
        }
      } else if (typeof address === "object") {
        customer.address = {
          street: address.street || customer.address?.street || "",
          city: address.city || customer.address?.city || "",
          state: address.state || customer.address?.state || "",
          country: address.country || customer.address?.country || "",
          zipCode: address.zipCode || customer.address?.zipCode || "",
        };
      }
    }

    await customer.save();
    customer.password = undefined;

    res.status(200).json({
      success: true,
      message: "Customer profile updated",
      customer,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Product Controllers - Complete Fixed Version
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
      .populate("category", "name") // Slug removed
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

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidObjectId) {
      console.log("Invalid ObjectId format:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
        error: `Invalid ID: ${id}`,
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    })
      .populate("category", "name description")
      .populate("sellerId", "name rating")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not available",
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      isActive: true,
    })
      .limit(4)
      .populate("category", "name")
      .select("title price discountPrice images ratings stock");

    res.status(200).json({
      success: true,
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);

    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
        error: "Cast to ObjectId failed",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

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

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

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
      .populate("category", "name") // Slug removed
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

// Review Controllers
export const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if product exists and is active
    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if customer already reviewed this product
    const existingReview = product.reviews?.find(
      (review) => review.userId.toString() === req.user._id.toString(),
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Create new review
    const review = {
      userId: req.user._id,
      userName: req.user.name,
      rating,
      comment,
      createdAt: new Date(),
    };

    // Add to product's reviews array
    if (!product.reviews) product.reviews = [];
    product.reviews.push(review);

    // Update average rating and count
    const totalRatings = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    product.ratings.average = totalRatings / product.reviews.length;
    product.ratings.count = product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
};

// Categories Controller
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name description image") // Slug removed
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    }).select("reviews ratings");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = product.reviews || [];
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const paginatedReviews = reviews.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        reviews: paginatedReviews,
        averageRating: product.ratings.average,
        totalReviews: product.ratings.count,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reviews.length / limit),
          totalReviews: reviews.length,
        },
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};
