import type { AppointmentApiItem } from "../../services/appointments";
import type { AppointmentStatus } from "../../types/entities";

export type TimelineAppointment = {
  id: number;
  clientId: number;
  time: string;
  client: string;
  serviceId: number;
  service: string;
  durationMinutes: number;
  professionalId: string;
  status: AppointmentStatus;
  notes: string;
};

export type AppointmentDraft = {
  client: string;
  service: string;
  time: string;
  professionalId: string;
  status: AppointmentStatus;
};

export type NewAppointmentDraft = {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCpf: string;
  serviceId: string;
  time: string;
  professionalId: string;
  status: AppointmentStatus;
};

export const DAY_START_HOUR = 9;
export const DAY_END_HOUR = 19;
export const SLOT_INTERVAL_MINUTES = 10;
export const SLOT_HEIGHT = 34;
export const APPOINTMENT_DURATION_IN_MINUTES = 30;

export const timelineStatusStyles: Record<
  AppointmentStatus,
  { card: string; badge: string; label: string }
> = {
  confirmado: {
    card: "border-emerald-300 bg-emerald-100/90",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    label: "Confirmado",
  },
  pendente: {
    card: "border-amber-300 bg-amber-100/90",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    label: "Pendente",
  },
  cancelado: {
    card: "border-rose-300 bg-rose-100/90",
    badge: "border-rose-300 bg-rose-50 text-rose-700",
    label: "Cancelado",
  },
};

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function padTime(value: number) {
  return String(value).padStart(2, "0");
}

export function generateTimeSlots() {
  const slots: string[] = [];
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;

  for (let minutes = 0; minutes < totalMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    const hour = DAY_START_HOUR + Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${padTime(hour)}:${padTime(minute)}`);
  }

  return slots;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatDateForApi(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = padTime(date.getMonth() + 1);
  const day = padTime(date.getDate());

  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function formatAppointmentTime(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function buildScheduledAt(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const scheduledDate = new Date(date);

  scheduledDate.setHours(hours, minutes, 0, 0);
  return scheduledDate.toISOString();
}

export function createAppointmentDraft(): AppointmentDraft {
  return {
    client: "",
    service: "",
    time: "09:00",
    professionalId: "",
    status: "confirmado",
  };
}

export function createNewAppointmentDraft(selectedProfessional = ""): NewAppointmentDraft {
  return {
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCpf: "",
    serviceId: "",
    time: "09:00",
    professionalId: selectedProfessional,
    status: "confirmado",
  };
}

export function mapTimelineAppointment(appointment: AppointmentApiItem): TimelineAppointment {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    time: formatAppointmentTime(appointment.scheduledAt),
    client: appointment.clientName,
    serviceId: appointment.serviceId,
    service: appointment.serviceName,
    durationMinutes: APPOINTMENT_DURATION_IN_MINUTES,
    professionalId: String(appointment.professionalId),
    status: appointment.status,
    notes: appointment.notes,
  };
}

export function applyServiceDurationsToAppointments(
  appointments: TimelineAppointment[],
  serviceDurations: Map<number, number>,
) {
  return appointments.map((appointment) => ({
    ...appointment,
    durationMinutes:
      serviceDurations.get(appointment.serviceId) ?? appointment.durationMinutes ?? APPOINTMENT_DURATION_IN_MINUTES,
  }));
}
