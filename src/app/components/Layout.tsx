import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  CreditCard,
  List,
  LogOut,
  Menu,
  Package,
  PanelsTopLeft,
  Plus,
  Scissors,
  Sparkles,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { ApiStatusCard } from "./ApiStatusCard";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

type NavigationItem = {
  label: string;
  path?: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
};

const agendaItems: NavigationItem[] = [
  { label: "Timeline", path: "/agenda/timeline", icon: Clock3 },
  { label: "Lista", path: "/agenda/lista", icon: List },
];

const navigationGroups: Array<{ title: string; items: NavigationItem[] }> = [
  {
    title: "Operacao",
    items: [
      { label: "Clientes", path: "/clientes", icon: Users },
      { label: "Profissionais", path: "/profissionais", icon: Scissors },
      { label: "Servicos", path: "/servicos", icon: Package },
      { label: "Em breve", icon: Sparkles, badge: "soon", disabled: true },
    ],
  },
  {
    title: "Crescimento",
    items: [
      { label: "Planos clientes", path: "/planos-clientes", icon: PanelsTopLeft },
      { label: "Assinatura", path: "/assinatura", icon: CreditCard },
    ],
  },
  {
    title: "Conta",
    items: [{ label: "Perfil", path: "/perfil", icon: User }],
  },
];

type SidebarContentProps = {
  agendaExpanded: boolean;
  setAgendaExpanded: Dispatch<SetStateAction<boolean>>;
  agendaOpen: boolean;
  currentPath: string;
  workspaceDate: string;
  userName: string;
  userEmail: string;
  closeSidebar: () => void;
  handleLogout: () => void;
};

