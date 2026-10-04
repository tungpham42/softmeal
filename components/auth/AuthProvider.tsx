"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase/client";
import { isAdminUser } from "@/lib/firebase/data";

interface AuthContextValue {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ currentUser: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAdmin(false);
      if (!user) {
        setLoading(false);
        return;
      }
      setIsAdmin(await isAdminUser(user));
      setLoading(false);
    });
  }, []);

  const value = useMemo(() => ({ currentUser, isAdmin, loading }), [currentUser, isAdmin, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
