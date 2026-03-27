import { createContext, useContext, useState, type ReactNode } from "react";

import {
  clearStoredSession,
  type AuthSession,
  type AuthUser,
  persistSession,
  readStoredSession,
  readStoredSignup,
  syncStoredSignupProfile,
} from "../lib/auth-storage";

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

function createUserName(email: string) {
  const localPart = email.split("@")[0]?.trim() ?? "";
  const chunks = localPart
    .split(/[.\-_]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return "Usuário Horarius";
  }

  return chunks
    .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
    .join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 350);
    });

    if (!email.trim() || !password.trim()) {
      throw new Error("Preencha e-mail e senha para continuar.");
    }

    const storedSignup = readStoredSignup();
    const matchingSignup = storedSignup?.email.toLowerCase() === email.trim().toLowerCase() ? storedSignup : null;
    const nextSession: AuthSession = {
      token: `demo-token:${email.toLowerCase()}`,
      user: {
        email: email.trim().toLowerCase(),
        name: matchingSignup?.name ?? createUserName(email),
        cpf: matchingSignup?.cpf ?? "",
      },
    };

    persistSession(nextSession);
    setSession(nextSession);
  };

  const updateUserProfile = async (input: UpdateUserProfileInput) => {
    if (!session) {
      throw new Error("Nenhum usuário autenticado.");
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
