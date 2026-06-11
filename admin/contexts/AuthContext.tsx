"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUserStr = localStorage.getItem("adminUser");
      
      if (!token || !savedUserStr) {
        setIsLoading(false);
        return;
      }
      
      try {
        const savedUser = JSON.parse(savedUserStr);
        // Verify with the backend if token is still valid. 
        // /users/me works for all valid JWTs.
        await api.get("/users/me");
        setUser(savedUser);
      } catch (err) {
        console.error("Session expired or invalid:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("adminUser");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const res = await api.post("/auth/login", credentials);
      const { user: loggedInUser, token } = res.data;
      
      // Strict role check for Admin Platform
      if (loggedInUser.role !== "SuperAdmin" && loggedInUser.role !== "Admin") {
         toast.error("Accès refusé. Droits insuffisants.");
         return false;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("adminUser", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      toast.success(res.data.message || "Connexion réussie");
      router.push("/");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Identifiants invalides");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
