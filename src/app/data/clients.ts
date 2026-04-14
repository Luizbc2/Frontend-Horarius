export type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormData, string>>;

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
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

export function validateClientForm(formData: ClientFormData) {
  const errors: ClientFormErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.name.trim()) {
    errors.name = "Informe o nome do cliente.";
  }

  if (!formData.email.trim()) {
    errors.email = "Informe o e-mail do cliente.";
  } else if (!emailPattern.test(formData.email.trim())) {
    errors.email = "Digite um e-mail valido.";
  }

  if (normalizePhone(formData.phone).length < 10) {
    errors.phone = "Digite um telefone valido com DDD.";
  }

  if (!formData.notes.trim()) {
    errors.notes = "Escreva uma observacao para o cadastro.";
  }

  return errors;
}


