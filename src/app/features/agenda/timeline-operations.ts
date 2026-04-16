import type { CreateAppointmentRequest, UpdateAppointmentRequest } from "../../services/appointments";
import type { CreateClientRequest } from "../../services/clients";
import { normalizeCpf } from "../../lib/cpf";
import { FIELD_LIMITS, validateTextField } from "../../lib/field-rules";
import { normalizePhone } from "../../data/clients";
import {
  APPOINTMENT_DURATION_IN_MINUTES,
  DAY_END_HOUR,
  buildScheduledAt,
  timeToMinutes,
  type AppointmentDraft,
  type NewAppointmentDraft,
  type TimelineAppointment,
} from "./timeline-helpers";

type TimelineSlot = {
  professionalId: string;
  time: string;
};

type TimelineConflictInput = {
  appointments: TimelineAppointment[];
  durationMinutes?: number;
  excludedAppointmentId?: number;
  slot: TimelineSlot;
};

type TimelineEditInput = {
  appointments: TimelineAppointment[];
  appointmentId: number;
  draft: AppointmentDraft;
  normalizedClient: string;
  normalizedService: string;
};

export function createTimelineEditDraft(appointment: TimelineAppointment): AppointmentDraft {
  return {
    client: appointment.client,
    service: appointment.service,
    time: appointment.time,
    professionalId: appointment.professionalId,
    status: appointment.status,
  };
}

export function validateTimelineCreateDraft(
  draft: NewAppointmentDraft,
  appointments: TimelineAppointment[],
  durationMinutes = APPOINTMENT_DURATION_IN_MINUTES,
): string | null {
  const serviceId = Number(draft.serviceId);
  const professionalId = Number(draft.professionalId);

  if (!serviceId || !professionalId) {
    return "Selecione serviço e profissional.";
  }

  if (!Number(draft.clientId)) {
    const nameError = validateTextField(draft.clientName, {
      label: "O nome do cliente",
      maxLength: FIELD_LIMITS.clientName,
      minLength: 2,
    });

    if (nameError) {
      return nameError;
    }
  }

  if (!Number(draft.clientId) && !draft.clientName.trim()) {
    return "Informe o nome do cliente ou selecione um cadastro existente.";
  }

  if (
    hasTimelineSlotConflict({
      appointments,
      slot: { professionalId: String(professionalId), time: draft.time },
      durationMinutes,
    })
  ) {
    return "Ja existe um agendamento nesse horario.";
  }

  return null;
}

export function validateTimelineEditDraft(
  appointments: TimelineAppointment[],
  appointmentId: number,
  draft: AppointmentDraft,
  durationMinutes = APPOINTMENT_DURATION_IN_MINUTES,
): string | null {
  if (!draft.client.trim() || !draft.service.trim()) {
    return "Preencha cliente e serviço.";
  }

  if (
    hasTimelineSlotConflict({
      appointments,
      excludedAppointmentId: appointmentId,
      slot: {
        professionalId: draft.professionalId,
        time: draft.time,
      },
      durationMinutes,
    })
  ) {
    return "Ja existe um agendamento nesse horario.";
  }

  return null;
}

export function buildCreateClientPayload(draft: NewAppointmentDraft): CreateClientRequest {
  return {
    name: draft.clientName.trim(),
    email: draft.clientEmail.trim().toLowerCase(),
    phone: normalizePhone(draft.clientPhone),
    cpf: normalizeCpf(draft.clientCpf),
    notes: "",
  };
}

export function buildCreateAppointmentPayload(
  clientId: number,
  draft: NewAppointmentDraft,
  selectedDate: Date,
): CreateAppointmentRequest {
  return {
    clientId,
    professionalId: Number(draft.professionalId),
    serviceId: Number(draft.serviceId),
    scheduledAt: buildScheduledAt(selectedDate, draft.time),
    status: draft.status,
    notes: "",
  };
}

export function buildTimelineUpdatePayload(
  appointment: TimelineAppointment,
  slot: TimelineSlot,
  selectedDate: Date,
): UpdateAppointmentRequest {
  return {
    clientId: appointment.clientId,
    professionalId: Number(slot.professionalId),
    serviceId: appointment.serviceId,
    scheduledAt: buildScheduledAt(selectedDate, slot.time),
    status: appointment.status,
    notes: appointment.notes,
  };
}

