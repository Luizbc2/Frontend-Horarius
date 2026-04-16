import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "../auth/AuthContext";
import { AUTH_STORAGE_KEY } from "../lib/auth-storage";
import { Login } from "./Login";

function renderLogin(initialEntry: string | { pathname: string; state?: object }) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/agenda/timeline" element={<div>Agenda timeline</div>} />
          <Route path="/clientes" element={<div>Clientes protegidos</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login page", () => {
  test("shows validation errors before sending the form", async () => {
    const user = userEvent.setup();

    renderLogin("/login");

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
  });

  test("redirects after successful login and stores the session", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Login realizado com sucesso.",
          token: "token-front",
          user: {
            id: 1,
            name: "Luiz",
            email: "luiz@example.com",
            cpf: "12345678901",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    renderLogin({
      pathname: "/login",
      state: {
        from: "/clientes",
      },
    });

    await user.type(screen.getByLabelText("E-mail"), "luiz@example.com");
    await user.type(screen.getByLabelText("Senha"), "Senha123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Clientes protegidos")).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain("token-front");
  });

  test("shows the success notice received from signup", () => {
    renderLogin({
      pathname: "/login",
      state: {
        notice: "Conta criada com sucesso.",
      },
    });

    expect(screen.getByText("Conta criada")).toBeInTheDocument();
    expect(screen.getByText("Conta criada com sucesso.")).toBeInTheDocument();
  });
});
