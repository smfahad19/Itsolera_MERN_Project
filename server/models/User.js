import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["customer", "seller", "admin"],
    default: "customer",
  },
  avatar: {
    type: String,
    default: "",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  isApproved: {
    type: Boolean,
    default: function () {
      return this.role !== "seller" ? true : false;
    },
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: function () {
      if (this.role === "seller") return "pending";
      return "approved";
    },
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
    default: "",
  },
  approvalNotes: {
    type: String,
    default: "",
  },

  businessName: {
    type: String,
    default: "",
  },
  businessDescription: {
    type: String,
    default: "",
  },
  businessAddress: {
    type: String,
    default: "",
  },
  businessPhone: {
    type: String,
    default: "",
  },
  businessWebsite: {
    type: String,
    default: "",
  },
  businessDocuments: [
    {
      documentType: String,
      documentUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  phone: {
    type: String,
    default: "",
  },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    zipCode: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  if (this.role === "admin") {
    this.isApproved = true;
    this.approvalStatus = "approved";
  }

  if (this.role === "customer") {
    this.isApproved = true;
    this.approvalStatus = "approved";
  }

  if (next && typeof next === "function") {
    return next();
  }
});

const User = mongoose.model("User", userSchema);
export default User;
