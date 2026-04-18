import { loadCollection, saveCollection } from "./crudStorage";
import {
  FIELD_LIMITS,
  normalizeEmailInput,
  normalizeSingleLineTextInput,
  validateEmailField,
  validatePhoneField,
  validateTextField,
} from "../lib/field-rules";
import { normalizePhone } from "./clients";

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

export type ProfessionalBaseData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
};

export const PROFESSIONALS_STORAGE_KEY = "horarius:profissionais";

function getProfessionalsStorageKey(userId: number) {
  return `${PROFESSIONALS_STORAGE_KEY}:${userId}`;
}

export const WEEK_DAYS: WeekDayKey[] = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

export const WEEK_DAY_LABELS: Record<WeekDayKey, string> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terca",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sabado",
};

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

export function loadProfessionals(userId: number) {
  return loadCollection(getProfessionalsStorageKey(userId), initialProfessionals).map((professional) =>
    normalizeProfessional(professional),
  );
}

export function syncProfessionalsBaseData(userId: number, professionals: ProfessionalBaseData[]) {
  const currentProfessionals = loadProfessionals(userId);
  const currentProfessionalsById = new Map(
    currentProfessionals.map((professional) => [professional.id, professional]),
  );

  const nextProfessionals = professionals.map((professional) => {
    const existingProfessional = currentProfessionalsById.get(professional.id);

    return normalizeProfessional({
      ...professional,
      workDays: existingProfessional?.workDays ?? createDefaultWorkDays(),
    });
  });

  saveCollection(getProfessionalsStorageKey(userId), nextProfessionals);

  return nextProfessionals;
}

export function getProfessionalById(userId: number, professionalId: number) {
  return loadProfessionals(userId).find((professional) => professional.id === professionalId) ?? null;
}

export function updateProfessional(userId: number, professionalId: number, formData: ProfessionalFormData) {
  const nextProfessionals = loadProfessionals(userId).map((professional) =>
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

  saveCollection(getProfessionalsStorageKey(userId), nextProfessionals);
}

export function updateProfessionalWorkDays(
  userId: number,
  professionalId: number,
  workDays: ProfessionalWorkDay[],
) {
  const nextProfessionals = loadProfessionals(userId).map((professional) =>
    professional.id === professionalId
      ? {
          ...professional,
          workDays: workDays.map((workDay) => ({
            ...workDay,
            startTime: workDay.startTime || "09:00",
            endTime: workDay.endTime || "18:00",
            breakStart: workDay.breakStart || "",
            breakEnd: workDay.breakEnd || "",
          })),
        }
      : professional,
  );

  saveCollection(getProfessionalsStorageKey(userId), nextProfessionals);
}

export function getActiveWorkDaysCount(professional: Pick<Professional, "workDays">) {
  return professional.workDays.filter((workDay) => workDay.enabled).length;
}

export function getActiveWorkDaysSummary(professional: Pick<Professional, "workDays">) {
  const activeDays = professional.workDays.filter((workDay) => workDay.enabled);

  if (activeDays.length === 0) {
    return "Sem dias ativos";
  }

  return activeDays.map((workDay) => WEEK_DAY_LABELS[workDay.day]).join(", ");
}

export function validateProfessionalWorkDays(workDays: ProfessionalWorkDay[]) {
  for (const workDay of workDays) {
    if (!workDay.enabled) {
      continue;
    }

    if (!workDay.startTime || !workDay.endTime) {
      return `Preencha a entrada e a saida de ${WEEK_DAY_LABELS[workDay.day]}.`;
    }

    if (workDay.endTime <= workDay.startTime) {
      return `Em ${WEEK_DAY_LABELS[workDay.day]}, a saida precisa ser depois da entrada.`;
    }

    const hasBreakStart = Boolean(workDay.breakStart);
    const hasBreakEnd = Boolean(workDay.breakEnd);

    if (hasBreakStart !== hasBreakEnd) {
      return `Se for usar pausa em ${WEEK_DAY_LABELS[workDay.day]}, preencha inicio e fim.`;
    }

    if (hasBreakStart && hasBreakEnd) {
      if (workDay.breakEnd <= workDay.breakStart) {
        return `Em ${WEEK_DAY_LABELS[workDay.day]}, o fim da pausa precisa ser depois do inicio.`;
      }

      if (workDay.breakStart <= workDay.startTime || workDay.breakEnd >= workDay.endTime) {
        return `A pausa de ${WEEK_DAY_LABELS[workDay.day]} precisa ficar dentro do horario de trabalho.`;
      }
    }
  }

  return null;
}

export function validateProfessionalForm(formData: ProfessionalFormData) {
  const errors: ProfessionalFormErrors = {};
  const nameError = validateTextField(formData.name, {
    label: "O nome do profissional",
    maxLength: FIELD_LIMITS.professionalName,
    minLength: 2,
  });
  const emailError = validateEmailField(formData.email);
  const phoneError = validatePhoneField(formData.phone);
  const specialtyError = validateTextField(formData.specialty, {
    label: "A especialidade",
    maxLength: FIELD_LIMITS.specialty,
    minLength: 2,
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

  if (specialtyError) {
    errors.specialty = specialtyError;
  }

  return errors;
}

export function normalizeProfessionalField(field: keyof ProfessionalFormData, value: string) {
  switch (field) {
    case "name":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.professionalName);
    case "email":
      return normalizeEmailInput(value);
    case "phone":
      return normalizePhone(value);
    case "specialty":
      return normalizeSingleLineTextInput(value, FIELD_LIMITS.specialty);
    default:
      return value;
  }
}
