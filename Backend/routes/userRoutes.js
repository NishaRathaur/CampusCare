const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const { getUsersByRole, toggleUserStatus, deleteUser,createUser,getActiveSupervisors, } = require("../controllers/userController");

// Every route below requires a logged-in admin.
router.use(protect, checkRole(["admin"]));

router.post("/", createUser);
router.get("/", getUsersByRole);
router.patch("/:id/status", toggleUserStatus);
router.delete("/:id", deleteUser);
router.get("/supervisors", protect, checkRole(["admin"]), getActiveSupervisors);

module.exports = router;