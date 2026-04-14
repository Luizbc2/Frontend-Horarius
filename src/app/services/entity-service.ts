import { api } from "../lib/api";
import { DEFAULT_LIST_LIMIT, DEFAULT_LIST_PAGE, type ListQuery } from "../lib/list-query";

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type ListQueryParams = Partial<ListQuery>;

type EntityServiceConfig = {
  resourcePath: string;
  token: string;
};

type EntityId = number | string;

const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const createEntityService = ({ resourcePath, token }: EntityServiceConfig) => ({
  get: <TResponse>(id: EntityId) =>
    api.get<TResponse>(`${resourcePath}/${id}`, {
      headers: createAuthHeaders(token),
    }),
  list: <T>(query?: ListQueryParams) =>
    api.get<PaginatedResponse<T>>(resourcePath, {
      headers: createAuthHeaders(token),
      query: {
        page: query?.page ?? DEFAULT_LIST_PAGE,
        limit: query?.limit ?? DEFAULT_LIST_LIMIT,
        search: query?.search?.trim() ?? "",
      },
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
