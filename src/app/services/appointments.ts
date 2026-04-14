import { api } from "../lib/api";
import type { PaginatedResponse } from "./entity-service";
import type { AppointmentEntity, AppointmentStatus } from "../types/entities";

export type AppointmentApiItem = AppointmentEntity;

export type ListAppointmentsQuery = {
  date?: string;
  limit?: number;
  page?: number;
  professionalId?: number;
  status?: AppointmentStatus;
};

export type CreateAppointmentRequest = {
  clientId: number;
  professionalId: number;
  serviceId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string;
};

export type UpdateAppointmentRequest = CreateAppointmentRequest;

export type CreateAppointmentResponse = {
  appointment: AppointmentApiItem;
  message: string;
};

export type UpdateAppointmentResponse = {
  appointment: AppointmentApiItem;
  message: string;
};

export type DeleteAppointmentResponse = {
  message: string;
};

export type AppointmentsListResponse = PaginatedResponse<AppointmentApiItem>;

const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

function createAppointmentsQuery(query?: ListAppointmentsQuery) {
  if (!query) {
    return undefined;
  }

  return {
    date: query.date,
    limit: query.limit,
    page: query.page,
    professionalId: query.professionalId,
    status: query.status,
  };
}

export const createAppointmentsService = (token: string) => ({
  list: (query?: ListAppointmentsQuery) =>
    api.get<AppointmentsListResponse>("/appointments", {
      headers: createAuthHeaders(token),
      query: createAppointmentsQuery(query),
    }),

  create: (body: CreateAppointmentRequest) =>
    api.post<CreateAppointmentResponse>("/appointments", body, {
      headers: createAuthHeaders(token),
    }),

  update: (id: number, body: UpdateAppointmentRequest) =>
    api.put<UpdateAppointmentResponse>(`/appointments/${id}`, body, {
      headers: createAuthHeaders(token),
    }),

  remove: (id: number) =>
    api.delete<DeleteAppointmentResponse>(`/appointments/${id}`, {
      headers: createAuthHeaders(token),
    }),
});
