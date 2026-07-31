"use client";

/**
 * hooks/useAuth.ts
 *
 * React hook that subscribes to Firebase auth state and returns the current
 * user (or null while loading / when signed out).
 *
 * Usage:
 *   const { user, loading } = useAuth();
 */

import { useState, useEffect } from "react";
import { onAuthStateChangedListener, type User } from "@/lib/firebase";

interface AuthState {
  /** The signed-in Firebase user, or null if signed out. */
  user: User | null;
  /** True on first render before Firebase resolves the initial auth state. */
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
