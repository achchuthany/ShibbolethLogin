const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration to prevent stale request issues
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret_key_here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 3600000, // 1 hour
    },
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Shibboleth Auth API is running",
    timestamp: new Date().toISOString(),
    samlConfigured: !!(
      process.env.IDP_CERT &&
      process.env.IDP_CERT !== "placeholder_certificate_here"
    ),
  });
});

// Configuration status endpoint
app.get("/api/config", (req, res) => {
  res.json({
    saml: {
      configured: !!(
        process.env.IDP_CERT &&
        process.env.IDP_CERT !== "placeholder_certificate_here"
      ),
      idpUrl: process.env.IDP_SSO_URL || "Not configured",
      spEntityId: process.env.SP_ENTITY_ID || "Not configured",
      callbackUrl: process.env.SP_CALLBACK_URL || "Not configured",
    },
    jwt: {
      configured: !!(process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET),
    },
    session: {
      configured: true,
      secret: !!process.env.SESSION_SECRET,
    },
  });
});

// Debug endpoint for SAML troubleshooting
app.get("/api/debug/saml", (req, res) => {
  res.json({
    message: "SAML Debug Information",
    timestamp: new Date().toISOString(),
    loginUrl: `${req.protocol}://${req.get("host")}/api/auth/login`,
    metadataUrl: `${req.protocol}://${req.get("host")}/api/auth/metadata`,
    callbackUrl: process.env.SP_CALLBACK_URL,
    tips: [
      "Clear browser cache and cookies",
      "Ensure you are not using browser back button after login",
      "Try login in incognito/private browsing mode",
      "Check that callback URL matches exactly with IdP configuration",
    ],
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Configuration: http://localhost:${PORT}/api/config`);

  // Check configuration
  if (
    !process.env.IDP_CERT ||
    process.env.IDP_CERT === "placeholder_certificate_here"
  ) {
    console.log("\n⚠️  Warning: SAML not properly configured!");
    console.log(
      "Please update the IDP_CERT in your .env file with your IdP certificate."
    );
    console.log(
      "The server will run but SAML authentication will not work until configured.\n"
    );
  }
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please stop other processes or use a different port.`
    );
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});

module.exports = app;
