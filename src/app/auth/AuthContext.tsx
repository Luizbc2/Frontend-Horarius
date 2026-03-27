import { createContext, useContext, useState, type ReactNode } from "react";

import {
  clearStoredSession,
  type AuthSession,
  type AuthUser,
  persistSession,
  readStoredSession,
  syncStoredSignupProfile,
} from "../lib/auth-storage";
import { loginWithApi } from "../services/auth";

type UpdateUserProfileInput = {
  name: string;
  cpf: string;
  password: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  updateUserProfile: (input: UpdateUserProfileInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error("Preencha e-mail e senha para continuar.");
    }

    const response = await loginWithApi({
      email: email.trim().toLowerCase(),
      password,
    });

    const nextSession: AuthSession = {
      token: response.token,
      user: response.user,
    };

    persistSession(nextSession);
    setSession(nextSession);
  };

  const updateUserProfile = async (input: UpdateUserProfileInput) => {
    if (!session) {
      throw new Error("Nenhum usuario autenticado.");
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 350);
    });

    const nextSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        name: input.name.trim(),
        cpf: input.cpf.replace(/\D/g, "").slice(0, 11),
      },
    };

    persistSession(nextSession);
    setSession(nextSession);
    syncStoredSignupProfile(session.user.email, nextSession.user);
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: session !== null,
        user: session?.user ?? null,
        login,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
