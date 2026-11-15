const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const { getReviews, createReview, deleteReview } = require("../controllers/reviewController");

router.get("/", protect, getReviews);
router.post("/", protect, checkRole(["student", "faculty"]), createReview);
router.delete("/:id", protect, checkRole(["admin"]), deleteReview);

module.exports = router;