import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from "react-router";

import { useAuth } from "./auth/AuthContext";

const Layout = lazy(() => import("./components/Layout").then((module) => ({ default: module.Layout })));
const AgendaTimeline = lazy(() => import("./pages/AgendaTimeline").then((module) => ({ default: module.AgendaTimeline })));
const AgendaLista = lazy(() => import("./pages/AgendaLista").then((module) => ({ default: module.AgendaLista })));
const Clientes = lazy(() => import("./pages/Clientes").then((module) => ({ default: module.Clientes })));
const ClienteFormulario = lazy(() =>
  import("./pages/ClienteFormulario").then((module) => ({ default: module.ClienteFormulario })),
);
const Profissionais = lazy(() =>
  import("./pages/Profissionais").then((module) => ({ default: module.Profissionais })),
);
const ProfissionalFormulario = lazy(() =>
  import("./pages/ProfissionalFormulario").then((module) => ({ default: module.ProfissionalFormulario })),
);
const ProfissionalHorarios = lazy(() =>
  import("./pages/ProfissionalHorarios").then((module) => ({ default: module.ProfissionalHorarios })),
);
const Servicos = lazy(() => import("./pages/Servicos").then((module) => ({ default: module.Servicos })));
const ServicoFormulario = lazy(() =>
  import("./pages/ServicoFormulario").then((module) => ({ default: module.ServicoFormulario })),
);
const Perfil = lazy(() => import("./pages/Perfil").then((module) => ({ default: module.Perfil })));
const CadastroUsuario = lazy(() =>
  import("./pages/CadastroUsuario").then((module) => ({ default: module.CadastroUsuario })),
);
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));

export function ProtectedLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <Suspense fallback={null}>
      <Layout />
    </Suspense>
  );
}

export function PublicLoginRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/agenda/timeline" replace />;
  }

  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

export function PublicSignupRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/agenda/timeline" replace />;
  }

  return (
    <Suspense fallback={null}>
      <CadastroUsuario />
    </Suspense>
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/login",
    Component: PublicLoginRoute,
  },
  {
    path: "/cadastro",
    Component: PublicSignupRoute,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: AgendaTimeline },
      { path: "agenda/timeline", Component: AgendaTimeline },
      { path: "agenda/lista", Component: AgendaLista },
      { path: "clientes", Component: Clientes },
      { path: "clientes/novo", Component: ClienteFormulario },
      { path: "clientes/:clientId/editar", Component: ClienteFormulario },
      { path: "profissionais", Component: Profissionais },
      { path: "profissionais/novo", Component: ProfissionalFormulario },
      { path: "profissionais/:professionalId/editar", Component: ProfissionalFormulario },
      { path: "profissionais/:professionalId/horarios", Component: ProfissionalHorarios },
      { path: "servicos", Component: Servicos },
      { path: "servicos/novo", Component: ServicoFormulario },
      { path: "servicos/:serviceId/editar", Component: ServicoFormulario },
      { path: "perfil", Component: Perfil },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
