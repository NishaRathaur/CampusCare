/**
 * Campus Care — First Admin Seed Script
 * ---------------------------------------
 * Run this ONCE, directly from your terminal, to create the very
 * first Admin account. You can't create it through the website
 * because there's no admin logged in yet to authorize it —
 * this script bypasses the API and writes straight to the database.
 *
 * Usage:
 *   node scripts/createFirstAdmin.js
 *
 * It reads the admin's details from environment variables so you
 * don't hardcode a real password into a file that might get committed.
 * Add these temporarily to your .env before running (then remove them):
 *
 *   FIRST_ADMIN_NAME=Your Name
 *   FIRST_ADMIN_EMAIL=admin@college.edu
 *   FIRST_ADMIN_PASSWORD=choose_a_strong_password
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const run = async () => {
  const { FIRST_ADMIN_NAME, FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!FIRST_ADMIN_NAME || !FIRST_ADMIN_EMAIL || !FIRST_ADMIN_PASSWORD) {
    console.error(
      "Missing FIRST_ADMIN_NAME, FIRST_ADMIN_EMAIL, or FIRST_ADMIN_PASSWORD in .env. Add them, then rerun."
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const existing = await User.findOne({ email: FIRST_ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`An account with ${FIRST_ADMIN_EMAIL} already exists — nothing created.`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(FIRST_ADMIN_PASSWORD, 10);

  await User.create({
    name: FIRST_ADMIN_NAME,
    email: FIRST_ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    role: "admin",
    isVerified: true, // skip email verification for the bootstrap admin
    mustChangePassword: false,
  });

  console.log(`✅ Admin account created for ${FIRST_ADMIN_EMAIL}. You can now log in on the website.`);
  console.log("⚠️  Remove FIRST_ADMIN_* values from your .env now that this is done.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});