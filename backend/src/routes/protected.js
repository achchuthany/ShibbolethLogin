const express = require("express");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Protected route - requires valid JWT token
router.get("/profile", verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        uid: req.user.uid,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        displayName: req.user.displayName,
        affiliation: req.user.affiliation,
        mobile: req.user.mobile,
        sessionId: req.user.sessionId,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// Protected route - dashboard data
router.get("/dashboard", verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      message: "Welcome to the dashboard!",
      user: {
        uid: req.user.uid,
        displayName: req.user.displayName || "User",
        email: req.user.email,
        affiliation: req.user.affiliation,
        mobile: req.user.mobile,
      },
      data: {
        lastLogin: new Date().toISOString(),
        permissions: ["read", "write"], // Example permissions
        notifications: [],
      },
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

// Protected route - user settings
router.get("/settings", verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        theme: "light",
        notifications: true,
        language: "en",
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
});

module.exports = router;
