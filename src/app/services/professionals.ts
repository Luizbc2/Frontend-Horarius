import { createEntityService, type ListQueryParams, type PaginatedResponse } from "./entity-service";
import type { ProfessionalEntity, ProfessionalWorkDayEntity } from "../types/entities";

export type ProfessionalApiItem = ProfessionalEntity;

export type CreateProfessionalRequest = {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
};

export type ProfessionalWorkDayApiItem = ProfessionalWorkDayEntity;

export type ProfessionalWorkDayRequest = {
  dayOfWeek: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

export type UpdateProfessionalRequest = CreateProfessionalRequest;

export type CreateProfessionalResponse = {
  message: string;
  professional: ProfessionalApiItem;
};

export type GetProfessionalResponse = {
  professional: ProfessionalApiItem;
};

export type UpdateProfessionalResponse = {
  message: string;
  professional: ProfessionalApiItem;
};

export type DeleteProfessionalResponse = {
  message: string;
};

export type ProfessionalWorkDaysResponse = {
  data: ProfessionalWorkDayApiItem[];
};

export type UpdateProfessionalWorkDaysResponse = {
  message: string;
  workDays: ProfessionalWorkDayApiItem[];
};

export const createProfessionalsService = (token: string) => {
  const entityService = createEntityService({
    resourcePath: "/professionals",
    token,
  });

  return {
    getById: (id: number) => entityService.get<GetProfessionalResponse>(id),
    list: (query?: ListQueryParams) => entityService.list<ProfessionalApiItem>(query),
    create: (body: CreateProfessionalRequest) =>
      entityService.create<CreateProfessionalResponse, CreateProfessionalRequest>(body),
    listWorkDays: (id: number) => entityService.get<ProfessionalWorkDaysResponse>(`${id}/work-days`),
    update: (id: number, body: UpdateProfessionalRequest) =>
      entityService.update<UpdateProfessionalResponse, UpdateProfessionalRequest>(id, body),
    updateWorkDays: (id: number, workDays: ProfessionalWorkDayRequest[]) =>
      entityService.update<UpdateProfessionalWorkDaysResponse, { workDays: ProfessionalWorkDayRequest[] }>(
        `${id}/work-days`,
        {
          workDays,
        },
      ),
    remove: (id: number) => entityService.remove<DeleteProfessionalResponse>(id),
  };
};

export type ProfessionalsListResponse = PaginatedResponse<ProfessionalApiItem>;
