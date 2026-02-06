import mongoose from "mongoose";
import User from "../../models/User.js";
import { sendEmail } from "../../utils/emailService.js";

// Apply to become a seller
export const applyForSeller = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      // Business Info
      businessName,
      businessType,
      businessDescription,

      // Business Address
      businessStreet,
      businessCity,
      businessState,
      businessCountry,
      businessZipCode,

      // Contact Info
      businessPhone,
      businessEmail,
      businessWebsite,

      // Registration Info
      taxNumber,
      registrationNumber,
      yearEstablished,

      // Identity Info
      identityDocumentType,
      identityDocumentNumber,
      identityExpiryDate,

      // Business Proof
      businessProofType,
      businessDocumentNumber,

      // Bank Info
      bankAccountName,
      bankAccountNumber,
      bankName,
      branchCode,
      iban,
      swiftCode,
    } = req.body;

    // Get uploaded files
    const identityFrontImage = req.files?.identityFrontImage?.[0]?.path || "";
    const identityBackImage = req.files?.identityBackImage?.[0]?.path || "";
    const businessDocumentImage =
      req.files?.businessDocumentImage?.[0]?.path || "";
    const additionalDocuments = req.files?.additionalDocuments || [];

    // Validation
    const requiredFields = {
      businessName,
      businessType,
      businessStreet,
      businessCity,
      businessCountry,
      businessPhone,
      identityDocumentType,
      identityDocumentNumber,
      identityFrontImage,
      bankAccountName,
      bankAccountNumber,
      bankName,
    };

    const missingFields = Object.keys(requiredFields).filter(
      (field) =>
        !requiredFields[field] ||
        requiredFields[field].toString().trim() === "",
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already a seller
    if (user.role === "seller") {
      return res.status(400).json({
        success: false,
        message: "You are already registered as a seller",
      });
    }

    // Check if already applied
    if (user.sellerVerification.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your seller application is already pending",
      });
    }

    if (user.sellerVerification.status === "verified") {
      return res.status(400).json({
        success: false,
        message: "You are already a verified seller",
      });
    }

    // Change role to seller
    user.role = "seller";

    // Update business details
    user.businessDetails = {
      businessName,
      businessType,
      businessDescription: businessDescription || "",
      businessAddress: {
        street: businessStreet,
        city: businessCity,
        state: businessState || "",
        country: businessCountry,
        zipCode: businessZipCode || "",
      },
      businessPhone,
      businessEmail: businessEmail || user.email,
      businessWebsite: businessWebsite || "",
      taxNumber: taxNumber || "",
      registrationNumber: registrationNumber || "",
      yearEstablished: yearEstablished || null,
    };

    // Update phone if provided
    if (businessPhone && !user.phone) {
      user.phone = businessPhone;
    }

    // Update seller documents
    user.sellerDocuments = {
      identityProof: {
        documentType: identityDocumentType,
        documentNumber: identityDocumentNumber,
        frontImage: identityFrontImage,
        backImage: identityBackImage || "",
        expiryDate: identityExpiryDate ? new Date(identityExpiryDate) : null,
      },
      businessProof: {
        documentType: businessProofType || "",
        documentNumber: businessDocumentNumber || "",
        documentImage: businessDocumentImage || "",
      },
      bankDetails: {
        accountName: bankAccountName,
        accountNumber: bankAccountNumber,
        bankName,
        branchCode: branchCode || "",
        iban: iban || "",
        swiftCode: swiftCode || "",
      },
      additionalDocuments: additionalDocuments.map((doc) => ({
        documentType: doc.fieldname,
        documentName: doc.originalname,
        documentUrl: doc.path,
        uploadedAt: new Date(),
      })),
    };

    // Set verification status
    user.sellerVerification = {
      status: "pending",
      appliedAt: new Date(),
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: "",
      notes: "",
    };

    // Set approval status
    user.sellerApproval = {
      isApproved: false,
      status: "pending",
      appliedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: "",
      suspensionReason: "",
      suspensionEnd: null,
    };

    await user.save();

    // Send notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Seller Application",
        html: `
          <h2>New Seller Application</h2>
          <p>A new seller has applied for verification:</p>
          <ul>
            <li><strong>Name:</strong> ${user.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Business:</strong> ${businessName}</li>
            <li><strong>Applied At:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p>Please review the application in the admin panel.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }

    const userResponse = user.toObject();

    res.status(200).json({
      success: true,
      message:
        "Seller application submitted successfully! Our team will review your documents and get back to you soon.",
      user: userResponse,
      nextSteps: [
        "Wait for admin review (usually 1-3 business days)",
        "You'll receive an email notification once verified",
        "After verification, you can apply for selling approval",
        "Once approved, you can start adding products",
      ],
    });
  } catch (error) {
    console.error("Apply For Seller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing application",
    });
  }
};

// Get seller verification status
export const getSellerVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const seller = await User.findById(userId).select(
      "name email role sellerVerification sellerApproval businessDetails sellerStats",
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (seller.role !== "seller") {
      return res.status(400).json({
        success: false,
        message: "You are not registered as a seller",
      });
    }

    const response = {
      success: true,
      status: {
        verification: seller.sellerVerification.status,
        approval: seller.sellerApproval.status,
        isVerified: seller.sellerVerification.status === "verified",
        isApproved: seller.sellerApproval.status === "approved",
        canSell:
          seller.sellerVerification.status === "verified" &&
          seller.sellerApproval.status === "approved",
      },
      business: {
        name: seller.businessDetails?.businessName,
        type: seller.businessDetails?.businessType,
      },
      timeline: {
        appliedAt: seller.sellerVerification.appliedAt,
        verifiedAt: seller.sellerVerification.verifiedAt,
        approvedAt: seller.sellerApproval.approvedAt,
      },
      rejection:
        seller.sellerVerification.rejectionReason ||
        seller.sellerApproval.rejectionReason,
      stats: seller.sellerStats,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get Seller Verification Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Upload additional documents
export const uploadAdditionalDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { documentType, description } = req.body;
    const documentFile = req.file;

    if (!documentType || !documentFile) {
      return res.status(400).json({
        success: false,
        message: "Document type and file are required",
      });
    }

    const seller = await User.findById(userId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (!seller.sellerDocuments.additionalDocuments) {
      seller.sellerDocuments.additionalDocuments = [];
    }

    seller.sellerDocuments.additionalDocuments.push({
      documentType,
      documentName: documentFile.originalname,
      documentUrl: documentFile.path,
      description: description || "",
      uploadedAt: new Date(),
    });

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        type: documentType,
        name: documentFile.originalname,
        url: documentFile.path,
        uploadedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Upload Additional Document Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update business info
export const updateBusinessInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      businessName,
      businessDescription,
      businessPhone,
      businessEmail,
      businessWebsite,
      taxNumber,
      registrationNumber,
    } = req.body;

    const seller = await User.findById(userId);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Only allow updates if not verified yet
    if (seller.sellerVerification.status === "verified") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update business info after verification. Please contact admin.",
      });
    }

    if (businessName) seller.businessDetails.businessName = businessName;
    if (businessDescription)
      seller.businessDetails.businessDescription = businessDescription;
    if (businessPhone) seller.businessDetails.businessPhone = businessPhone;
    if (businessEmail) seller.businessDetails.businessEmail = businessEmail;
    if (businessWebsite)
      seller.businessDetails.businessWebsite = businessWebsite;
    if (taxNumber) seller.businessDetails.taxNumber = taxNumber;
    if (registrationNumber)
      seller.businessDetails.registrationNumber = registrationNumber;

    await seller.save();

    res.status(200).json({
      success: true,
      message: "Business information updated successfully",
      businessDetails: seller.businessDetails,
    });
  } catch (error) {
    console.error("Update Business Info Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Check if user can apply for seller
export const checkEligibility = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const eligibility = {
      canApply: user.role !== "seller",
      currentRole: user.role,
      alreadyApplied: user.sellerVerification?.status === "pending",
      alreadyVerified: user.sellerVerification?.status === "verified",
      requirements: {
        hasEmail: !!user.email,
        hasPhone: !!user.phone,
        hasName: !!user.name,
        emailVerified: user.emailVerified,
      },
    };

    eligibility.isEligible =
      eligibility.canApply &&
      eligibility.requirements.hasEmail &&
      eligibility.requirements.hasPhone &&
      eligibility.requirements.hasName;

    res.status(200).json({
      success: true,
      eligibility,
    });
  } catch (error) {
    console.error("Check Eligibility Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
