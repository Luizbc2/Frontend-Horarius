import { createContext, useContext, useState, type ReactNode } from "react";

const AUTH_STORAGE_KEY = "horarius:auth";

type AuthUser = {
  name: string;
  email: string;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
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
    return "Usuario Horarius";
  }

  return chunks
    .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
    .join(" ");
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;

    if (!parsedSession.token || !parsedSession.user?.email || !parsedSession.user?.name) {
      return null;
    }

    return {
      token: parsedSession.token,
      user: {
        email: parsedSession.user.email,
        name: parsedSession.user.name,
      },
    } satisfies AuthSession;
  } catch {
    return null;
  }
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

    const nextSession: AuthSession = {
      token: `demo-token:${email.toLowerCase()}`,
      user: {
        email: email.trim().toLowerCase(),
        name: createUserName(email),
      },
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: session !== null,
        user: session?.user ?? null,
        login,
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
