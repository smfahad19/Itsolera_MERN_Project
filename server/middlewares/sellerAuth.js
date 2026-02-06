import User from "../models/User.js"

export const sellerAuth = async (req, res, next) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Seller account required."
      });
    }

    // Check approval status for non-GET requests (except profile routes)
    const readonlyRoutes = [
      '/dashboard', 
      '/profile', 
      '/approval-status',
      '/products'  // GET products should be allowed even if pending
    ];
    
    const isReadOnly = req.method === 'GET' || 
                      readonlyRoutes.some(route => req.path.includes(route));
    
    if (!isReadOnly) {
      if (!req.user.isApproved || req.user.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Your seller account is pending admin approval. You can only view until approved.",
          approvalStatus: req.user.approvalStatus,
          isApproved: req.user.isApproved
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};