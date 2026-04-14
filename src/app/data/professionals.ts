import { loadCollection, saveCollection } from "./crudStorage";

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

export function loadProfessionals() {
  return loadCollection(PROFESSIONALS_STORAGE_KEY, initialProfessionals).map((professional) =>
    normalizeProfessional(professional),
  );
}

export function syncProfessionalsBaseData(professionals: ProfessionalBaseData[]) {
  const currentProfessionals = loadProfessionals();
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

  saveCollection(PROFESSIONALS_STORAGE_KEY, nextProfessionals);

  return nextProfessionals;
}

export function getProfessionalById(professionalId: number) {
  return loadProfessionals().find((professional) => professional.id === professionalId) ?? null;
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

export function updateProfessionalWorkDays(professionalId: number, workDays: ProfessionalWorkDay[]) {
  const nextProfessionals = loadProfessionals().map((professional) =>
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

  saveCollection(PROFESSIONALS_STORAGE_KEY, nextProfessionals);
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
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.name.trim()) {
    errors.name = "Informe o nome do profissional.";
  }

  if (!formData.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!emailPattern.test(formData.email.trim())) {
    errors.email = "Digite um e-mail valido.";
  }

  if (formData.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Digite um telefone valido com DDD.";
  }

  if (!formData.specialty.trim()) {
    errors.specialty = "Informe a especialidade principal.";
  }

  return errors;
}
