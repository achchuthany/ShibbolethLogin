import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.checkAuth();
      const { authenticated, user } = response.data;

      setAuthenticated(authenticated);
      setUser(authenticated ? user : null);
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to SAML login endpoint
    window.location.href = authAPI.getLoginUrl();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setAuthenticated(false);
      setUser(null);

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API call fails, clear local state
      setAuthenticated(false);
      setUser(null);
      window.location.href = "/login";
    }
  };

  const refreshAuth = async () => {
    try {
      await authAPI.refreshToken();
      await checkAuthStatus();
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      setAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    authenticated,
    loading,
    login,
    logout,
    refreshAuth,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
