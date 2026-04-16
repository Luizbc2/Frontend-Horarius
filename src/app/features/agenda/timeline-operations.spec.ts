import { describe, expect, test } from "vitest";

import type { TimelineAppointment } from "./timeline-helpers";
import {
  getAvailableTimelineSlots,
  hasTimelineOverlap,
  validateTimelineCreateDraft,
} from "./timeline-operations";

const appointments: TimelineAppointment[] = [];
const scheduledAppointments: TimelineAppointment[] = [
  {
    id: 1,
    clientId: 1,
    time: "09:00",
    client: "Ana",
    serviceId: 3,
    service: "Corte simples",
    durationMinutes: 45,
    professionalId: "2",
    status: "confirmado",
    notes: "",
  },
  {
    id: 2,
    clientId: 2,
    time: "10:00",
    client: "Bruno",
    serviceId: 4,
    service: "Barba",
    durationMinutes: 30,
    professionalId: "5",
    status: "confirmado",
    notes: "",
  },
];

describe("timeline create validation", () => {
  test("requires only the client name for quick inline scheduling", () => {
    expect(
      validateTimelineCreateDraft(
        {
          clientId: "",
          clientName: "Ana",
          clientEmail: "",
          clientPhone: "",
          clientCpf: "",
          serviceId: "3",
          time: "09:00",
          professionalId: "2",
          status: "confirmado",
        },
        appointments,
      ),
    ).toBeNull();

    expect(
      validateTimelineCreateDraft(
        {
          clientId: "",
          clientName: "Ana",
          clientEmail: "qualquer-coisa",
          clientPhone: "abc",
          clientCpf: "123.456.789-00",
          serviceId: "3",
          time: "09:00",
          professionalId: "2",
          status: "confirmado",
        },
        appointments,
      ),
    ).toBeNull();
  });

  test("still requires the client name when no existing client is selected", () => {
    expect(
      validateTimelineCreateDraft(
        {
          clientId: "",
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          clientCpf: "",
          serviceId: "3",
          time: "09:00",
          professionalId: "2",
          status: "confirmado",
        },
        appointments,
      ),
    ).toBe("Informe o nome do cliente.");
  });

  test("blocks overlapping times based on the service duration", () => {
    expect(
      hasTimelineOverlap(scheduledAppointments, 999, {
        professionalId: "2",
        time: "09:30",
      }, 30),
    ).toBe(true);

    expect(
      hasTimelineOverlap(scheduledAppointments, 999, {
        professionalId: "2",
        time: "09:50",
      }, 30),
    ).toBe(false);
  });

  test("returns only the free slots that still fit in the day", () => {
    expect(
      getAvailableTimelineSlots(scheduledAppointments, "2", ["09:00", "09:30", "09:50", "10:00", "18:20"], 30),
    ).toEqual(["09:50", "10:00", "18:20"]);

    expect(
      getAvailableTimelineSlots(scheduledAppointments, "5", ["09:00", "09:30", "09:50", "10:00", "18:20"], 30),
    ).toEqual(["09:00", "09:30", "18:20"]);
  });
});
