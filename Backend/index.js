require("dotenv").config();
const PORT = process.env.PORT || 8080;
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const workerRoutes = require("./routes/workerRoutes");

const app = express();

connectDB();

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like Postman (no origin) and listed frontends
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/workers", workerRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Catch-all must come AFTER every real route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Multer errors (bad file type, too large) land here.
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || "Upload failed." });
  }
  next();
});

app.listen(PORT, () => console.log(`Campus Care API running on port ${PORT}`));