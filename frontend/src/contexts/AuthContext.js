import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_BASE_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || "http://localhost:8080";

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const register = async (email, password) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email, password
      });
      return { pending: true };
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email, password
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("AuthContext - Refresh failed:", err);
      if (err.response?.status === 401) logout();
    }
  };

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setError("");
  }

  function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setError("");
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
      refreshUser();
    }
    setLoading(false);
  }, []);

  const verifyEmail = async (email, code) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email?email=${email}&code=${code}`);
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
      throw err;
    }
  };

  const resendOtp = async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/resend-otp?email=${email}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password?email=${email}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code");
      throw err;
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password?email=${email}&code=${code}&newPassword=${newPassword}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
      throw err;
    }
  };

  const value = {
    currentUser,
    error,
    setError,
    login,
    register,
    logout,
    clearAuth,
    refreshUser,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
