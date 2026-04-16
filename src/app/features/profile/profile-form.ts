import { formatCpf, validateCpf } from "../../lib/cpf";
import {
  FIELD_LIMITS,
  normalizePasswordInput,
  normalizeSingleLineTextInput,
  validateTextField,
} from "../../lib/field-rules";
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
  switch (field) {
    case "name":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.profileName);
    case "cpf":
      return formatCpf(value);
    case "password":
    case "confirmPassword":
      return normalizePasswordInput(value);
    default:
      return value;
  }
}

export function validatePasswordStrength(value: string) {
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

export function validateProfileForm(formData: ProfileFormData) {
  const errors: ProfileFormErrors = {};
  const nameError = validateTextField(formData.name, {
    label: "O nome",
    maxLength: FIELD_LIMITS.profileName,
    minLength: 2,
  });

  if (nameError) {
    errors.name = nameError;
  }

  if (!formData.email.trim()) {
    errors.email = "O e-mail do usuário precisa estar preenchido.";
  }

  if (!formData.cpf.trim()) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(formData.cpf)) {
    errors.cpf = "Digite um CPF valido.";
  }

  if (!formData.password.trim()) {
    errors.password = "Informe uma nova senha.";
  } else if (formData.password.length > FIELD_LIMITS.password) {
    errors.password = `A senha deve ter no máximo ${FIELD_LIMITS.password} caracteres.`;
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
