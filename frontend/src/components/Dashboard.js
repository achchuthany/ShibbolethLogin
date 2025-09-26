import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
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
          {message && <div className="success">{message}</div>}

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
              <h3>User Information</h3>
              <p>
                <strong>Name:</strong>{" "}
                {user?.displayName || `${user?.firstName} ${user?.lastName}`}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || "Not provided"}
              </p>
              <p>
                <strong>User ID:</strong> {user?.id}
              </p>
            </div>

            <div className="info-card">
              <h3>Session Information</h3>
              <p>
                <strong>Last Login:</strong>{" "}
                {dashboardData?.data?.lastLogin
                  ? new Date(dashboardData.data.lastLogin).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>Authentication Method:</strong> Shibboleth SAML
              </p>
              <p>
                <strong>Session Status:</strong> Active
              </p>
            </div>

            <div className="info-card">
              <h3>Application Features</h3>
              <p>✅ Single Sign-On (SSO)</p>
              <p>✅ JWT Token Authentication</p>
              <p>✅ Automatic Token Refresh</p>
              <p>✅ Secure Session Management</p>
              <p>✅ SAML-based Authentication</p>
            </div>

            <div className="info-card">
              <h3>Security Information</h3>
              <p>
                <strong>IdP Provider:</strong> jfn.ac.lk
              </p>
              <p>
                <strong>Protocol:</strong> SAML 2.0
              </p>
              <p>
                <strong>Token Type:</strong> JWT (HTTP-Only Cookies)
              </p>
              <p>
                <strong>Session Timeout:</strong> Configurable
              </p>
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
