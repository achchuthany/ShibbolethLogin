import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <a href="/dashboard" className="navbar-brand">
          Shibboleth Auth App
        </a>

        <div className="navbar-user">
          <span>Welcome, {user?.displayName || user?.firstName || "User"}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
