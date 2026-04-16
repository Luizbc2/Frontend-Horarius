import {
  FIELD_LIMITS,
  normalizeCurrencyInput,
  normalizeMultilineTextInput,
  normalizePositiveIntegerInput,
  normalizeSingleLineTextInput,
  parseCurrencyInput,
  validateCurrencyField,
  validatePositiveIntegerField,
  validateTextField,
} from "../lib/field-rules";

export type ServiceFormData = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  description: string;
};

export type ServiceFormErrors = Partial<Record<keyof ServiceFormData, string>>;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function normalizeServiceField(field: keyof ServiceFormData, value: string) {
  switch (field) {
    case "name":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.serviceName);
    case "category":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.serviceCategory);
    case "durationMinutes":
      return normalizePositiveIntegerInput(value, FIELD_LIMITS.serviceDurationDigits);
    case "price":
      return normalizeCurrencyInput(value);
    case "description":
      return normalizeMultilineTextInput(value, FIELD_LIMITS.serviceDescription);
    default:
      return value;
  }
}

export function validateServiceForm(formData: ServiceFormData) {
  const errors: ServiceFormErrors = {};
  const nameError = validateTextField(formData.name, {
    label: "O nome do servico",
    maxLength: FIELD_LIMITS.serviceName,
    minLength: 2,
  });
  const categoryError = validateTextField(formData.category, {
    label: "A categoria",
    maxLength: FIELD_LIMITS.serviceCategory,
    minLength: 2,
  });
  const durationError = validatePositiveIntegerField(formData.durationMinutes, "A duracao", 1440);
  const priceError = validateCurrencyField(formData.price, "O preco", 99999.99);
  const descriptionError = validateTextField(formData.description, {
    label: "A descricao",
    maxLength: FIELD_LIMITS.serviceDescription,
    minLength: 5,
  });

  if (nameError) {
    errors.name = nameError;
  }

  if (categoryError) {
    errors.category = categoryError;
  }

  if (durationError) {
    errors.durationMinutes = durationError;
  }

  if (priceError) {
    errors.price = priceError;
  }

  if (descriptionError) {
    errors.description = descriptionError;
  }

  return errors;
}

export function parseServicePrice(value: string) {
  return parseCurrencyInput(value);
}


