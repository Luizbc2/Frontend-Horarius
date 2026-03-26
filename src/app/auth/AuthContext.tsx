import { createContext, useContext, useState, type ReactNode } from "react";

const AUTH_STORAGE_KEY = "horarius:auth";
const SIGNUP_STORAGE_KEY = "horarius:last-signup";

type AuthUser = {
  name: string;
  email: string;
  cpf: string;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

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

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function readStoredSignup() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSignup = window.localStorage.getItem(SIGNUP_STORAGE_KEY);

    if (!rawSignup) {
      return null;
    }

    const parsedSignup = JSON.parse(rawSignup) as Partial<AuthUser> & { createdAt?: string };

    if (!parsedSignup.email || !parsedSignup.name) {
      return null;
    }

    return {
      email: parsedSignup.email,
      name: parsedSignup.name,
      cpf: typeof parsedSignup.cpf === "string" ? normalizeCpf(parsedSignup.cpf) : "",
    };
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
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

    const storedSignup = readStoredSignup();
    const matchingSignup =
      storedSignup?.email.toLowerCase() === parsedSession.user.email.toLowerCase() ? storedSignup : null;

    return {
      token: parsedSession.token,
      user: {
        email: parsedSession.user.email,
        name: parsedSession.user.name,
        cpf:
          typeof parsedSession.user.cpf === "string" && parsedSession.user.cpf.trim()
            ? normalizeCpf(parsedSession.user.cpf)
            : matchingSignup?.cpf ?? "",
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
        cpf: normalizeCpf(input.cpf),
      },
    };

    persistSession(nextSession);
    setSession(nextSession);

    const storedSignup = readStoredSignup();

    if (storedSignup?.email.toLowerCase() === session.user.email.toLowerCase()) {
      window.localStorage.setItem(
        SIGNUP_STORAGE_KEY,
        JSON.stringify({
          ...storedSignup,
          name: nextSession.user.name,
          cpf: nextSession.user.cpf,
        }),
      );
    }
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
