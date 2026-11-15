const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateTempPassword = require("../utils/generatePassword");
const sendEmail = require("../utils/sendEmail");

// Roles an Admin is allowed to create through this route.
// Students/faculty still self-register through /auth/signup.
const CREATABLE_ROLES = ["supervisor", "admin", "worker"];

const generatePassword = () => crypto.randomBytes(6).toString("hex");

// POST /api/users  (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, mobile, role, department, designation } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      name,
      email,
      mobile,
      role,
      department,
      designation,
      password: hashedPassword,
      mustChangePassword: true,
      isActive: true,
      isVerified: true,   // ← add this: admin-created accounts skip email verification
    });

    await sendEmail({
      to: email,
      subject: "Your Campus Care Account",
      html: `
        <p>Hi ${name},</p>
        <p>An admin has created a ${role} account for you on Campus Care.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Temporary Password:</b> ${plainPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
      `,
    });

    res.status(201).json({
      message: "User created and credentials emailed",
      user: { id: user._id, name, email, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// @route  POST /api/users   (admin only)
// Admin fills a small form (name, email, role, department/category).
// Backend generates a random password, creates the account, and
// emails the credentials to the new user's college email.
exports.createStaffAccount = async (req, res) => {
  try {
    const { name, email, role, department, designation, supervisorCategory, phone } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required." });
    }

    if (!CREATABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: "That role can't be created this way." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department,
      designation,
      supervisorCategory,
      phone,
      isVerified: true, // admin-created accounts skip email verification
      mustChangePassword: true, // force them to set their own password on first login
      isActive: true,
    });

    await sendEmail({
      to: user.email,
      subject: "Your Campus Care account has been created",
      html: `
        <p>Hi ${user.name},</p>
        <p>An account has been created for you on Campus Care as <strong>${role}</strong>.</p>
        <p><strong>Login email:</strong> ${user.email}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please sign in and change your password immediately — you'll be asked to set
           a new one on your first login.</p>
        <p><a href="${process.env.CLIENT_URL}/login">Go to login</a></p>
      `,
    });

    return res.status(201).json({
      message: `Account created for ${user.name}. Login details have been emailed to them.`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't create the account. Try again." });
  }
};

// @route  GET /api/users   (admin only) — list users, optionally filtered by role
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Couldn't load users." });
  }
};
// GET /api/users?role=student
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `User ${isActive ? "activated" : "deactivated"}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user status" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
exports.getActiveSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: "supervisor", isActive: true })
      .select("name email supervisorCategory phone")
      .sort({ name: 1 });
    res.json(supervisors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch supervisors" });
  }
};