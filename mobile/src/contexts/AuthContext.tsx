import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api, clearSessionCookie, AuthError } from "../api/client";
import type { MobileProfile } from "../types";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: MobileProfile | null;
}

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAuthenticated: (profile: MobileProfile) => void;
  navigationRef: React.MutableRefObject<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    profile: null,
  });
  const navigationRef = useRef<any>(null);

  const checkAuth = useCallback(async () => {
    try {
      const profile = await api.getMobileProfile();
      setState({ isLoading: false, isAuthenticated: true, profile });
    } catch (err) {
      setState({ isLoading: false, isAuthenticated: false, profile: null });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(() => {
    if (navigationRef.current) {
      navigationRef.current.navigate("Login");
    }
  }, []);

  const logout = useCallback(async () => {
    await clearSessionCookie();
    setState({ isLoading: false, isAuthenticated: false, profile: null });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.getMobileProfile();
      setState((prev) => ({ ...prev, isAuthenticated: true, profile }));
    } catch {
    }
  }, []);

  const setAuthenticated = useCallback((profile: MobileProfile) => {
    setState({ isLoading: false, isAuthenticated: true, profile });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshProfile,
        setAuthenticated,
        navigationRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
