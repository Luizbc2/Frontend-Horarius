import { getApiErrorMessage, isApiErrorWithStatus } from "../../lib/api-error";
import { normalizeCpf, validateCpf } from "../../lib/cpf";
import { FIELD_LIMITS, validateEmailField, validateTextField } from "../../lib/field-rules";
import type { SignupRequest } from "../../services/auth";
import type { ApiErrorInput } from "../../types/http";

export type SignupFormData = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
};

export type SignupFormErrors = {
  name?: string;
  email?: string;
  cpf?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
};

export const initialSignupFormData: SignupFormData = {
  name: "",
  email: "",
  cpf: "",
  password: "",
  confirmPassword: "",
};

export function validateSignupForm(formData: SignupFormData) {
  const errors: SignupFormErrors = {};
  const trimmedName = formData.name.trim();
  const normalizedCpf = normalizeCpf(formData.cpf);
  const nameError = validateTextField(trimmedName, {
    label: "O nome",
    maxLength: FIELD_LIMITS.userName,
    minLength: 2,
  });
  const emailError = validateEmailField(formData.email);

  if (nameError) {
    errors.name = nameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (!normalizedCpf) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(normalizedCpf)) {
    errors.cpf = "Digite um CPF válido.";
  }

  if (!formData.password.trim()) {
    errors.password = "Informe uma senha.";
  } else if (formData.password.length > FIELD_LIMITS.password) {
    errors.password = `A senha deve ter no máximo ${FIELD_LIMITS.password} caracteres.`;
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

export function createSignupPayload(formData: SignupFormData): SignupRequest {
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    cpf: normalizeCpf(formData.cpf),
    password: formData.password,
  };
}

export function mapSignupSuccessMessage(message: string) {
  if (message === "Usuário cadastrado com sucesso.") {
    return "Conta criada com sucesso. Agora você já pode entrar no painel.";
  }

  return message;
}

export function mapSignupApiError(error: ApiErrorInput): SignupFormErrors {
  const message = getApiErrorMessage(error, "Não foi possível concluir o cadastro agora.");

  if (isApiErrorWithStatus(error, 409) && message === "E-mail já está em uso.") {
    return {
      email: "Este e-mail já está em uso.",
      submit: "Use outro e-mail para continuar.",
    };
  }

  if (isApiErrorWithStatus(error, 409) && message === "CPF já está em uso.") {
    return {
      cpf: "Este CPF já está em uso.",
      submit: "Revise o CPF informado para continuar.",
    };
  }

  switch (message) {
    case "Formato de e-mail inválido.":
      return {
        email: "Digite um e-mail válido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    case "CPF inválido.":
      return {
        cpf: "Digite um CPF válido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    default:
      return {
        submit: message,
      };
  }
}
