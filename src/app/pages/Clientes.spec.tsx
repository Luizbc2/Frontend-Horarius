import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { vi } from "vitest";

import { Clientes } from "./Clientes";
import { ClienteFormulario } from "./ClienteFormulario";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    token: "token-front",
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function LocationStateViewer() {
  const location = useLocation();
  const notice =
    typeof location.state === "object" &&
    location.state !== null &&
    "notice" in location.state &&
    typeof location.state.notice === "string"
      ? location.state.notice
      : "sem-notice";

  return <div>{notice}</div>;
}

describe("Clientes page flow", () => {
  test("loads clients and removes one item from the list", async () => {
    const user = userEvent.setup();
    let listRequestCount = 0;

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/clients") && method === "GET") {
        listRequestCount += 1;

        if (listRequestCount === 1) {
          return createJsonResponse({
            data: [
              {
                id: 1,
                name: "Ana Silva",
                email: "ana@example.com",
                phone: "11999999999",
                notes: "Cliente VIP",
              },
            ],
            page: 1,
            limit: 6,
            totalItems: 1,
            totalPages: 1,
          });
        }

        return createJsonResponse({
          data: [],
          page: 1,
          limit: 6,
          totalItems: 0,
          totalPages: 1,
        });
      }

      if (url.includes("/clients/1") && method === "DELETE") {
        return createJsonResponse({
          message: "Cliente excluÃ­do com sucesso.",
        });
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    render(
      <MemoryRouter initialEntries={["/clientes"]}>
        <Routes>
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<div>Novo cliente</div>} />
          <Route path="/clientes/:clientId/editar" element={<div>Editar cliente</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Cliente VIP")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Remover/i }));

    expect(await screen.findByText("Nenhum cliente cadastrado")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [, firstRequestInit] = fetchMock.mock.calls[0] ?? [];
    const firstHeaders = firstRequestInit?.headers as Headers;

    expect(firstHeaders.get("Authorization")).toBe("Bearer token-front");
  });

  test("submits the create form and redirects back with a success notice", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/clients") && method === "POST") {
        return createJsonResponse({
          message: "Cliente cadastrado com sucesso.",
          client: {
            id: 9,
            name: "Carlos Lima",
            email: "carlos@example.com",
            phone: "11988887777",
            notes: "Primeiro atendimento",
          },
        }, 201);
      }

      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    render(
      <MemoryRouter initialEntries={["/clientes/novo"]}>
        <Routes>
          <Route path="/clientes/novo" element={<ClienteFormulario />} />
          <Route path="/clientes" element={<LocationStateViewer />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Nome"), "Carlos Lima");
    await user.type(screen.getByLabelText("E-mail"), "carlos@example.com");
    await user.type(screen.getByLabelText("Telefone"), "11988887777");
    await user.type(screen.getByLabelText(/Observa/), "Primeiro atendimento");
    await user.click(screen.getByRole("button", { name: /Cadastrar cliente/i }));

    expect(await screen.findByText("Cliente cadastrado com sucesso.")).toBeInTheDocument();
  });
});
