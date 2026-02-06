import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  image: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Pre-save middleware ko completely remove kar dein
// categorySchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

const Category = mongoose.model("Category", categorySchema);
export default Category;
