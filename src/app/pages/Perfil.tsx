import { useEffect, useState, type FormEvent } from "react";
import { CreditCard, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { MetricCard, PageShell, SectionCard } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

type ProfileFormData = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
};

type ProfileFormErrors = {
  name?: string;
  email?: string;
  cpf?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
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

function validatePasswordStrength(value: string) {
  if (value.length < 8) {
    return "Use pelo menos 8 caracteres na senha.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Inclua ao menos uma letra maiúscula na senha.";
  }

  if (!/[a-z]/.test(value)) {
    return "Inclua ao menos uma letra minúscula na senha.";
  }

  if (!/\d/.test(value)) {
    return "Inclua ao menos um número na senha.";
  }

  return "";
}

function validateProfileForm(formData: ProfileFormData) {
  const errors: ProfileFormErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Informe seu nome.";
  }

  if (!formData.email.trim()) {
    errors.email = "O e-mail do usuário precisa estar preenchido.";
  }

  if (!formData.cpf.trim()) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(formData.cpf)) {
    errors.cpf = "Digite um CPF válido.";
  }

  if (!formData.password.trim()) {
    errors.password = "Informe uma nova senha.";
  } else {
    const passwordError = validatePasswordStrength(formData.password);

    if (passwordError) {
      errors.password = passwordError;
    }
  }

  if (!formData.confirmPassword.trim()) {
    errors.confirmPassword = "Confirme a nova senha.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "As senhas precisam ser iguais.";
  }

  if (Object.keys(errors).length > 0) {
    errors.submit = "Revise os campos destacados antes de salvar.";
  }

  return errors;
}

export function Perfil() {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((currentData) => ({
      ...currentData,
      name: user?.name ?? "",
      email: user?.email ?? "",
      cpf: formatCpf(user?.cpf ?? ""),
    }));
  }, [user]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
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
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateProfileForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage("");

    try {
      await updateUserProfile({
        name: formData.name.trim(),
        cpf: formData.cpf,
        password: formData.password,
      });

      setFormData((currentData) => ({
        ...currentData,
        password: "",
        confirmPassword: "",
      }));
      setSuccessMessage("Seus dados foram atualizados com sucesso.");
    } catch (error) {
      setFormErrors({
        submit: error instanceof Error ? error.message : "Não foi possível salvar agora.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStatus = formData.password ? "Preenchida" : "Pendente";

  return (
    <PageShell
      eyebrow="Conta"
      title="Minha conta"
      description="Atualize os dados da sua conta. O e-mail fica bloqueado e a senha precisa ser confirmada para salvar."
      actions={
        <Button type="submit" form="profile-form" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Conta logada"
          value="Ativa"
          helper="Esses dados aparecem no painel da conta atual."
          icon={<UserRound className="h-5 w-5" />}
        />
        <MetricCard
          label="E-mail"
          value="Bloqueado"
          helper="O e-mail do cadastro é exibido só para consulta."
          icon={<Mail className="h-5 w-5" />}
          accent="sand"
        />
        <MetricCard
          label="Nova senha"
          value={passwordStatus}
          helper="Preencha os dois campos abaixo para confirmar a troca."
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="coral"
        />
      </div>

      <form id="profile-form" noValidate onSubmit={handleSubmit} className="grid gap-6">
        {successMessage ? (
          <Alert className="border-primary/15 bg-primary/5">
            <AlertTitle>Perfil atualizado</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        {formErrors.submit ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Edição inválida</AlertTitle>
            <AlertDescription>{formErrors.submit}</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard
          title="Dados do usuário"
          description="Aqui você altera somente os dados da conta que está logada agora."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="profile-name">Nome</label>
              <Input
                id="profile-name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(formErrors.name)}
              />
              {formErrors.name ? (
                <p className="min-h-[1.25rem] text-sm text-destructive">{formErrors.name}</p>
              ) : (
                <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                  Nome exibido no painel da sua conta.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="profile-email">E-mail</label>
              <Input
                id="profile-email"
                type="email"
                value={formData.email}
                disabled
                readOnly
                aria-invalid={Boolean(formErrors.email)}
              />
              <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                Este campo não pode ser alterado nesta tela.
              </p>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="profile-cpf">CPF</label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(event) => handleChange("cpf", event.target.value)}
                  className="pl-11"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  aria-invalid={Boolean(formErrors.cpf)}
                />
              </div>
              {formErrors.cpf ? (
                <p className="min-h-[1.25rem] text-sm text-destructive">{formErrors.cpf}</p>
              ) : (
                <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                  Digite o CPF da conta sem mudar o e-mail cadastrado.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Segurança"
          description="Digite a nova senha e repita o mesmo valor no campo ao lado."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="profile-password">Nova senha</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  className="pl-11"
                  placeholder="Use 8+ caracteres, maiúscula e número"
                  autoComplete="new-password"
                  aria-invalid={Boolean(formErrors.password)}
                />
              </div>
              {formErrors.password ? (
                <p className="min-h-[1.25rem] text-sm text-destructive">{formErrors.password}</p>
              ) : (
                <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                  Use 8 ou mais caracteres, com letra maiúscula, minúscula e número.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="profile-confirm-password">Confirmar senha</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => handleChange("confirmPassword", event.target.value)}
                  className="pl-11"
                  placeholder="Repita exatamente a nova senha"
                  autoComplete="new-password"
                  aria-invalid={Boolean(formErrors.confirmPassword)}
                />
              </div>
              {formErrors.confirmPassword ? (
                <p className="min-h-[1.25rem] text-sm text-destructive">{formErrors.confirmPassword}</p>
              ) : (
                <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                  Digite novamente a nova senha.
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      </form>
    </PageShell>
  );
}
