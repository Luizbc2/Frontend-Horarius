import { createEntityService, type ListQueryParams, type PaginatedResponse } from "./entity-service";
import type { ServiceEntity } from "../types/entities";

export type ServiceApiItem = ServiceEntity;

export type CreateServiceRequest = {
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
};

export type UpdateServiceRequest = CreateServiceRequest;

export type CreateServiceResponse = {
  message: string;
  service: ServiceApiItem;
};

export type GetServiceResponse = {
  service: ServiceApiItem;
};

export type UpdateServiceResponse = {
  message: string;
  service: ServiceApiItem;
};

export type DeleteServiceResponse = {
  message: string;
};

export const createServicesService = (token: string) => {
  const entityService = createEntityService({
    resourcePath: "/services",
    token,
  });

  return {
    getById: (id: number) => entityService.get<GetServiceResponse>(id),
    list: (query?: ListQueryParams) => entityService.list<ServiceApiItem>(query),
    create: (body: CreateServiceRequest) =>
      entityService.create<CreateServiceResponse, CreateServiceRequest>(body),
    update: (id: number, body: UpdateServiceRequest) =>
      entityService.update<UpdateServiceResponse, UpdateServiceRequest>(id, body),
    remove: (id: number) => entityService.remove<DeleteServiceResponse>(id),
  };
};

export type ServicesListResponse = PaginatedResponse<ServiceApiItem>;
