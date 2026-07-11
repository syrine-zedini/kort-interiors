"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Decode user payload from JWT (no signature validation — just reads the claims)
  const decodeJwt = (token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.id) return null;
      return { id: payload.id, username: payload.username || payload.email || 'Utilisateur', email: payload.email || '', role: payload.role };
    } catch {
      return null;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token) {
      let userData: User | null = null;

      // Try localStorage user JSON first
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
        } catch {
          localStorage.removeItem("user");
        }
      }

      // Fallback: decode from JWT payload
      if (!userData) {
        userData = decodeJwt(token);
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          // Token malformed — clear everything
          localStorage.removeItem("token");
        }
      }

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for auth state changes (login from other tabs/windows)
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token) {
        let userData: User | null = null;
        if (userStr) {
          try { userData = JSON.parse(userStr); } catch { /* ignore */ }
        }
        if (!userData) userData = decodeJwt(token);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          return;
        }
      }
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
