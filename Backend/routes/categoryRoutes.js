const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const { getCategories, createCategory, deleteCategory } = require("../controllers/categoryController");

// Anyone logged in can view categories (students need this for Raise Complaint)
router.get("/", protect, getCategories);

// Only admins can manage them
router.post("/", protect, checkRole(["admin"]), createCategory);
router.delete("/:id", protect, checkRole(["admin"]), deleteCategory);

module.exports = router;