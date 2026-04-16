import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, CreditCard, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AuthShowcasePanel } from "../components/auth/AuthShowcasePanel";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { formatCpf } from "../lib/cpf";
import {
  createSignupPayload,
  initialSignupFormData,
  mapSignupApiError,
  mapSignupSuccessMessage,
  type SignupFormData,
  type SignupFormErrors,
  validateSignupForm,
} from "../features/auth/signup-form";
import { signupWithApi } from "../services/auth";

const signupFeatures = [
  {
    icon: UserRound,
    title: "Dados basicos",
    description: "Nome, e-mail, CPF e senha em um fluxo direto, sem excesso de etapas.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(31,109,104,0.92))] text-primary-foreground",
  },
  {
    icon: CalendarDays,
    title: "Fluxo separado",
    description: "Cadastro e entrada ficam separados para deixar a experiencia mais clara desde o comeco.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(211,140,86,0.94),rgba(168,103,53,0.92))] text-white",
  },
  {
    icon: ArrowRight,
    title: "Volta ao login",
    description: "Depois do cadastro, o usuario retorna ao login para acessar o painel.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(53,92,125,0.94),rgba(31,47,80,0.92))] text-white",
  },
];

export function CadastroUsuario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>(initialSignupFormData);
  const [formErrors, setFormErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof SignupFormData, value: string) => {
    const nextValue = field === "cpf" ? formatCpf(value) : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      submit: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateSignupForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const response = await signupWithApi(createSignupPayload(formData));

      navigate("/login", {
        replace: true,
        state: {
          notice: mapSignupSuccessMessage(response.message),
          registeredEmail: response.user.email,
        },
      });
    } catch (error) {
      setFormErrors(mapSignupApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden px-4 py-6 lg:px-6 lg:py-8">
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(89,184,171,0.24),transparent_68%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(211,140,86,0.18),transparent_68%)] blur-2xl" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_30rem]">
        <AuthShowcasePanel
          eyebrow="Primeiro acesso"
          title="Crie sua conta e deixe o painel pronto para rodar com voce."
          description="O cadastro organiza os dados basicos de quem vai usar o sistema e prepara a entrada no painel logo em seguida."
          features={signupFeatures}
        />

        <section className="surface-panel flex flex-col justify-center rounded-[2rem] p-6 lg:p-7">
          <div className="animate-fade-up animate-fade-up-delay-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Cadastro
            </p>
            <h2 className="mt-3 text-3xl text-foreground">Criar conta</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Preencha seus dados para liberar o acesso ao painel do Horarius.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="signup-name">Nome</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Ex.: Luiz Otavio"
                  className="pl-11"
                  autoComplete="name"
                  aria-invalid={Boolean(formErrors.name)}
                />
              </div>
              {formErrors.name ? <p className="text-sm text-destructive">{formErrors.name}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="signup-email">E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="voce@empresa.com"
                  className="pl-11"
                  autoComplete="email"
                  aria-invalid={Boolean(formErrors.email)}
                />
              </div>
              {formErrors.email ? <p className="text-sm text-destructive">{formErrors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="signup-cpf">CPF</label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(event) => handleChange("cpf", event.target.value)}
                  placeholder="000.000.000-00"
                  className="pl-11"
                  inputMode="numeric"
                  aria-invalid={Boolean(formErrors.cpf)}
                />
              </div>
              {formErrors.cpf ? <p className="text-sm text-destructive">{formErrors.cpf}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="signup-password">Senha</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    placeholder="Crie uma senha"
                    className="pl-11"
                    autoComplete="new-password"
                    aria-invalid={Boolean(formErrors.password)}
                  />
                </div>
                {formErrors.password ? <p className="text-sm text-destructive">{formErrors.password}</p> : null}
              </div>

              <div className="grid gap-2">
                <label htmlFor="signup-confirm-password">Confirmar senha</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => handleChange("confirmPassword", event.target.value)}
                    placeholder="Repita a senha"
                    className="pl-11"
                    autoComplete="new-password"
                    aria-invalid={Boolean(formErrors.confirmPassword)}
                  />
                </div>
                {formErrors.confirmPassword ? (
                  <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
                ) : null}
              </div>
            </div>

            {formErrors.submit ? (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertTitle>Nao foi possivel concluir o cadastro</AlertTitle>
                <AlertDescription>{formErrors.submit}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-2 grid gap-3">
              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Salvando..." : "Criar conta"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>

              <Button asChild type="button" variant="ghost" className="w-full">
                <Link to="/login">Ja tenho conta</Link>
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


