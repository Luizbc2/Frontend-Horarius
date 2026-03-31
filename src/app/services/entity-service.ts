import { api } from "../lib/api";

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

type EntityServiceConfig = {
  resourcePath: string;
  token: string;
};

type EntityId = number | string;

const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const createEntityService = ({ resourcePath, token }: EntityServiceConfig) => ({
  list: <T>(query?: ListQueryParams) =>
    api.get<PaginatedResponse<T>>(resourcePath, {
      headers: createAuthHeaders(token),
      query,
    }),
  create: <TResponse, TBody>(body: TBody) =>
    api.post<TResponse>(resourcePath, body, {
      headers: createAuthHeaders(token),
    }),
  update: <TResponse, TBody>(id: EntityId, body: TBody) =>
    api.put<TResponse>(`${resourcePath}/${id}`, body, {
      headers: createAuthHeaders(token),
    }),
  remove: <TResponse>(id: EntityId) =>
    api.delete<TResponse>(`${resourcePath}/${id}`, {
      headers: createAuthHeaders(token),
    }),
});
