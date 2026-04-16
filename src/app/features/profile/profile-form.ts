import { formatCpf, validateCpf } from "../../lib/cpf";
import type { AuthUser } from "../../lib/auth-storage";

export type ProfileFormData = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
};

export type ProfileFormErrors = {
  name?: string;
  email?: string;
  cpf?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
};

export function createEmptyProfileFormData(): ProfileFormData {
  return {
    name: "",
    email: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  };
}

export function createProfileFormData(user: AuthUser | null): ProfileFormData {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    cpf: formatCpf(user?.cpf ?? ""),
    password: "",
    confirmPassword: "",
  };
}

export function formatProfileField(field: keyof ProfileFormData, value: string) {
  return field === "cpf" ? formatCpf(value) : value;
}

export function validatePasswordStrength(value: string) {
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

export function validateProfileForm(formData: ProfileFormData) {
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
