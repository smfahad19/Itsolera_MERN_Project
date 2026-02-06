import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";

// Get cart items
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: "items.productId",
      select: "title price discountPrice images stock isActive",
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], totalPrice: 0, totalItems: 0 },
      });
    }

    // Filter out inactive products
    cart.items = cart.items.filter(
      (item) => item.productId && item.productId.isActive,
    );

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
      const product = item.productId;
      const price = product.discountPrice || product.price;
      totalPrice += price * item.quantity;
      totalItems += item.quantity;
    });

    await cart.save();

    res.status(200).json({
      success: true,
      cart: {
        ...cart.toObject(),
        totalPrice,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    // Check if product exists and is active
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: [],
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    const price = product.discountPrice || product.price;

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = price;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price,
      });
    }

    await cart.save();

    // Populate product details
    await cart.populate({
      path: "items.productId",
      select: "title images price discountPrice stock",
    });

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
      totalPrice += item.price * item.quantity;
      totalItems += item.quantity;
    });

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: {
        ...cart.toObject(),
        totalPrice,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
      error: error.message,
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Check product stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Update cart
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate product details
    await cart.populate({
      path: "items.productId",
      select: "title images price discountPrice stock",
    });

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
      totalPrice += item.price * item.quantity;
      totalItems += item.quantity;
    });

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: {
        ...cart.toObject(),
        totalPrice,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    // Populate product details if items exist
    if (cart.items.length > 0) {
      await cart.populate({
        path: "items.productId",
        select: "title images price discountPrice stock",
      });
    }

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
      totalPrice += item.price * item.quantity;
      totalItems += item.quantity;
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: {
        ...cart.toObject(),
        totalPrice,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from cart",
      error: error.message,
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart: {
        ...cart.toObject(),
        totalPrice: 0,
        totalItems: 0,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};
