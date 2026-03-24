import { createBrowserRouter, Navigate, useLocation } from "react-router";

import { useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { AgendaTimeline } from "./pages/AgendaTimeline";
import { AgendaLista } from "./pages/AgendaLista";
import { Clientes } from "./pages/Clientes";
import { Profissionais } from "./pages/Profissionais";
import { Servicos } from "./pages/Servicos";
import { PlanosClientes } from "./pages/PlanosClientes";
import { Assinatura } from "./pages/Assinatura";
import { Perfil } from "./pages/Perfil";
import { Login } from "./pages/Login";

function ProtectedLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Layout />;
}

function PublicLoginRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/agenda/timeline" replace />;
  }

  return <Login />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: PublicLoginRoute,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: AgendaTimeline },
      { path: "agenda/timeline", Component: AgendaTimeline },
      { path: "agenda/lista", Component: AgendaLista },
      { path: "clientes", Component: Clientes },
      { path: "profissionais", Component: Profissionais },
      { path: "servicos", Component: Servicos },
      { path: "planos-clientes", Component: PlanosClientes },
      { path: "assinatura", Component: Assinatura },
      { path: "perfil", Component: Perfil },
    ],
  },
]);
