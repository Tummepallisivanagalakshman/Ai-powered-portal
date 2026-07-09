import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppRole } from "./types";
import { apiFetch } from "./api";

// Simple definition of the user object coming from our Python backend
export interface User {
  id: number;
  email: string;
  name: string;
  profile_photo_url?: string | null;
  // We can add other fields as necessary
}

interface AuthContextValue {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  setRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await apiFetch("/users/me");
        setUser(userData);
        // Persist and load the active role from localStorage
        const savedRole = localStorage.getItem("app_role") as AppRole;
        setRoleState(savedRole || "candidate");
      } catch (err) {
        console.error("Token verification failed", err);
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  function setRole(newRole: AppRole) {
    localStorage.setItem("app_role", newRole);
    setRoleState(newRole);
  }

  function signIn(token: string, fetchedUser: User) {
    localStorage.setItem("access_token", token);
    setUser(fetchedUser);
    const savedRole = localStorage.getItem("app_role") as AppRole;
    setRoleState(savedRole || "candidate");
  }

  function signOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("app_role");
    setUser(null);
    setRoleState(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

