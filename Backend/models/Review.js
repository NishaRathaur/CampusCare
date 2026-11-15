const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, required: true },
    isVisible: { type: Boolean, default: true }, // lets admin hide a review without deleting it
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);