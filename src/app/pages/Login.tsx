import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { useAuth } from "../auth/AuthContext";
import { AuthShowcasePanel } from "../components/auth/AuthShowcasePanel";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

const loginFeatures = [
  {
    icon: CalendarDays,
    title: "Agenda central",
    description: "Veja os compromissos do dia e ajuste a operacao sem trocar de tela.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(31,109,104,0.92))] text-primary-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Nao desloga do seu navegador",
    description: "O acesso continua salvo no navegador para voce voltar ao painel depois.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(211,140,86,0.94),rgba(168,103,53,0.92))] text-white",
  },
  {
    icon: LockKeyhole,
    title: "So realizar o registro uma vez",
    description: "Apos o cadastro, voce pode acessar o painel sem precisar se registrar novamente.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(53,92,125,0.94),rgba(31,47,80,0.92))] text-white",
  },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState(() => {
    if (
      typeof location.state === "object" &&
      location.state !== null &&
      "registeredEmail" in location.state &&
      typeof location.state.registeredEmail === "string"
    ) {
      return location.state.registeredEmail;
    }

    return "";
  });
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
  const successNotice =
    typeof location.state === "object" &&
    location.state !== null &&
    "notice" in location.state &&
    typeof location.state.notice === "string"
      ? location.state.notice
      : "";

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
        <AuthShowcasePanel
          eyebrow="Painel do studio"
          title="Seu dia comeca aqui, antes da primeira cadeira ocupar."
          description="Entre para acompanhar agenda, equipe, servicos e tudo que move a rotina do studio em um so lugar."
          features={loginFeatures}
        />

        <section className="surface-panel flex flex-col justify-center rounded-[2rem] p-6 lg:p-7">
          <div className="animate-fade-up animate-fade-up-delay-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Login
            </p>
            <h2 className="mt-3 text-3xl text-foreground">Entrar no Horarius</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use seu e-mail e sua senha para continuar de onde parou.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-4">
            {successNotice ? (
              <Alert className="border-primary/15 bg-primary/5">
                <AlertTitle>Cadastro concluido</AlertTitle>
                <AlertDescription>{successNotice}</AlertDescription>
              </Alert>
            ) : null}

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

            <Button asChild type="button" variant="ghost" className="w-full">
              <Link to="/cadastro">Primeiro acesso? Criar conta</Link>
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}


