import { createEntityId, loadCollection, saveCollection } from "./crudStorage";

export type Service = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type ServiceFormData = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  description: string;
};

export type ServiceFormErrors = Partial<Record<keyof ServiceFormData, string>>;

export const SERVICES_STORAGE_KEY = "horarius:servicos";

const initialServices: Service[] = [
  {
    id: 1,
    name: "Corte simples",
    category: "Corte",
    durationMinutes: 30,
    price: 35,
    description: "Corte tradicional com finalizacao basica.",
  },
  {
    id: 2,
    name: "Corte e barba",
    category: "Combo",
    durationMinutes: 50,
    price: 60,
    description: "Atendimento completo com corte, barba e acabamento.",
  },
  {
    id: 3,
    name: "Pigmentacao",
    category: "Acabamento",
    durationMinutes: 25,
    price: 30,
    description: "Pigmentacao discreta para barba ou cabelo.",
  },
];

export function loadServices() {
  return loadCollection(SERVICES_STORAGE_KEY, initialServices);
}

export function getServiceById(serviceId: number) {
  return loadServices().find((service) => service.id === serviceId) ?? null;
}

export function createService(formData: ServiceFormData) {
  const nextService: Service = {
    id: createEntityId(),
    name: formData.name.trim(),
    category: formData.category.trim(),
    durationMinutes: Number(formData.durationMinutes),
    price: Number(formData.price.replace(",", ".")),
    description: formData.description.trim(),
  };

  saveCollection(SERVICES_STORAGE_KEY, [nextService, ...loadServices()]);
}

export function updateService(serviceId: number, formData: ServiceFormData) {
  const nextServices = loadServices().map((service) =>
    service.id === serviceId
      ? {
          ...service,
          name: formData.name.trim(),
          category: formData.category.trim(),
          durationMinutes: Number(formData.durationMinutes),
          price: Number(formData.price.replace(",", ".")),
          description: formData.description.trim(),
        }
      : service,
  );

  saveCollection(SERVICES_STORAGE_KEY, nextServices);
}

export function deleteService(serviceId: number) {
  saveCollection(
    SERVICES_STORAGE_KEY,
    loadServices().filter((service) => service.id !== serviceId),
  );
}

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


