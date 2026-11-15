const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  setPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getProfile);
router.post("/set-password", protect, setPassword);

module.exports = router;