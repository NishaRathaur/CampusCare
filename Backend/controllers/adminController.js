const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const generatePassword = () => crypto.randomBytes(6).toString("hex"); // e.g. "a3f9c1d8e2b0"

exports.addSupervisor = async (req, res) => {
  try {
    const { name, email } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const supervisor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "supervisor",
      mustChangePassword: true, // optional but recommended
    });

    await sendEmail({
      to: email,
      subject: "Your Campus Care Supervisor Account",
      html: `
        <p>Hi ${name},</p>
        <p>An admin has created a supervisor account for you on Campus Care.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Temporary Password:</b> ${plainPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
      `,
    });

    res.status(201).json({
      message: "Supervisor created and credentials sent via email",
      supervisor: { id: supervisor._id, name, email, role: supervisor.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create supervisor" });
  }
};