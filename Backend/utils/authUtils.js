const jwt = require("jsonwebtoken");

// Map each self-signup role to its allowed college email domain.
// Update these to match your institute's actual domains.
const ALLOWED_DOMAINS = {
  student: "@gmail.com",
  faculty: "@gmail.com",
};

const isValidCollegeEmail = (email, role) => {
  const domain = ALLOWED_DOMAINS[role];
  if (!domain) return false;
  return email.toLowerCase().endsWith(domain);
};

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = { ALLOWED_DOMAINS, isValidCollegeEmail, generateToken };