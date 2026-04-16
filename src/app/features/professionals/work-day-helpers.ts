import {
  WEEK_DAYS,
  createDefaultWorkDays,
  type Professional,
  type ProfessionalWorkDay,
  type WeekDayKey,
} from "../../data/professionals";
import type { ProfessionalApiItem, ProfessionalWorkDayApiItem } from "../../services/professionals";

export function createProfessionalSnapshot(professional: Professional | null): ProfessionalApiItem | null {
  if (!professional) {
    return null;
  }

  return {
    id: professional.id,
    name: professional.name,
    email: professional.email,
    phone: professional.phone,
    specialty: professional.specialty,
    status: professional.status,
  };
}

export function createExpandedBreakMap(workDays: ProfessionalWorkDay[]) {
  return Object.fromEntries(workDays.map((workDay) => [workDay.day, false])) as Record<WeekDayKey, boolean>;
}

export function getProfessionalInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function mapWorkDaysFromApi(workDays: ProfessionalWorkDayApiItem[]): ProfessionalWorkDay[] {
  const workDaysByKey = new Map(
    workDays.map((workDay) => [
      workDay.dayOfWeek,
      {
        day: workDay.dayOfWeek as WeekDayKey,
        enabled: workDay.enabled,
        startTime: workDay.startTime || "09:00",
        endTime: workDay.endTime || "18:00",
        breakStart: workDay.breakStart ?? "",
        breakEnd: workDay.breakEnd ?? "",
      },
    ]),
  );

  return WEEK_DAYS.map(
    (day) =>
      workDaysByKey.get(day) ?? {
        day,
        enabled: false,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "",
        breakEnd: "",
      },
  );
}

export function createInitialWorkDays(professional: Professional | null) {
  return professional?.workDays ?? createDefaultWorkDays();
}
