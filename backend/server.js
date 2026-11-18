const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Public authentication routes
app.use("/api/auth", authRoutes);

// Course routes
app.use("/api/courses", courseRoutes);

// Protected user routes
app.use("/api/users", authMiddleware, userRoutes);

// Enrollment routes
app.use("/api/enrollments", enrollmentRoutes);

// Reporting routes
app.use("/api/reports", reportRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});