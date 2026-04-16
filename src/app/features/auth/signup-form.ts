import { getApiErrorMessage, isApiErrorWithStatus } from "../../lib/api-error";
import { normalizeCpf, validateCpf } from "../../lib/cpf";
import type { SignupRequest } from "../../services/auth";
import type { ApiErrorInput } from "../../types/http";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const normalizedEmail = formData.email.trim().toLowerCase();
  const normalizedCpf = normalizeCpf(formData.cpf);

  if (!trimmedName) {
    errors.name = "Informe seu nome.";
  }

  if (!normalizedEmail) {
    errors.email = "Informe seu e-mail.";
  } else if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Digite um e-mail valido.";
  }

  if (!normalizedCpf) {
    errors.cpf = "Informe seu CPF.";
  } else if (!validateCpf(normalizedCpf)) {
    errors.cpf = "Digite um CPF valido.";
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

export function createSignupPayload(formData: SignupFormData): SignupRequest {
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    cpf: normalizeCpf(formData.cpf),
    password: formData.password,
  };
}

export function mapSignupSuccessMessage(message: string) {
  if (message === "Usuario cadastrado com sucesso.") {
    return "Conta criada com sucesso. Agora voce ja pode entrar no painel.";
  }

  return message;
}

export function mapSignupApiError(error: ApiErrorInput): SignupFormErrors {
  const message = getApiErrorMessage(error, "Nao foi possivel concluir o cadastro agora.");

  if (isApiErrorWithStatus(error, 409) && message === "E-mail ja esta em uso.") {
    return {
      email: "Este e-mail ja esta em uso.",
      submit: "Use outro e-mail para continuar.",
    };
  }

  if (isApiErrorWithStatus(error, 409) && message === "CPF ja esta em uso.") {
    return {
      cpf: "Este CPF ja esta em uso.",
      submit: "Revise o CPF informado para continuar.",
    };
  }

  switch (message) {
    case "Formato de e-mail invalido.":
      return {
        email: "Digite um e-mail valido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    case "CPF invalido.":
      return {
        cpf: "Digite um CPF valido.",
        submit: "Revise os campos destacados antes de continuar.",
      };
    default:
      return {
        submit: message,
      };
  }
}
