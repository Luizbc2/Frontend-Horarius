export const FIELD_LIMITS = {
  clientName: 120,
  email: 120,
  notes: 500,
  password: 72,
  phoneDigits: 11,
  phoneFormatted: 15,
  cpfDigits: 11,
  cpfFormatted: 14,
  profileName: 120,
  professionalName: 120,
  specialty: 80,
  serviceCategory: 80,
  serviceDescription: 500,
  serviceDurationDigits: 4,
  serviceName: 120,
  servicePrice: 9,
  userName: 120,
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidateTextOptions = {
  label: string;
  maxLength: number;
  minLength?: number;
  required?: boolean;
};

export function normalizeSingleLineTextInput(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").replace(/^\s+/, "").slice(0, maxLength);
}

export function normalizeMultilineTextInput(value: string, maxLength: number) {
  return value.replace(/\r\n/g, "\n").slice(0, maxLength);
}

export function normalizeEmailInput(value: string) {
  return value.replace(/\s/g, "").slice(0, FIELD_LIMITS.email);
}

export function normalizePasswordInput(value: string) {
  return value.slice(0, FIELD_LIMITS.password);
}

export function normalizeDigitsInput(value: string, maxDigits: number) {
  return value.replace(/\D/g, "").slice(0, maxDigits);
}

export function normalizePositiveIntegerInput(value: string, maxDigits: number) {
  return normalizeDigitsInput(value, maxDigits);
}

export function normalizeCurrencyInput(value: string) {
  const sanitizedValue = value.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const [integerPart = "", ...decimalParts] = sanitizedValue.split(",");
  const normalizedInteger = integerPart.slice(0, FIELD_LIMITS.servicePrice - 3);
  const normalizedDecimal = decimalParts.join("").slice(0, 2);

  if (!normalizedDecimal && !sanitizedValue.includes(",")) {
    return normalizedInteger;
  }

  return `${normalizedInteger},${normalizedDecimal}`;
}

export function parseCurrencyInput(value: string) {
  return Number(value.replace(",", "."));
}

export function validateTextField(value: string, options: ValidateTextOptions) {
  const { label, maxLength, minLength = 1, required = true } = options;
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return required ? `Informe ${label.toLowerCase()}.` : undefined;
  }

  if (trimmedValue.length < minLength) {
    return `${label} precisa ter pelo menos ${minLength} caracteres.`;
  }

  if (trimmedValue.length > maxLength) {
    return `${label} deve ter no máximo ${maxLength} caracteres.`;
  }

  return undefined;
}

export function validateEmailField(value: string, required = true) {
  const normalizedEmail = value.trim().toLowerCase();

  if (!normalizedEmail) {
    return required ? "Informe um e-mail valido." : undefined;
  }

  if (normalizedEmail.length > FIELD_LIMITS.email) {
    return `O e-mail deve ter no máximo ${FIELD_LIMITS.email} caracteres.`;
  }

  if (!emailPattern.test(normalizedEmail)) {
    return "Digite um e-mail valido.";
  }

  return undefined;
}

export function validatePhoneField(value: string, required = true) {
  const digits = normalizeDigitsInput(value, FIELD_LIMITS.phoneDigits);

  if (!digits) {
    return required ? "Digite um telefone valido com DDD." : undefined;
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return "Digite um telefone valido com DDD.";
  }

  return undefined;
}

export function validatePositiveIntegerField(value: string, label: string, maxValue?: number) {
  if (!value.trim()) {
    return `Informe ${label.toLowerCase()}.`;
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return `${label} precisa ser um número inteiro maior que zero.`;
  }

  if (maxValue !== undefined && numericValue > maxValue) {
    return `${label} deve ser no máximo ${maxValue}.`;
  }

  return undefined;
}

export function validateCurrencyField(value: string, label: string, maxValue?: number) {
  if (!value.trim()) {
    return `Informe ${label.toLowerCase()}.`;
  }

  const numericValue = parseCurrencyInput(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return `${label} deve ser um valor positivo ou zero.`;
  }

  if (maxValue !== undefined && numericValue > maxValue) {
    return `${label} deve ser no máximo ${maxValue}.`;
  }

  return undefined;
}
