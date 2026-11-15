const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateStatus,
  submitFeedback,
  suggestClassification,
  dismissFeedback,
  getSupervisorComplaints,
  updateComplaintStatusBySupervisor,
  assignWorkerToComplaint,
  uploadResolvedPhoto
} = require("../controllers/complaintController");

// Every route below requires a logged-in user.
router.use(protect);

// Live AI preview — analyzes text as the student types, saves nothing.
router.post("/suggest", checkRole(["student", "faculty"]), suggestClassification);

// Student / faculty raise a complaint (with optional photo).
router.post("/", checkRole(["student", "faculty"]), upload.single("photo"), createComplaint);

// Everyone can list complaints — the controller filters by role internally.
router.get("/", getComplaints);

// --- STATIC ROUTES (Must come before "/:id") ---
// Supervisor gets assigned complaints
router.get("/supervisor", checkRole(["supervisor"]), getSupervisorComplaints);

// --- DYNAMIC ID ROUTES ---
// View a single complaint (ownership/assignment checked in controller).
router.get("/:id", getComplaintById);

// Supervisor/admin assign a complaint to a supervisor.
router.patch("/:id/assign", checkRole(["supervisor", "admin"]), assignComplaint);

// Supervisor/admin update complaint status.
router.patch("/:id/status", checkRole(["supervisor", "admin"]), updateStatus);

// Student/faculty who raised it can leave feedback once resolved.
router.post("/:id/feedback", checkRole(["student", "faculty"]), submitFeedback);
router.patch("/:id/dismiss-feedback", checkRole(["student", "faculty"]), dismissFeedback);

// Supervisor updates and assignment
router.patch("/:id/supervisor-status", checkRole(["supervisor"]), updateComplaintStatusBySupervisor);
router.patch("/:id/assign-worker", checkRole(["supervisor"]), assignWorkerToComplaint);
router.patch("/:id/resolved-photo",checkRole(["supervisor"]),upload.single("resolvedPhoto"),uploadResolvedPhoto);


module.exports = router;