const Complaint = require("../models/Complaint");
const Worker = require("../models/Worker");
const { classifyText } = require("../utils/aiClassifier");

// Categories that should default to high priority regardless of what's picked.
const AUTO_HIGH_PRIORITY_CATEGORIES = ["Safety"];

// @route  POST /api/complaints   (student, faculty)
// --- Replace your existing exports.createComplaint with this version ---

// @route  POST /api/complaints   (student, faculty)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, isAnonymous } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ message: "Fill in all required fields." });
    }

    // Priority escalation still runs at save-time as a safety net —
    // even if the student ignored the live suggestion or the frontend
    // check was skipped somehow, urgent language still forces high priority.
    const aiResult = classifyText(`${title} ${description}`);

    let priority = AUTO_HIGH_PRIORITY_CATEGORIES.includes(category) ? "high" : "medium";
    if (aiResult.suggestedPriority === "high") {
      priority = "high";
    }

    const photoUrl = req.file
  ? `${req.protocol}://${req.get("host")}/uploads/complaints/${req.file.filename}`
  : null;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      location,
      priority,
      photoUrl,
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      raisedBy: req.user.userId,
      statusHistory: [
        {
          status: "pending",
          changedBy: req.user.userId,
          remark:
            priority === "high" && aiResult.urgentTermsFound.length > 0
              ? `Complaint submitted. Auto-flagged high priority (detected: ${aiResult.urgentTermsFound.join(", ")}).`
              : "Complaint submitted",
        },
      ],
    });

    return res.status(201).json({ message: "Complaint submitted.", complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't submit your complaint. Try again." });
  }
};

  // --- Add this function to the bottom of your existing complaintController.js ---
// (keep the `classifyText` import at the top, it's already there from before)

// @route  POST /api/complaints/suggest   (student, faculty)
// Runs the AI classifier on whatever the student has typed SO FAR —
// does not create or save a complaint. Called live from the form,
// before submission, so the student can fix the category up front
// instead of finding out after the complaint is already saved.
exports.suggestClassification = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!description || description.trim().length < 10) {
      // Not enough text yet to make a confident suggestion.
      return res.json({ aiSuggestion: null });
    }

    const aiResult = classifyText(`${title || ""} ${description}`);

    const categoryMismatch =
      aiResult.suggestedCategory &&
      aiResult.suggestedCategory !== category &&
      aiResult.categoryConfidence >= 2;

    return res.json({
      aiSuggestion: categoryMismatch
        ? {
            suggestedCategory: aiResult.suggestedCategory,
            note: `This sounds like it might belong in "${aiResult.suggestedCategory}" instead of "${category}".`,
          }
        : null,
      urgentTermsFound: aiResult.urgentTermsFound,
      willBeHighPriority: aiResult.suggestedPriority === "high",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't analyze the complaint text." });
  }
};

// @route  GET /api/complaints    (role-aware: students see their own, supervisors see assigned, admins see all)
exports.getComplaints = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { status, category } = req.query;

    let filter = {};
    if (role === "student" || role === "faculty") {
      filter.raisedBy = userId;
    } else if (role === "supervisor") {
      filter.assignedTo = userId;
    }
    // admin sees everything — no filter added

    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate("raisedBy", "name email role")
      .populate("assignedTo", "name email")
      .populate("assignedWorker", "name trade mobile")
      .sort({ createdAt: -1 });

    return res.json({ complaints });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't load complaints." });
  }
};

// @route  GET /api/complaints/:id
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("raisedBy", "name email role")
      .populate("assignedTo", "name email")
      .populate("statusHistory.changedBy", "name role");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    const { role, userId } = req.user;
    const isOwner = complaint.raisedBy._id.toString() === userId;
    const isAssignedSupervisor = complaint.assignedTo?._id?.toString() === userId;

    if (role !== "admin" && !isOwner && !isAssignedSupervisor) {
      return res.status(403).json({ message: "You don't have access to this complaint." });
    }

    return res.json({ complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't load this complaint." });
  }
};

