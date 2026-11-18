const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const reportController = require("../controllers/reportController");

// Every reporting endpoint requires a valid JWT.
router.use(authMiddleware);

// Admin-only report
router.get(
  "/overview",
  roleMiddleware(["ADMIN"]),
  reportController.getOverview
);

// Logged-in student-only report
router.get(
  "/my",
  roleMiddleware(["STUDENT"]),
  reportController.getMyReport
);

module.exports = router;