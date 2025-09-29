import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import ServerTime from "./ServerTime";
import { useAuth } from "../contexts/AuthContext";
import { protectedAPI } from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loginSuccess = searchParams.get("login");
    if (loginSuccess === "success") {
      setMessage("Login successful! Welcome to your dashboard.");
      // Clear the URL parameter after showing the message
      setTimeout(() => setMessage(""), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await protectedAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading dashboard...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="dashboard">
          {message && (
            <div className="success-message" style={{ marginBottom: "20px" }}>
              {message}
            </div>
          )}

          {/* Server Time Display */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "15px", color: "#333" }}>Server Time Information</h3>
            <ServerTime className="server-time-display" />
          </div>

          <div className="user-info card">
            <div className="welcome-card">
            <h1 className="welcome-title">
              Welcome, {user?.displayName || user?.firstName || "User"}!
            </h1>
            <p className="welcome-subtitle">
              You are successfully authenticated via Shibboleth IdP
            </p>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <h3>Personal Information</h3>
              <p>
                <strong>Display Name:</strong>{" "}
                {user?.displayName ||
                  `${user?.firstName} ${user?.lastName}` ||
                  "Not provided"}
              </p>
              <p>
                <strong>First Name:</strong> {user?.firstName || "Not provided"}
              </p>
              <p>
                <strong>Last Name:</strong> {user?.lastName || "Not provided"}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || "Not provided"}
              </p>
              <p>
                <strong>Mobile:</strong> {user?.mobile || "Not provided"}
              </p>
            </div>

            <div className="info-card">
              <h3>Identity Information</h3>
              <p>
                <strong>User ID (uid):</strong> {user?.uid || "Not provided"}
              </p>
              <p>
                <strong>Principal Name:</strong>{" "}
                {user?.principalName || "Not provided"}
              </p>
              <p>
                <strong>Name ID:</strong> {user?.id || "Not provided"}
              </p>
              <p>
                <strong>Affiliation:</strong>{" "}
                {user?.affiliation || "Not provided"}
              </p>
            </div>

            <div className="info-card">
              <h3>Organizational Information</h3>
              <p>
                <strong>Home Organization:</strong>{" "}
                {user?.homeOrganization || "Not provided"}
              </p>
              <p>
                <strong>Department:</strong>{" "}
                {user?.department || "Not provided"}
              </p>
              <p>
                <strong>Org Unit DN:</strong>{" "}
                {user?.orgUnitDN || "Not provided"}
              </p>
              <p>
                <strong>Organization Type:</strong>{" "}
                {user?.homeOrganizationType || "Not provided"}
              </p>
            </div>

            <div className="info-card">
              <h3>Session & System Information</h3>
              <p>
                <strong>Last Login:</strong>{" "}
                {dashboardData?.data?.lastLogin
                  ? new Date(dashboardData.data.lastLogin).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>IdP Version:</strong> Shibboleth v3.3.2
              </p>
              <p>
                <strong>Protocol:</strong> SAML 2.0
              </p>
              <p>
                <strong>Session Status:</strong> Active
              </p>
            </div>

            <div className="info-card">
              <h3>LEARN-LK Attributes</h3>
              <p>
                <strong>Scoped Affiliation:</strong>{" "}
                {user?.scopedAffiliation || "Not provided"}
              </p>
              <p>
                <strong>Entitlement:</strong>{" "}
                {user?.entitlement || "Not provided"}
              </p>
              <p>
                <strong>Total Attributes:</strong>{" "}
                {user?.attributes ? Object.keys(user.attributes).length : 0}
              </p>
              <p style={{ fontSize: "0.9em", color: "#666" }}>
                Zoom-compatible attributes:{" "}
                {
                  [
                    user?.lastName,
                    user?.email,
                    user?.uid,
                    user?.firstName,
                    user?.principalName,
                    user?.affiliation,
                    user?.orgUnitDN,
                    user?.mobile,
                  ].filter(Boolean).length
                }{" "}
                / 8
              </p>
            </div>

            <div className="info-card">
              <h3>Security Features</h3>
              <p>✅ Single Sign-On (SSO)</p>
              <p>✅ JWT Token Authentication</p>
              <p>✅ HTTP/HTTPS Support</p>
              <p>✅ Shibboleth v3.3.2 Compatible</p>
              <p>✅ LEARN-LK Federation Ready</p>
            </div>
          </div>
          </div>

          <div
            className="card"
            style={{ marginTop: "30px", textAlign: "center" }}
          >
            <h3>Next Steps</h3>
            <p style={{ color: "#666", lineHeight: "1.6" }}>
              This is a demonstration of Shibboleth IdP integration with React
              and Express.js.
              <br />
              The application includes secure authentication, session
              management, and token refresh capabilities.
              <br />
              You can extend this foundation to build your specific application
              features.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
