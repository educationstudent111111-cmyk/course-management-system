const bcrypt = require("bcrypt");
const hashPassword = require("../helpers/hashPassword");
const User = require("../models/userModel");

const PASSWORD_FAILURE_LIMIT = 5;
const PASSWORD_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const passwordFailures = new Map();

function getAuthenticatedUserId(req) {
  const id = Number(req.user?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isAdministrator(req) {
  return req.user?.role === "admin";
}

function getPasswordFailure(userId) {
  const failure = passwordFailures.get(userId);

  if (!failure || failure.resetAt <= Date.now()) {
    passwordFailures.delete(userId);
    return null;
  }

  return failure;
}

function prunePasswordFailures() {
  const now = Date.now();

  for (const [userId, failure] of passwordFailures) {
    if (failure.resetAt <= now) {
      passwordFailures.delete(userId);
    }
  }
}

// Get the authenticated user's safe profile.
const getMyProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error loading own profile:", error.message);
    return res.status(500).json({ message: "Unable to load your profile." });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "A profile object is required.",
        errors: { full_name: "Enter a full name." },
      });
    }

    const unexpectedFields = Object.keys(req.body).filter(
      (field) => field !== "full_name"
    );

    if (unexpectedFields.length > 0) {
      return res.status(400).json({
        message: "Only the full_name field can be changed.",
        errors: Object.fromEntries(
          unexpectedFields.map((field) => [
            field,
            "This field cannot be changed here.",
          ])
        ),
      });
    }

    if (typeof req.body.full_name !== "string") {
      return res.status(400).json({
        message: "Full name must be text.",
        errors: { full_name: "Enter a full name." },
      });
    }

    const fullName = req.body.full_name.trim();

    if (fullName.length < 3 || fullName.length > 100) {
      return res.status(400).json({
        message: "Full name must be between 3 and 100 characters.",
        errors: {
          full_name: "Full name must be between 3 and 100 characters.",
        },
      });
    }

    const user = await User.updateFullName(userId, fullName);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error updating own profile:", error.message);
    return res.status(500).json({ message: "Unable to update your profile." });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    const errors = {};

    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      errors.currentPassword = "Enter your current password.";
    }

    if (typeof newPassword !== "string" || newPassword.length === 0) {
      errors.newPassword = "Enter a new password.";
    } else {
      if (Array.from(newPassword).length < 8) {
        errors.newPassword = "Password must be at least 8 characters.";
      }

      if (Buffer.byteLength(newPassword, "utf8") > 72) {
        errors.newPassword = "Password must not exceed 72 UTF-8 bytes.";
      }
    }

    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the password fields.",
        errors,
      });
    }

    const failure = getPasswordFailure(userId);

    if (failure?.count >= PASSWORD_FAILURE_LIMIT) {
      return res.status(429).json({
        message: "Too many incorrect password attempts. Try again later.",
      });
    }

    const currentHash = await User.findPasswordById(userId);

    if (!currentHash) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      currentHash
    );

    if (!currentPasswordMatches) {
      prunePasswordFailures();
      const currentFailure = getPasswordFailure(userId);
      passwordFailures.set(userId, {
        count: (currentFailure?.count || 0) + 1,
        resetAt: currentFailure?.resetAt ||
          Date.now() + PASSWORD_FAILURE_WINDOW_MS,
      });

      return res.status(401).json({
        message: "Current password is incorrect.",
        errors: { currentPassword: "Current password is incorrect." },
      });
    }

    passwordFailures.delete(userId);

    const sameAsCurrent = await bcrypt.compare(newPassword, currentHash);

    if (sameAsCurrent) {
      return res.status(400).json({
        message: "Choose a password different from your current password.",
        errors: {
          newPassword: "New password must differ from the current password.",
        },
      });
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await User.updatePassword(userId, passwordHash);

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error.message);
    return res.status(500).json({ message: "Unable to change your password." });
  }
};

// Get user by username. Only the account owner or an administrator may access it.
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findByUsername(req.params.username);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!isAdministrator(req) && Number(req.user?.id) !== Number(user.id)) {
      return res.status(403).json({
        message: "You may only access your own account.",
      });
    }

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: "User found",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error finding user:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user by ID. Only the account owner or an administrator may access it.
const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!isAdministrator(req) && getAuthenticatedUserId(req) !== id) {
      return res.status(403).json({
        message: "You may only access your own account.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User found",
      user,
    });
  } catch (error) {
    console.error("Error finding user:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getUserByUsername,
  getUserById,
};
