import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../auth/AuthContext";
import { ProfileIdentitySection } from "../components/profile/ProfileIdentitySection";
import { ProfileMetrics } from "../components/profile/ProfileMetrics";
import { ProfileSecuritySection } from "../components/profile/ProfileSecuritySection";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";

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
    return "Inclua ao menos uma letra maiuscula na senha.";
  }

  if (!/[a-z]/.test(value)) {
    return "Inclua ao menos uma letra minuscula na senha.";
  }

  if (!/\d/.test(value)) {
    return "Inclua ao menos um numero na senha.";
  }

  return "";
}

function validateProfileForm(formData: ProfileFormData) {
  const errors: ProfileFormErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Informe seu nome.";
  }

  if (!formData.email.trim()) {
    errors.email = "O e-mail do usuario precisa estar preenchido.";
  }

  if (!formData.cpf.trim()) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(formData.cpf)) {
    errors.cpf = "Digite um CPF valido.";
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
        submit: error instanceof Error ? error.message : "Nao foi possivel salvar agora.",
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
          {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      }
    >
      <ProfileMetrics passwordStatus={passwordStatus} />

      <form id="profile-form" noValidate onSubmit={handleSubmit} className="grid gap-6">
        {successMessage ? (
          <Alert className="border-primary/15 bg-primary/5">
            <AlertTitle>Perfil atualizado</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        {formErrors.submit ? (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Edicao invalida</AlertTitle>
            <AlertDescription>{formErrors.submit}</AlertDescription>
          </Alert>
        ) : null}

        <ProfileIdentitySection
          name={formData.name}
          email={formData.email}
          cpf={formData.cpf}
          nameError={formErrors.name}
          cpfError={formErrors.cpf}
          onChange={(field, value) => handleChange(field, value)}
        />

        <ProfileSecuritySection
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          passwordError={formErrors.password}
          confirmPasswordError={formErrors.confirmPassword}
          onChange={(field, value) => handleChange(field, value)}
        />
      </form>
    </PageShell>
  );
}


