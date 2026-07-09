import React, { createContext, useContext, useMemo } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthResult {
  user: User | null;
  session: null;
  hasProfile: boolean;
  error?: Error | null;
}

interface AuthContextValue {
  user: User | null;
  session: null;
  loading: boolean;
  authenticateWithTelegram: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const mockUser = {
  id: "story-user-001",
  email: "story@musicverse.ai",
  user_metadata: { full_name: "Story User", avatar_url: "" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<AuthContextValue>(
    () => ({
      user: mockUser,
      session: null,
      loading: false,
      authenticateWithTelegram: async () => ({ user: mockUser, session: null, hasProfile: true }),
      logout: async () => {},
      isAuthenticated: true,
    }),
    [],
  );
  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  return {
    user: mockUser,
    session: null,
    loading: false,
    authenticateWithTelegram: async () => ({ user: mockUser, session: null, hasProfile: true }),
    logout: async () => {},
    isAuthenticated: true,
  };
};