import { formatCpf, validateCpf } from "../lib/cpf";
import {
  FIELD_LIMITS,
  normalizeDigitsInput,
  normalizeEmailInput,
  normalizeMultilineTextInput,
  normalizeSingleLineTextInput,
  validateEmailField,
  validatePhoneField,
  validateTextField,
} from "../lib/field-rules";

export type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  notes: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormData, string>>;

export function normalizePhone(value: string) {
  return normalizeDigitsInput(value, FIELD_LIMITS.phoneDigits);
}

export function formatPhone(value: string) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizeClientField(field: keyof ClientFormData, value: string) {
  switch (field) {
    case "name":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.clientName);
    case "email":
      return normalizeEmailInput(value);
    case "phone":
      return normalizePhone(value);
    case "cpf":
      return formatCpf(value);
    case "notes":
      return normalizeMultilineTextInput(value, FIELD_LIMITS.notes);
    default:
      return value;
  }
}

export function validateClientForm(formData: ClientFormData) {
  const errors: ClientFormErrors = {};
  const normalizedCpf = formData.cpf.trim();
  const nameError = validateTextField(formData.name, {
    label: "O nome do cliente",
    maxLength: FIELD_LIMITS.clientName,
    minLength: 2,
  });
  const emailError = validateEmailField(formData.email);
  const phoneError = validatePhoneField(formData.phone);
  const notesError = validateTextField(formData.notes, {
    label: "As observações",
    maxLength: FIELD_LIMITS.notes,
    minLength: 3,
    required: false,
  });

  if (nameError) {
    errors.name = nameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (phoneError) {
    errors.phone = phoneError;
  }

  if (notesError) {
    errors.notes = notesError;
  }

  if (normalizedCpf && !validateCpf(normalizedCpf)) {
    errors.cpf = "Digite um CPF valido.";
  }

  if (normalizedCpf && normalizedCpf.length > FIELD_LIMITS.cpfFormatted) {
    errors.cpf = `O CPF deve ter no máximo ${FIELD_LIMITS.cpfFormatted} caracteres.`;
  }

  return errors;
}


