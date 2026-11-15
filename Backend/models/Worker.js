const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    trade: { type: String, required: true, trim: true }, // e.g. Plumber, Electrician, Cleaner
    department: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // which admin added them
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Worker", workerSchema);