export const AUTH_STORAGE_KEY = "horarius:auth";
export const SIGNUP_STORAGE_KEY = "horarius:last-signup";

export type AuthUser = {
  name: string;
  email: string;
  cpf: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type StoredSignup = Partial<AuthUser> & {
  createdAt?: string;
};

const normalizeCpf = (value: string): string => value.replace(/\D/g, "").slice(0, 11);

const canUseLocalStorage = (): boolean => typeof window !== "undefined";

export function readStoredSignup(): StoredSignup | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSignup = window.localStorage.getItem(SIGNUP_STORAGE_KEY);

    if (!rawSignup) {
      return null;
    }

    const parsedSignup = JSON.parse(rawSignup) as StoredSignup;

    if (!parsedSignup.email || !parsedSignup.name) {
      return null;
    }

    return {
      ...parsedSignup,
      email: parsedSignup.email,
      name: parsedSignup.name,
      cpf: typeof parsedSignup.cpf === "string" ? normalizeCpf(parsedSignup.cpf) : "",
    };
  } catch {
    return null;
  }
}

export function readStoredSession(): AuthSession | null {
  if (!canUseLocalStorage()) {
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
      storedSignup?.email?.toLowerCase() === parsedSession.user.email.toLowerCase() ? storedSignup : null;

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
    };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function syncStoredSignupProfile(email: string, user: AuthUser): void {
  const storedSignup = readStoredSignup();

  if (!storedSignup?.email || storedSignup.email.toLowerCase() !== email.toLowerCase()) {
    return;
  }

  window.localStorage.setItem(
    SIGNUP_STORAGE_KEY,
    JSON.stringify({
      ...storedSignup,
      name: user.name,
      cpf: normalizeCpf(user.cpf),
    }),
  );
}