// @route  PATCH /api/complaints/:id/assign   (supervisor, admin)
exports.assignComplaint = async (req, res) => {
  try {
    const { supervisorId } = req.body;
    if (!supervisorId) {
      return res.status(400).json({ message: "Choose who to assign this to." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    complaint.assignedTo = supervisorId;
    complaint.status = "assigned";
    complaint.statusHistory.push({
      status: "assigned",
      changedBy: req.user.userId,
      remark: "Assigned for action",
    });

    await complaint.save();
    await complaint.populate("assignedTo", "name email"); // so frontend gets populated data

    return res.json({ message: "Complaint assigned.", complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't assign this complaint." });
  }
};
// @route  PATCH /api/complaints/:id/status   (supervisor, admin)
const VALID_STATUSES = ["pending", "assigned", "in_progress", "resolved", "closed", "reopened"];

exports.updateStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "That's not a valid status." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    complaint.status = status;
    if (status === "resolved") complaint.resolvedAt = new Date();

    complaint.statusHistory.push({
      status,
      changedBy: req.user.userId,
      remark: remark || "",
    });

    await complaint.save();
    return res.json({ message: "Status updated.", complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't update the status." });
  }
};

// @route  POST /api/complaints/:id/feedback   (student/faculty who raised it)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Give a rating between 1 and 5." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    if (complaint.raisedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the person who raised this can leave feedback." });
    }

    if (complaint.status !== "resolved" && complaint.status !== "closed") {
      return res.status(400).json({ message: "You can rate a complaint once it's resolved." });
    }

    complaint.feedback = { rating, comment };
    complaint.status = "closed";
    await complaint.save();

    return res.json({ message: "Thanks for your feedback.", complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't submit feedback." });
  }
};
exports.dismissFeedback = async (req, res) => {
  try {
    const { userId } = req.user;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    if (complaint.raisedBy.toString() !== userId) {
      return res.status(403).json({ message: "Not your complaint." });
    }

    complaint.feedbackDismissed = true;
    await complaint.save();

    res.json({ message: "Dismissed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to dismiss." });
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;

    // Set resolvedAt when the complaint reaches a resolved/closed state
    if (status === "resolved" || status === "closed") {
      complaint.resolvedAt = new Date();
    }

    // Optional: clear resolvedAt if reopened
    if (status === "reopened") {
      complaint.resolvedAt = null;
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user.userId,
      remark,
      changedAt: new Date(),
    });

    await complaint.save();

    res.json({ message: "Status updated", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};
exports.assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedWorker: workerId, status: "in_progress" },
      { new: true }
    ).populate("assignedWorker", "name mobile trade");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Worker assigned", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign worker" });
  }
};
exports.getSupervisorComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedTo: req.user.userId })
      .populate("assignedWorker", "name trade mobile")
      .populate("raisedBy", "name email")
      .sort({ createdAt: -1 });
 
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assigned complaints" });
  }
};
 
// @route  PATCH /api/complaints/:id/supervisor-status
// Supervisor updates status on a complaint ONLY IF it's assigned to them.
exports.updateComplaintStatusBySupervisor = async (req, res) => {
  try {
    const { status, remark } = req.body;
 
    const allowedStatuses = ["pending", "in_progress", "resolved"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
 
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
 
    if (String(complaint.assignedTo) !== String(req.user.userId)) {
      return res.status(403).json({ message: "This complaint isn't assigned to you" });
    }
 
    complaint.status = status;
    if (status === "resolved") {
      complaint.resolvedAt = new Date();
    }
 
    complaint.statusHistory.push({
      status,
      changedBy: req.user.userId,
      remark: remark || `Status updated to ${status} by supervisor`,
    });
 
    await complaint.save();
    res.json({ message: "Status updated", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};
 
// @route  PATCH /api/complaints/:id/assign-worker
// Supervisor assigns one of THEIR workers to a complaint assigned to them.
exports.assignWorkerToComplaint = async (req, res) => {
  try {
    const { workerId } = req.body;
 
    if (!workerId) {
      return res.status(400).json({ message: "workerId is required" });
    }
 
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
 
    if (String(complaint.assignedTo) !== String(req.user.userId)) {
      return res.status(403).json({ message: "This complaint isn't assigned to you" });
    }
 
    // Make sure the worker actually belongs to this supervisor's group
    const worker = await Worker.findOne({ _id: workerId, supervisor: req.user.userId });
    if (!worker) {
      return res.status(403).json({ message: "That worker isn't in your group" });
    }
 
    complaint.assignedWorker = workerId;
    if (complaint.status === "pending") {
      complaint.status = "assigned";
    }
 
    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user.userId,
      remark: `Worker ${worker.name} assigned to this complaint`,
    });
 
    await complaint.save();
 
    const populated = await complaint.populate("assignedWorker", "name trade mobile");
    res.json({ message: "Worker assigned", complaint: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign worker" });
  }
};

// @route  PATCH /api/complaints/:id/resolved-photo   (supervisor only)
// Add this export to your existing complaintController.js
exports.uploadResolvedPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Attach a photo showing the resolved issue." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (String(complaint.assignedTo) !== String(req.user.userId)) {
      return res.status(403).json({ message: "This complaint isn't assigned to you" });
    }

    const resolvedPhotoUrl = `${req.protocol}://${req.get("host")}/uploads/complaints/${req.file.filename}`;
    complaint.resolvedPhotoUrl = resolvedPhotoUrl;

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user.userId,
      remark: "Supervisor uploaded a proof-of-resolution photo",
    });

    await complaint.save();

    res.json({ message: "Resolved photo uploaded", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload resolved photo" });
  }
};