export function buildTimelineEditPayload(
  appointment: TimelineAppointment,
  draft: AppointmentDraft,
  selectedDate: Date,
): UpdateAppointmentRequest {
  return {
    clientId: appointment.clientId,
    professionalId: Number(draft.professionalId),
    serviceId: appointment.serviceId,
    scheduledAt: buildScheduledAt(selectedDate, draft.time),
    status: draft.status,
    notes: appointment.notes,
  };
}

export function applyTimelineEdit({
  appointments,
  appointmentId,
  draft,
  normalizedClient,
  normalizedService,
}: TimelineEditInput): TimelineAppointment[] {
  return appointments.map((appointment) =>
    appointment.id === appointmentId
      ? {
          ...appointment,
          client: normalizedClient,
          service: normalizedService,
          time: draft.time,
          professionalId: draft.professionalId,
          status: draft.status,
        }
      : appointment,
  );
}

export function swapTimelineAppointments(
  appointments: TimelineAppointment[],
  draggedAppointment: TimelineAppointment,
  targetAppointment: TimelineAppointment,
): TimelineAppointment[] {
  return appointments.map((appointment) => {
    if (appointment.id === draggedAppointment.id) {
      return {
        ...appointment,
        professionalId: targetAppointment.professionalId,
        time: targetAppointment.time,
      };
    }

    if (appointment.id === targetAppointment.id) {
      return {
        ...appointment,
        professionalId: draggedAppointment.professionalId,
        time: draggedAppointment.time,
      };
    }

    return appointment;
  });
}

export function moveTimelineAppointment(
  appointments: TimelineAppointment[],
  appointmentId: number,
  slot: TimelineSlot,
): TimelineAppointment[] {
  return appointments.map((appointment) =>
    appointment.id === appointmentId
      ? {
          ...appointment,
          professionalId: slot.professionalId,
          time: slot.time,
        }
      : appointment,
  );
}

export function hasTimelineOverlap(
  appointments: TimelineAppointment[],
  appointmentId: number,
  slot: TimelineSlot,
  durationMinutes = APPOINTMENT_DURATION_IN_MINUTES,
): boolean {
  const targetStart = timeToMinutes(slot.time);
  const targetEnd = targetStart + durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.id === appointmentId || appointment.professionalId !== slot.professionalId) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + appointment.durationMinutes;

    return targetStart < appointmentEnd && targetEnd > appointmentStart;
  });
}

export function getAvailableTimelineSlots(
  appointments: TimelineAppointment[],
  professionalId: string,
  timeSlots: string[],
  durationMinutes = APPOINTMENT_DURATION_IN_MINUTES,
): string[] {
  if (!professionalId) {
    return [];
  }

  const dayEndInMinutes = DAY_END_HOUR * 60;

  return timeSlots.filter((time) => {
    const startInMinutes = timeToMinutes(time);
    const endInMinutes = startInMinutes + durationMinutes;

    if (endInMinutes > dayEndInMinutes) {
      return false;
    }

    return !hasTimelineOverlap(
      appointments,
      Number.NaN,
      { professionalId, time },
      durationMinutes,
    );
  });
}

export function findTimelineAppointment(
  appointments: TimelineAppointment[],
  appointmentId: number | null,
): TimelineAppointment | null {
  if (appointmentId === null) {
    return null;
  }

  return appointments.find((appointment) => appointment.id === appointmentId) ?? null;
}

export function findTimelineTargetAppointment(
  appointments: TimelineAppointment[],
  draggedAppointmentId: number,
  slot: TimelineSlot,
): TimelineAppointment | null {
  return (
    appointments.find(
      (appointment) =>
        appointment.id !== draggedAppointmentId &&
        appointment.professionalId === slot.professionalId &&
        appointment.time === slot.time,
    ) ?? null
  );
}

function hasTimelineSlotConflict({
  appointments,
  excludedAppointmentId,
  slot,
  durationMinutes = APPOINTMENT_DURATION_IN_MINUTES,
}: TimelineConflictInput): boolean {
  const targetStart = timeToMinutes(slot.time);
  const targetEnd = targetStart + durationMinutes;

  return appointments.some((appointment) => {
    if (appointment.id === excludedAppointmentId || appointment.professionalId !== slot.professionalId) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + appointment.durationMinutes;

    return targetStart < appointmentEnd && targetEnd > appointmentStart;
  });
}
