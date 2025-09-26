const express = require("express");
const passport = require("passport");
const { v4: uuidv4 } = require("uuid");
const TokenService = require("../services/tokenService");
const SamlService = require("../services/samlService");
const { verifyRefreshToken } = require("../middleware/auth");

const router = express.Router();

// Initialize Passport with SAML strategy - delay initialization
let samlInitialized = false;

const initializeSAML = () => {
  if (!samlInitialized) {
    try {
      SamlService.initializePassport();
      router.use(passport.initialize());
      samlInitialized = true;
    } catch (error) {
      console.error("SAML initialization failed:", error.message);
      throw error;
    }
  }
};

// Initiate SAML login
router.get("/login", (req, res, next) => {
  try {
    initializeSAML();

    // Clear any existing session data to prevent stale request issues
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.log("Session destruction error:", err);
        }
      });
    }

    passport.authenticate("saml", {
      additionalParams: {
        // Add timestamp to prevent caching issues
        t: Date.now(),
      },
      additionalAuthorizeParams: {
        // Force fresh authentication
        forceAuthn: "false",
      },
    })(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "SAML configuration error. Please configure IDP_CERT and other SAML settings.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// SAML callback handler
router.post(
  "/callback",
  (req, res, next) => {
    try {
      initializeSAML();
      passport.authenticate("saml", { session: false })(req, res, next);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "SAML configuration error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      // Generate JWT tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        sessionId: uuidv4(),
      };

      const { accessToken, refreshToken } =
        TokenService.generateTokens(tokenPayload);

      // Set HTTP-only cookies
      TokenService.setTokenCookies(res, accessToken, refreshToken);

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/dashboard?login=success`);
    } catch (error) {
      console.error("Callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

// Check authentication status
router.get("/status", (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.json({ authenticated: false });
    }

    const decoded = TokenService.verifyAccessToken(token);
    res.json({
      authenticated: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        displayName: decoded.displayName,
      },
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// Refresh token endpoint
router.post("/refresh", verifyRefreshToken, (req, res) => {
  try {
    const user = req.user;

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      sessionId: uuidv4(),
    };

    const { accessToken, refreshToken } =
      TokenService.generateTokens(tokenPayload);

    // Set new cookies
    TokenService.setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Token refresh failed",
    });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  try {
    // Clear cookies
    TokenService.clearTokenCookies(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// SAML logout initiation
router.get("/slo", (req, res, next) => {
  passport._strategy("saml").logout(req, (err, requestUrl) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "SLO initiation failed",
      });
    }

    // Clear local session
    TokenService.clearTokenCookies(res);

    // Redirect to IdP logout URL
    res.redirect(requestUrl);
  });
});

// SAML logout callback
router.post("/logout/callback", (req, res) => {
  // Handle SAML logout response
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/login?logout=success`);
});

// Service Provider metadata endpoint
router.get("/metadata", (req, res) => {
  try {
    const metadata = SamlService.getMetadata();
    res.type("application/xml");
    res.send(metadata);
  } catch (error) {
    console.error("Metadata generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate metadata",
    });
  }
});

module.exports = router;
