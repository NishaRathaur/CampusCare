const crypto = require("crypto");

// Generates a readable-ish random password like "Xk4Rp9Qw2Zt7"
// (12 chars, mixed case + digits) — secure enough for a temporary
// password that gets changed on first login anyway.
function generateTempPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

module.exports = generateTempPassword;