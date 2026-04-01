import { createEntityId, loadCollection, saveCollection } from "./crudStorage";

export type ProfessionalStatus = "ativo" | "ferias";

export type WeekDayKey =
  | "domingo"
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado";

export type ProfessionalWorkDay = {
  day: WeekDayKey;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
};

export type Professional = {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: ProfessionalStatus;
  workDays: ProfessionalWorkDay[];
};

export type ProfessionalFormData = {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: ProfessionalStatus;
};

export type ProfessionalFormErrors = Partial<Record<keyof ProfessionalFormData, string>>;

export const PROFESSIONALS_STORAGE_KEY = "horarius:profissionais";

export const WEEK_DAYS: WeekDayKey[] = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

const initialProfessionals: Professional[] = [];

export function createDefaultWorkDays(): ProfessionalWorkDay[] {
  return WEEK_DAYS.map((day) => ({
    day,
    enabled: false,
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "",
    breakEnd: "",
  }));
}

function normalizeProfessional(professional: Partial<Professional> & { id: number }) {
  return {
    id: professional.id,
    name: professional.name ?? "",
    email: professional.email ?? "",
    phone: professional.phone ?? "",
    specialty: professional.specialty ?? "",
    status: professional.status === "ferias" ? "ferias" : "ativo",
    workDays: Array.isArray(professional.workDays) ? professional.workDays : createDefaultWorkDays(),
  } satisfies Professional;
}

export function loadProfessionals() {
  return loadCollection(PROFESSIONALS_STORAGE_KEY, initialProfessionals).map((professional) =>
    normalizeProfessional(professional),
  );
}

export function getProfessionalById(professionalId: number) {
  return loadProfessionals().find((professional) => professional.id === professionalId) ?? null;
}

export function createProfessional(formData: ProfessionalFormData) {
  const nextProfessional: Professional = {
    id: createEntityId(),
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.trim(),
    specialty: formData.specialty.trim(),
    status: formData.status,
    workDays: createDefaultWorkDays(),
  };

  saveCollection(PROFESSIONALS_STORAGE_KEY, [nextProfessional, ...loadProfessionals()]);
}

export function updateProfessional(professionalId: number, formData: ProfessionalFormData) {
  const nextProfessionals = loadProfessionals().map((professional) =>
    professional.id === professionalId
      ? {
          ...professional,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          specialty: formData.specialty.trim(),
          status: formData.status,
        }
      : professional,
  );

  saveCollection(PROFESSIONALS_STORAGE_KEY, nextProfessionals);
}

export function deleteProfessional(professionalId: number) {
  saveCollection(
    PROFESSIONALS_STORAGE_KEY,
    loadProfessionals().filter((professional) => professional.id !== professionalId),
  );
}

export function getActiveWorkDaysCount(professional: Pick<Professional, "workDays">) {
  return professional.workDays.filter((workDay) => workDay.enabled).length;
}

export function validateProfessionalForm(formData: ProfessionalFormData) {
  const errors: ProfessionalFormErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.name.trim()) {
    errors.name = "Informe o nome do profissional.";
  }

  if (!formData.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!emailPattern.test(formData.email.trim())) {
    errors.email = "Digite um e-mail válido.";
  }

  if (formData.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Digite um telefone válido com DDD.";
  }

  if (!formData.specialty.trim()) {
    errors.specialty = "Informe a especialidade principal.";
  }

  return errors;
}