function SidebarContent({
  agendaExpanded,
  setAgendaExpanded,
  agendaOpen,
  currentPath,
  workspaceDate,
  userName,
  userEmail,
  closeSidebar,
  handleLogout,
}: SidebarContentProps) {
  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;

    if (!item.path || item.disabled) {
      return (
        <button
          key={item.label}
          type="button"
          disabled
          className="flex w-full items-center justify-between rounded-[1rem] border border-transparent px-3 py-3 text-left text-sm text-sidebar-foreground/60 transition-all duration-300 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-white/6 text-sidebar-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span>{item.label}</span>
          </span>
          {item.badge ? (
            <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-sidebar-foreground/65">
              {item.badge}
            </span>
          ) : null}
        </button>
      );
    }

    const active = isActive(item.path);

    return (
      <Link
        key={item.label}
        to={item.path}
        onClick={closeSidebar}
        className={cn(
          "group flex items-center justify-between rounded-[1rem] border px-3 py-3 text-sm transition-all duration-300",
          active
            ? "border-white/10 bg-[linear-gradient(135deg,rgba(89,184,171,0.22),rgba(89,184,171,0.08))] text-white shadow-[0_22px_45px_-30px_rgba(89,184,171,0.9)]"
            : "border-transparent text-sidebar-foreground/82 hover:border-white/8 hover:bg-white/6 hover:text-white",
        )}
      >
        <span className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[0.95rem] transition-colors duration-300",
              active
                ? "bg-white/12 text-white"
                : "bg-white/6 text-sidebar-primary group-hover:bg-white/10 group-hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span>{item.label}</span>
        </span>
        {item.badge ? (
          <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-sidebar-foreground/65">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-5 py-6 text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(89,184,171,0.28),transparent_60%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(211,140,86,0.16),transparent_72%)] blur-3xl" />

      <div className="relative rounded-[1.6rem] border border-white/8 bg-white/5 p-5 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(89,184,171,0.95),rgba(53,98,92,0.9))] text-sidebar-primary-foreground shadow-[0_20px_38px_-20px_rgba(89,184,171,0.85)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.3em] text-sidebar-foreground/55">
              Studio planner
            </p>
            <h1 className="font-[var(--font-display)] text-3xl leading-none">Horarius</h1>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.1rem] border border-white/8 bg-black/14 px-3 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-sidebar-foreground/48">
              Workspace
            </p>
            <p className="mt-2 text-sm text-white">{userName}</p>
          </div>
          <div className="rounded-[1.1rem] border border-white/8 bg-black/14 px-3 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-sidebar-foreground/48">
              Hoje
            </p>
            <p className="mt-2 text-sm capitalize text-white">{workspaceDate}</p>
          </div>
        </div>
      </div>

      <nav className="relative mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
        <div className="space-y-2">
          <p className="px-2 text-[0.7rem] uppercase tracking-[0.32em] text-sidebar-foreground/45">
            Agenda
          </p>
          <div className="rounded-[1.4rem] border border-white/8 bg-white/4 p-2">
            <button
              onClick={() => setAgendaExpanded(!agendaExpanded)}
              className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-sm text-sidebar-foreground transition-colors hover:bg-white/6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-white/6 text-sidebar-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span>Agenda</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  agendaOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {agendaOpen ? (
              <div className="mt-1 space-y-1.5 px-1 pb-1">
                {agendaItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path ?? "/agenda/timeline"}
                      onClick={closeSidebar}
                      className={cn(
                        "flex items-center gap-3 rounded-[1rem] border px-3 py-3 text-sm transition-all duration-300",
                        isActive(item.path ?? "")
                          ? "border-white/10 bg-[linear-gradient(135deg,rgba(89,184,171,0.22),rgba(89,184,171,0.08))] text-white shadow-[0_20px_40px_-30px_rgba(89,184,171,0.9)]"
                          : "border-transparent text-sidebar-foreground/78 hover:border-white/8 hover:bg-white/6 hover:text-white",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-white/6 text-sidebar-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="px-2 text-[0.7rem] uppercase tracking-[0.32em] text-sidebar-foreground/45">
              {group.title}
            </p>
            <div className="space-y-1.5">{group.items.map(renderNavigationItem)}</div>
          </div>
        ))}
      </nav>

      <div className="relative mt-6 rounded-[1.5rem] border border-white/8 bg-white/6 p-4 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.88)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(53,98,92,0.9))] text-sidebar-primary-foreground shadow-[0_18px_36px_-22px_rgba(89,184,171,0.9)]">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-white">{userName}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1rem] border border-white/8 bg-black/18 px-4 py-3 text-sm text-sidebar-foreground transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
        <ApiStatusCard />
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPath = location.pathname === "/" ? "/agenda/timeline" : location.pathname;
  const [agendaExpanded, setAgendaExpanded] = useState(currentPath.startsWith("/agenda/"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const agendaOpen = agendaExpanded || currentPath.startsWith("/agenda/");
  const workspaceDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date());
  const userName = user?.name ?? "Usuario Horarius";
  const userEmail = user?.email ?? "usuario@horarius.com";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="relative flex min-h-screen bg-transparent lg:p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(89,184,171,0.14),transparent_65%)]" />

      <aside className="hidden lg:block lg:w-[18.5rem] xl:w-[19.5rem]">
        <div className="sticky top-4 h-[calc(100vh-2rem)] rounded-[2rem] border border-sidebar-border bg-[linear-gradient(180deg,rgba(12,15,17,0.98),rgba(18,24,28,0.94))] shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)]">
          <SidebarContent
            agendaExpanded={agendaExpanded}
            setAgendaExpanded={setAgendaExpanded}
            agendaOpen={agendaOpen}
            currentPath={currentPath}
            workspaceDate={workspaceDate}
            userName={userName}
            userEmail={userEmail}
            closeSidebar={closeSidebar}
            handleLogout={handleLogout}
          />
        </div>
      </aside>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-3 left-3 z-50 w-[min(21rem,calc(100vw-1.5rem))] rounded-[2rem] border border-sidebar-border bg-[linear-gradient(180deg,rgba(12,15,17,0.98),rgba(18,24,28,0.94))] shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] lg:hidden">
            <SidebarContent
              agendaExpanded={agendaExpanded}
              setAgendaExpanded={setAgendaExpanded}
              agendaOpen={agendaOpen}
              currentPath={currentPath}
              workspaceDate={workspaceDate}
              userName={userName}
              userEmail={userEmail}
              closeSidebar={closeSidebar}
              handleLogout={handleLogout}
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="px-4 pt-4 lg:hidden">
          <div className="flex items-center justify-between rounded-[1.5rem] border border-white/70 bg-white/70 px-4 py-3 shadow-[0_24px_60px_-34px_rgba(73,47,22,0.35)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(31,109,104,0.92))] text-primary-foreground shadow-[0_18px_38px_-20px_rgba(31,109,104,0.9)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">Studio planner</p>
                <h1 className="font-[var(--font-display)] text-2xl leading-none text-foreground">Horarius</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="border-white/70 bg-white/72"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden pb-24">
          <Outlet />
        </main>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => navigate("/agenda/timeline?novo=1")}
              className="fixed right-5 bottom-5 z-30 flex h-15 w-15 items-center justify-center rounded-[1.35rem] border border-white/65 bg-[linear-gradient(135deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_78%,black))] text-primary-foreground shadow-[0_28px_60px_-26px_rgba(31,109,104,0.92)] transition-transform duration-300 hover:-translate-y-1 lg:right-8 lg:bottom-8"
              aria-label="Novo agendamento"
            >
              <Plus className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={10}>
            Novo agendamento
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}


