import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/agenda/timeline";

  if (isAuthenticated) {
    return <Navigate to="/agenda/timeline" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = "Digite um e-mail valido.";
    }

    if (!password.trim()) {
      nextErrors.password = "Informe sua senha.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(normalizedEmail, password);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Nao foi possivel entrar agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden px-4 py-6 lg:px-6 lg:py-8">
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(89,184,171,0.28),transparent_68%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(211,140,86,0.22),transparent_68%)] blur-2xl" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_28rem]">
        <section className="surface-panel flex min-h-[24rem] flex-col justify-between overflow-hidden rounded-[2rem] p-6 lg:p-8">
          <div className="max-w-2xl animate-fade-up">
            <span className="eyebrow">Acesso interno</span>
            <h1 className="page-title mt-5 max-w-xl">Entre para gerenciar agenda, equipe e operacao.</h1>
            <p className="page-description mt-5 max-w-xl">
              Esta primeira etapa do fluxo de autenticacao prepara a navegacao para login, persistencia local da sessao e saida segura da area logada.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_-34px_rgba(73,47,22,0.35)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(31,109,104,0.92))] text-primary-foreground">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-foreground">Agenda central</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A equipe entra no painel e segue direto para a rotina operacional.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_-34px_rgba(73,47,22,0.35)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(211,140,86,0.94),rgba(168,103,53,0.92))] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-foreground">Sessao persistida</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O acesso fica salvo localmente para voce nao voltar ao login a cada refresh.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_-34px_rgba(73,47,22,0.35)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(53,92,125,0.94),rgba(31,47,80,0.92))] text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl text-foreground">Fluxo preparado</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A base fica pronta para plugar sua API de autenticacao depois, sem refazer a navegacao.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-panel flex flex-col justify-center rounded-[2rem] p-6 lg:p-7">
          <div className="animate-fade-up animate-fade-up-delay-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Login
            </p>
            <h2 className="mt-3 text-3xl text-foreground">Acessar painel</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use seu e-mail e senha para abrir a area interna. Nesta fase, o acesso esta em modo local para encaixar o fluxo do front.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="login-email">E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  className="pl-11"
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                />
              </div>
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="login-password">Senha</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-11"
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                />
              </div>
              {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
            </div>

            {errors.submit ? (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertTitle>Falha no login</AlertTitle>
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? "Entrando..." : "Entrar"}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
