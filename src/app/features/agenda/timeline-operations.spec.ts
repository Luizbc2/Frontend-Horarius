import { describe, expect, test } from "vitest";

import { validateTimelineCreateDraft } from "./timeline-operations";
import type { TimelineAppointment } from "./timeline-helpers";

const appointments: TimelineAppointment[] = [];

describe("timeline create validation", () => {
  test("requires valid inline client contact data when no client is selected", () => {
    expect(
      validateTimelineCreateDraft(
        {
          clientId: "",
          clientName: "Ana",
          clientEmail: "ana@email.com",
          clientPhone: "11999999999",
          clientCpf: "123.456.789-00",
          serviceId: "3",
          time: "09:00",
          professionalId: "2",
          status: "confirmado",
        },
        appointments,
      ),
    ).toBe("Digite um CPF valido.");

    expect(
      validateTimelineCreateDraft(
        {
          clientId: "",
          clientName: "Ana",
          clientEmail: "ana@email.com",
          clientPhone: "abc",
          clientCpf: "",
          serviceId: "3",
          time: "09:00",
          professionalId: "2",
          status: "confirmado",
        },
        appointments,
      ),
    ).toBe("Digite um telefone valido com DDD.");
  });
});
