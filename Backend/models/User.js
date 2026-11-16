const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "faculty", "supervisor", "admin", "worker"],
      default: "student",
    },
    rollNo: { type: String, trim: true },
    empId: { type: String, trim: true },
    department: { type: String, trim: true },
    year: { type: String, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    supervisorCategory: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    mustChangePassword: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
