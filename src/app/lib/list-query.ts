export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_LIMIT = 6;

export type ListQuery = {
  page: number;
  limit: number;
  search: string;
};

export function createListQuery(overrides: Partial<ListQuery> = {}): ListQuery {
  return {
    page: overrides.page ?? DEFAULT_LIST_PAGE,
    limit: overrides.limit ?? DEFAULT_LIST_LIMIT,
    search: overrides.search?.trim() ?? "",
  };
}
