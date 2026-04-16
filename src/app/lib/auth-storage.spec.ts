import {
  AUTH_STORAGE_KEY,
  clearStoredSession,
  getStoredToken,
  persistSession,
  readStoredSession,
} from "./auth-storage";

describe("auth storage", () => {
  test("persists the session with normalized email, name and CPF", () => {
    persistSession({
      token: "token-front",
      user: {
        id: 1,
        name: "  Luiz  ",
        email: "  LUIZ@EMAIL.COM  ",
        cpf: "529.982.247-25",
      },
    });

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('"email":"luiz@email.com"');
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('"name":"Luiz"');
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('"cpf":"52998224725"');
  });

  test("reads a valid stored session", () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: "token-front",
        user: {
          id: 5,
          name: "Luiz",
          email: "luiz@email.com",
          cpf: "529.982.247-25",
        },
      }),
    );

    expect(readStoredSession()).toEqual({
      token: "token-front",
      user: {
        id: 5,
        name: "Luiz",
        email: "luiz@email.com",
        cpf: "52998224725",
      },
    });
    expect(getStoredToken()).toBe("token-front");
  });

  test("ignores invalid JSON and can clear the session", () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "{invalido");

    expect(readStoredSession()).toBeNull();

    persistSession({
      token: "token-front",
      user: {
        id: 1,
        name: "Luiz",
        email: "luiz@email.com",
        cpf: "52998224725",
      },
    });
    clearStoredSession();

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getStoredToken()).toBeNull();
  });
});
