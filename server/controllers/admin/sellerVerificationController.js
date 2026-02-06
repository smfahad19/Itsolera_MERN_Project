import mongoose from "mongoose";
import User from "../../models/User.js";
import { sendEmail } from "../../utils/emailService.js";

// Get all pending seller applications
export const getPendingApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pendingApplications = await User.find({
      role: "seller",
      "sellerVerification.status": "pending",
    })
      .select(
        "name email phone businessDetails sellerVerification sellerDocuments.identityProof createdAt",
      )
      .sort({ "sellerVerification.appliedAt": -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPending = await User.countDocuments({
      role: "seller",
      "sellerVerification.status": "pending",
    });

    res.status(200).json({
      success: true,
      count: pendingApplications.length,
      total: totalPending,
      applications: pendingApplications.map((app) => ({
        _id: app._id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        businessName: app.businessDetails?.businessName,
        businessType: app.businessDetails?.businessType,
        appliedAt: app.sellerVerification.appliedAt,
        hasDocuments: !!app.sellerDocuments?.identityProof?.frontImage,
        documentType: app.sellerDocuments?.identityProof?.documentType,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPending / limit),
        hasNext: skip + pendingApplications.length < totalPending,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Pending Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get seller application details
export const getApplicationDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId).select("-password");

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Format response
    const response = {
      success: true,
      application: {
        _id: seller._id,
        personalInfo: {
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          avatar: seller.avatar,
        },
        businessInfo: seller.businessDetails,
        documents: seller.sellerDocuments,
        verification: seller.sellerVerification,
        approval: seller.sellerApproval,
        stats: seller.sellerStats,
        timestamps: {
          createdAt: seller.createdAt,
          updatedAt: seller.updatedAt,
          lastActive: seller.lastActive,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get Application Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Verify seller application
export const verifySellerApplication = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.sellerVerification.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Seller verification status is already ${seller.sellerVerification.status}`,
      });
    }

    // Update verification status
    seller.sellerVerification.status = "verified";
    seller.sellerVerification.verifiedBy = req.user._id;
    seller.sellerVerification.verifiedAt = new Date();
    seller.sellerVerification.notes = notes || "";

    // Auto-approve for selling if all documents are complete
    const hasCompleteDocuments =
      seller.sellerDocuments?.identityProof?.frontImage &&
      seller.sellerDocuments?.bankDetails?.accountNumber &&
      seller.businessDetails?.businessName;

    if (hasCompleteDocuments) {
      seller.sellerApproval.status = "approved";
      seller.sellerApproval.isApproved = true;
      seller.sellerApproval.approvedBy = req.user._id;
      seller.sellerApproval.approvedAt = new Date();
    }

    await seller.save();

    // Send verification email to seller
    try {
      await sendEmail({
        to: seller.email,
        subject: "Seller Verification Approved",
        html: `
          <h2>Congratulations! Your Seller Account is Verified</h2>
          <p>Dear ${seller.name},</p>
          <p>Your seller application has been verified and approved by our team.</p>
          <p><strong>Business Name:</strong> ${seller.businessDetails?.businessName}</p>
          ${
            hasCompleteDocuments
              ? "<p><strong>Status:</strong> Fully approved! You can now start adding products to your store.</p>"
              : "<p><strong>Status:</strong> Verified! Please complete your bank details to start selling.</p>"
          }
          <p>You can now login to your seller dashboard to manage your store.</p>
          <p>Best regards,<br>The Admin Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Seller application verified successfully",
      seller: {
        _id: seller._id,
        name: seller.name,
        businessName: seller.businessDetails?.businessName,
        verificationStatus: seller.sellerVerification.status,
        approvalStatus: seller.sellerApproval.status,
        isApproved: seller.sellerApproval.isApproved,
        canSell: seller.sellerApproval.isApproved,
      },
    });
  } catch (error) {
    console.error("Verify Seller Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reject seller application
export const rejectSellerApplication = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason, notes } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.sellerVerification.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject application with status: ${seller.sellerVerification.status}`,
      });
    }

    // Update status
    seller.sellerVerification.status = "rejected";
    seller.sellerVerification.rejectionReason = reason;
    seller.sellerVerification.notes = notes || "";

    await seller.save();

    // Send rejection email
    try {
      await sendEmail({
        to: seller.email,
        subject: "Seller Application Status Update",
        html: `
          <h2>Seller Application Update</h2>
          <p>Dear ${seller.name},</p>
          <p>Your seller application has been reviewed by our team.</p>
          <p><strong>Status:</strong> Rejected</p>
          <p><strong>Reason:</strong> ${reason}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          <p>You can submit a new application with corrected information if you wish.</p>
          <p>Best regards,<br>The Admin Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Seller application rejected",
      seller: {
        _id: seller._id,
        name: seller.name,
        verificationStatus: seller.sellerVerification.status,
      },
    });
  } catch (error) {
    console.error("Reject Seller Application Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Approve seller for selling
export const approveSellerForSelling = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.sellerVerification.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Seller must be verified first",
      });
    }

    seller.sellerApproval.status = "approved";
    seller.sellerApproval.isApproved = true;
    seller.sellerApproval.approvedBy = req.user._id;
    seller.sellerApproval.approvedAt = new Date();
    seller.sellerApproval.notes = notes || "";

    await seller.save();

    // Send approval email
    try {
      await sendEmail({
        to: seller.email,
        subject: "Selling Approval Granted",
        html: `
          <h2>Congratulations! You Can Now Start Selling</h2>
          <p>Dear ${seller.name},</p>
          <p>Your seller account has been fully approved for selling!</p>
          <p><strong>Business:</strong> ${seller.businessDetails?.businessName}</p>
          <p>You can now:</p>
          <ul>
            <li>Add products to your store</li>
            <li>Manage inventory</li>
            <li>Process orders</li>
            <li>Receive payments</li>
          </ul>
          <p>Login to your seller dashboard to get started.</p>
          <p>Best regards,<br>The Admin Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Seller approved for selling",
      seller: {
        _id: seller._id,
        name: seller.name,
        businessName: seller.businessDetails?.businessName,
        approvalStatus: seller.sellerApproval.status,
        isApproved: seller.sellerApproval.isApproved,
      },
    });
  } catch (error) {
    console.error("Approve Seller For Selling Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Suspend seller
export const suspendSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason, suspensionDays = 30 } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const seller = await User.findById(sellerId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    const suspensionEnd = new Date();
    suspensionEnd.setDate(suspensionEnd.getDate() + suspensionDays);

    seller.sellerApproval.status = "suspended";
    seller.sellerApproval.suspensionReason = reason;
    seller.sellerApproval.suspensionEnd = suspensionEnd;

    await seller.save();

    // Send suspension email
    try {
      await sendEmail({
        to: seller.email,
        subject: "Seller Account Suspended",
        html: `
          <h2>Account Suspension Notice</h2>
          <p>Dear ${seller.name},</p>
          <p>Your seller account has been suspended.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Suspension End:</strong> ${suspensionEnd.toDateString()}</p>
          <p>During suspension, you cannot:</p>
          <ul>
            <li>Add new products</li>
            <li>Receive new orders</li>
            <li>Access seller features</li>
          </ul>
          <p>Contact support if you have any questions.</p>
          <p>Best regards,<br>The Admin Team</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send suspension email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: `Seller suspended until ${suspensionEnd.toDateString()}`,
      seller: {
        _id: seller._id,
        name: seller.name,
        status: seller.sellerApproval.status,
        suspensionReason: seller.sellerApproval.suspensionReason,
        suspensionEnd: seller.sellerApproval.suspensionEnd,
      },
    });
  } catch (error) {
    console.error("Suspend Seller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all sellers with stats
export const getAllSellers = async (req, res) => {
  try {
    const { status, verification, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { role: "seller" };

    if (
      status &&
      ["approved", "pending", "suspended", "rejected"].includes(status)
    ) {
      query["sellerApproval.status"] = status;
    }

    if (
      verification &&
      ["verified", "pending", "rejected"].includes(verification)
    ) {
      query["sellerVerification.status"] = verification;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "businessDetails.businessName": { $regex: search, $options: "i" } },
      ];
    }

    const sellers = await User.find(query)
      .select(
        "name email phone businessDetails sellerVerification sellerApproval sellerStats createdAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSellers = await User.countDocuments(query);

    // Get counts by status
    const counts = {
      total: await User.countDocuments({ role: "seller" }),
      pendingVerification: await User.countDocuments({
        role: "seller",
        "sellerVerification.status": "pending",
      }),
      verified: await User.countDocuments({
        role: "seller",
        "sellerVerification.status": "verified",
      }),
      approved: await User.countDocuments({
        role: "seller",
        "sellerApproval.status": "approved",
      }),
      suspended: await User.countDocuments({
        role: "seller",
        "sellerApproval.status": "suspended",
      }),
    };

    res.status(200).json({
      success: true,
      count: sellers.length,
      total: totalSellers,
      counts,
      sellers: sellers.map((seller) => ({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        businessName: seller.businessDetails?.businessName,
        businessType: seller.businessDetails?.businessType,
        verificationStatus: seller.sellerVerification.status,
        approvalStatus: seller.sellerApproval.status,
        isApproved: seller.sellerApproval.isApproved,
        canSell:
          seller.sellerVerification.status === "verified" &&
          seller.sellerApproval.status === "approved",
        stats: {
          products: seller.sellerStats?.totalProducts || 0,
          orders: seller.sellerStats?.totalOrders || 0,
          revenue: seller.sellerStats?.totalRevenue || 0,
          rating: seller.sellerStats?.rating?.average || 0,
        },
        createdAt: seller.createdAt,
        verifiedAt: seller.sellerVerification.verifiedAt,
        approvedAt: seller.sellerApproval.approvedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalSellers / limit),
        hasNext: skip + sellers.length < totalSellers,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get All Sellers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
