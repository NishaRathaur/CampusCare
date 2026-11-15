const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { isValidCollegeEmail, generateToken } = require("../utils/authUtils");

// Only these roles can self-register. Supervisor/Admin accounts are
// created by an existing Admin through a separate protected route.
const SELF_SIGNUP_ROLES = ["student", "faculty"];

// @route  POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      rollNo,
      year,
      empId,
      designation,
      phone,
    } = req.body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "Fill in all required fields." });
    }

    if (!SELF_SIGNUP_ROLES.includes(role)) {
      return res.status(403).json({ message: "This role cannot self-register." });
    }

    if (!isValidCollegeEmail(email, role)) {
      return res.status(400).json({ message: "Use your official college email for this role." });
    }

    if (role === "student" && !rollNo) {
      return res.status(400).json({ message: "Roll number is required for students." });
    }

    if (role === "faculty" && !empId) {
      return res.status(400).json({ message: "Employee ID is required for faculty." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      rollNo,
      year,
      empId,
      designation,
      phone,
      verificationToken,
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your Campus Care account",
      html: `<p>Hi ${user.name},</p>
             <p>Confirm your college email to activate your Campus Care account.</p>
             <p><a href="${verifyUrl}">Verify email</a></p>
             <p>If you didn't create this account, you can ignore this email.</p>`,
    });

    return res.status(201).json({
      message: "Account created. Check your college email to verify it.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong. Try again." });
  }
};

// @route  GET /api/auth/verify-email?token=...
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token }).select("+verificationToken");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ message: "Email verified. You can sign in now." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong. Try again." });
  }
};

// @route  POST /api/auth/login
// --- Replace your existing exports.login with this version ---
// (adds mustChangePassword to the response so the frontend can redirect
// the user to a "set your password" screen on first login)

exports.login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact the admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    if (expectedRole && expectedRole !== user.role) {
      return res.status(403).json({
        message: `This account is registered as ${user.role}, not ${expectedRole}.`,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify your college email before signing in." });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong. Try again." });
  }
};


// @route  POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return a generic message so we don't reveal which emails exist.
    if (!user) {
      return res.json({ message: "If that account exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Campus Care password",
      html: `<p>Hi ${user.name},</p>
             <p>Reset your password using the link below. This link expires in 30 minutes.</p>
             <p><a href="${resetUrl}">Reset password</a></p>
             <p>If you didn't request this, you can ignore this email.</p>`,
    });

    return res.json({ message: "If that account exists, a reset link has been sent." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong. Try again." });
  }
};

// @route  POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Missing token or new password." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong. Try again." });
  }
};

// @route  GET /api/auth/me  (protected — requires authMiddleware)
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user });
};
// --- Add this new function to the bottom of authController.js ---

// @route  POST /api/auth/set-password   (protected — used for first-login password change)
exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: "Password updated. You're all set." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't update your password." });
  }
};