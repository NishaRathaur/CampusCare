const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "resolved", "closed", "reopened"],
      default: "pending",
    },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isAnonymous: { type: Boolean, default: false },
    photoUrl: { type: String, default: null },
    // Uploaded by the supervisor once the issue is fixed — proof-of-resolution
    // photo shown to admin and to the student/faculty who raised the complaint.
    resolvedPhotoUrl: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
    },
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        remark: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    feedbackDismissed: { type: Boolean, default: false },
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);