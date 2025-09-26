import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Important for cookies
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await api.post("/auth/refresh");

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Check authentication status
  checkAuth: () => api.get("/auth/status"),

  // Refresh tokens
  refreshToken: () => api.post("/auth/refresh"),

  // Logout
  logout: () => api.post("/auth/logout"),

  // Get login URL (redirects to SAML IdP)
  getLoginUrl: () => `${api.defaults.baseURL}/auth/login`,
};

// Protected API functions
export const protectedAPI = {
  // Get user profile
  getProfile: () => api.get("/protected/profile"),

  // Get dashboard data
  getDashboard: () => api.get("/protected/dashboard"),

  // Get user settings
  getSettings: () => api.get("/protected/settings"),
};

export default api;
