const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const { addSupervisor } = require("../controllers/adminController");

router.post("/add-supervisor", protect, isAdmin, addSupervisor); // line 6


module.exports = router;