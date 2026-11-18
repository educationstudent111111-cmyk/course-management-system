const Report = require("../models/reportModel");

const reportController = {
  // GET /api/reports/overview
  async getOverview(req, res) {
    try {
      const report = await Report.getOverview();

      return res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Admin report error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to load the admin report.",
      });
    }
  },

  // GET /api/reports/my
  async getMyReport(req, res) {
    try {
      const studentId = req.user?.id;

      if (
        studentId === undefined ||
        studentId === null ||
        !Number.isInteger(Number(studentId)) ||
        Number(studentId) <= 0
      ) {
        return res.status(401).json({
          success: false,
          message: "Valid student authentication is required.",
        });
      }

      const report = await Report.getMyReport(Number(studentId));

      return res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Student report error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to load your report.",
      });
    }
  },
};

module.exports = reportController;
