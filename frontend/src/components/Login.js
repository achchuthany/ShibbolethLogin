import React, { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const { authenticated, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    const logout = searchParams.get("logout");

    if (error === "auth_failed") {
      setMessage("Authentication failed. Please try again.");
    } else if (logout === "success") {
      setMessage("You have been logged out successfully.");
    }
  }, [searchParams]);

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Shibboleth Authentication</h1>

        <p style={{ color: "#666", marginBottom: "30px" }}>
          Please login using your institutional credentials
        </p>

        {message && (
          <div className={message.includes("failed") ? "error" : "success"}>
            {message}
          </div>
        )}

        <button onClick={login} className="login-button">
          Login with Shibboleth IdP
        </button>

        <p
          style={{
            marginTop: "30px",
            fontSize: "14px",
            color: "#888",
            lineHeight: "1.5",
          }}
        >
          You will be redirected to your institution's login page.
          <br />
          After successful authentication, you'll be brought back here.
        </p>
      </div>
    </div>
  );
};

export default Login;
