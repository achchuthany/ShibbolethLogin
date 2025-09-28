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

// Restrict trusted proxies (ngrok presents as a single forwarding hop)
// Avoid permissive true which triggers express-rate-limit warning
app.set("trust proxy", [
  "loopback",
  "linklocal",
  "uniquelocal",
  "127.0.0.1",
  "::1",
]);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Always allow the requesting origin (for testing)
      // This ensures we never send '*' when credentials are included
      console.log(`CORS request from origin: ${origin}`);
      callback(null, origin || "http://localhost:3000");
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Simple request logger (minimal) for SAML troubleshooting
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Req] ${req.method} ${req.originalUrl} ip=${req.ip} ua='${req.headers["user-agent"]}'`
    );
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

// Metadata endpoint for Entity ID compatibility
app.get("/metadata", (req, res) => {
  // Redirect to the actual metadata endpoint
  res.redirect(301, "/api/auth/metadata");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Shibboleth Auth API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
