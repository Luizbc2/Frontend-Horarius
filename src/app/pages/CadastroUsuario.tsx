import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, CreditCard, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AuthShowcasePanel } from "../components/auth/AuthShowcasePanel";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { signupWithApi } from "../services/auth";
import { ApiError } from "../lib/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupFormData = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = {
  name?: string;
  email?: string;
  cpf?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
};

const signupFeatures = [
  {
    icon: UserRound,
    title: "Dados bÃ¡sicos",
    description: "Nome, e-mail, CPF e senha em um fluxo direto, sem excesso de etapas.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(89,184,171,0.96),rgba(31,109,104,0.92))] text-primary-foreground",
  },
  {
    icon: CalendarDays,
    title: "Fluxo separado",
    description: "Cadastro e entrada ficam separados para deixar a experiÃªncia mais clara desde o comeÃ§o.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(211,140,86,0.94),rgba(168,103,53,0.92))] text-white",
  },
  {
    icon: ArrowRight,
    title: "Volta ao login",
    description: "Depois do cadastro, o usuÃ¡rio retorna ao login para acessar o painel.",
    iconClassName:
      "bg-[linear-gradient(135deg,rgba(53,92,125,0.94),rgba(31,47,80,0.92))] text-white",
  },
];

const initialFormData: SignupFormData = {
  name: "",
  email: "",
  cpf: "",
  password: "",
  confirmPassword: "",
};

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatCpf(value: string) {
  const digits = normalizeCpf(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCpf(value: string) {
  const digits = normalizeCpf(value);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);

  const firstCheck = numbers
    .slice(0, 9)
    .reduce((total, digit, index) => total + digit * (10 - index), 0);
  const firstRemainder = (firstCheck * 10) % 11;
  const firstDigit = firstRemainder === 10 ? 0 : firstRemainder;

  if (firstDigit !== numbers[9]) {
    return false;
  }

  const secondCheck = numbers
    .slice(0, 10)
    .reduce((total, digit, index) => total + digit * (11 - index), 0);
  const secondRemainder = (secondCheck * 10) % 11;
  const secondDigit = secondRemainder === 10 ? 0 : secondRemainder;

  return secondDigit === numbers[10];
}

function validateSignupForm(formData: SignupFormData) {
  const errors: SignupFormErrors = {};
  const trimmedName = formData.name.trim();
  const normalizedEmail = formData.email.trim().toLowerCase();
  const normalizedCpf = normalizeCpf(formData.cpf);

  if (!trimmedName) {
    errors.name = "Informe seu nome.";
  }

  if (!normalizedEmail) {
    errors.email = "Informe seu e-mail.";
  } else if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Digite um e-mail vÃ¡lido.";
  }

  if (!normalizedCpf) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(normalizedCpf)) {
    errors.cpf = "Digite um CPF vÃ¡lido.";
  }

  if (!formData.password.trim()) {
    errors.password = "Informe uma senha.";
  }

  if (!formData.confirmPassword.trim()) {
    errors.confirmPassword = "Repita sua senha.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "As senhas precisam ser iguais.";
  }

  if (Object.keys(errors).length > 0) {
    errors.submit = "Revise os campos destacados antes de continuar.";
  }

  return errors;
}

function mapSignupSuccessMessage(message: string) {
  if (message === "User registered successfully.") {
    return "Conta criada com sucesso. Agora voce ja pode entrar no painel.";
  }

  return message;
}

function mapSignupApiError(error: unknown): SignupFormErrors {
  if (!(error instanceof ApiError)) {
    return {
      submit: error instanceof Error ? error.message : "Nao foi possivel concluir o cadastro agora.",
    };
  }

  switch (error.message) {
    case "Email is already in use.":
      return {
        email: "Este e-mail ja esta em uso.",
        submit: "Use outro e-mail para continuar.",
      };
    case "CPF is already in use.":
      return {
        cpf: "Este CPF ja esta em uso.",
        submit: "Revise o CPF informado para continuar.",
      };
    case "Invalid email format.":
      return {
        email: "Digite um e-mail valido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    case "Invalid CPF.":
      return {
        cpf: "Digite um CPF valido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    default:
      return {
        submit: error.message || "Nao foi possivel concluir o cadastro agora.",
      };
  }
}

export function CadastroUsuario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
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

    const signupPayload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      cpf: normalizeCpf(formData.cpf),
      password: formData.password,
    };

    try {
      const response = await signupWithApi(signupPayload);

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
          title="Crie sua conta e deixe o painel pronto para rodar com você."
          description="O cadastro organiza os dados básicos de quem vai usar o sistema e prepara a entrada no painel logo em seguida."
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
