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

export function validateServiceForm(formData: ServiceFormData) {
  const errors: ServiceFormErrors = {};
  const duration = Number(formData.durationMinutes);
  const price = Number(formData.price.replace(",", "."));

  if (!formData.name.trim()) {
    errors.name = "Informe o nome do servico.";
  }

  if (!formData.category.trim()) {
    errors.category = "Informe a categoria.";
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    errors.durationMinutes = "Informe uma duracao valida em minutos.";
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Informe um preco valido.";
  }

  if (!formData.description.trim()) {
    errors.description = "Escreva uma descricao curta do servico.";
  }

  return errors;
}


