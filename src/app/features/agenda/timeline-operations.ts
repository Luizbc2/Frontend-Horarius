import type { CreateAppointmentRequest, UpdateAppointmentRequest } from "../../services/appointments";
import type { CreateClientRequest } from "../../services/clients";
import { normalizeCpf, validateCpf } from "../../lib/cpf";
import {
  FIELD_LIMITS,
  validateEmailField,
  validatePhoneField,
  validateTextField,
} from "../../lib/field-rules";
import { normalizePhone } from "../../data/clients";
import {
  APPOINTMENT_DURATION_IN_MINUTES,
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
): string | null {
  const serviceId = Number(draft.serviceId);
  const professionalId = Number(draft.professionalId);

  if (!serviceId || !professionalId) {
    return "Selecione servico e profissional.";
  }

  if (!Number(draft.clientId)) {
    const nameError = validateTextField(draft.clientName, {
      label: "O nome do cliente",
      maxLength: FIELD_LIMITS.clientName,
      minLength: 2,
    });
    const emailError = validateEmailField(draft.clientEmail);
    const phoneError = validatePhoneField(draft.clientPhone);
    const normalizedCpf = normalizeCpf(draft.clientCpf);

    if (nameError) {
      return nameError;
    }

    if (emailError) {
      return emailError;
    }

    if (phoneError) {
      return phoneError;
    }

    if (normalizedCpf && !validateCpf(normalizedCpf)) {
      return "Digite um CPF valido.";
    }
  }

  if (!Number(draft.clientId) && !draft.clientName.trim()) {
    return "Informe os dados do novo cliente ou selecione um cadastro existente.";
  }

  if (hasTimelineSlotConflict({ appointments, slot: { professionalId: String(professionalId), time: draft.time } })) {
    return "Ja existe um agendamento nesse horario.";
  }

  return null;
}

export function validateTimelineEditDraft(
  appointments: TimelineAppointment[],
  appointmentId: number,
  draft: AppointmentDraft,
): string | null {
  if (!draft.client.trim() || !draft.service.trim()) {
    return "Preencha cliente e servico.";
  }

  if (
    hasTimelineSlotConflict({
      appointments,
      excludedAppointmentId: appointmentId,
      slot: {
        professionalId: draft.professionalId,
        time: draft.time,
      },
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
): boolean {
  const targetStart = timeToMinutes(slot.time);
  const targetEnd = targetStart + APPOINTMENT_DURATION_IN_MINUTES;

  return appointments.some((appointment) => {
    if (appointment.id === appointmentId || appointment.professionalId !== slot.professionalId) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.time);
    const appointmentEnd = appointmentStart + APPOINTMENT_DURATION_IN_MINUTES;

    return targetStart < appointmentEnd && targetEnd > appointmentStart;
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
}: TimelineConflictInput): boolean {
  return appointments.some(
    (appointment) =>
      appointment.id !== excludedAppointmentId &&
      appointment.professionalId === slot.professionalId &&
      appointment.time === slot.time,
  );
}
