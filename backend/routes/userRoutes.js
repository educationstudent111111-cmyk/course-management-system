const express = require("express");

const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getUserByUsername,
  getUserById,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.put("/me/password", changeMyPassword);

// Get user by username. Restricted to the account owner or an administrator.
router.get(
  "/username/:username",
  getUserByUsername
);

// Get user by ID. Restricted to the account owner or an administrator.
router.get(
  "/:id",
  getUserById
);


module.exports = router;
