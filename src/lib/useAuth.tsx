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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
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
        // Default role based on domain or app logic (since role table is mocked here)
        setRole("candidate");
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

  function signIn(token: string, fetchedUser: User) {
    localStorage.setItem("access_token", token);
    setUser(fetchedUser);
    setRole("candidate"); // Customize as needed
  }

  function signOut() {
    localStorage.removeItem("access_token");
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
