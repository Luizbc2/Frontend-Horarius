import { createEntityService, type ListQueryParams, type PaginatedResponse } from "./entity-service";
import type { ClientEntity } from "../types/entities";

export type ClientApiItem = ClientEntity;

export type CreateClientRequest = {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  notes: string;
};

export type UpdateClientRequest = CreateClientRequest;

export type CreateClientResponse = {
  message: string;
  client: ClientApiItem;
};

export type GetClientResponse = {
  client: ClientApiItem;
};

export type UpdateClientResponse = {
  message: string;
  client: ClientApiItem;
};

export type DeleteClientResponse = {
  message: string;
};

export const createClientsService = (token: string) => {
  const entityService = createEntityService({
    resourcePath: "/clients",
    token,
  });

  return {
    getById: (id: number) => entityService.get<GetClientResponse>(id),
    list: (query?: ListQueryParams) => entityService.list<ClientApiItem>(query),
    create: (body: CreateClientRequest) => entityService.create<CreateClientResponse, CreateClientRequest>(body),
    update: (id: number, body: UpdateClientRequest) =>
      entityService.update<UpdateClientResponse, UpdateClientRequest>(id, body),
    remove: (id: number) => entityService.remove<DeleteClientResponse>(id),
  };
};

export type ClientsListResponse = PaginatedResponse<ClientApiItem>;
