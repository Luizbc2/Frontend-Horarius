export type DeletePaginationState = {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
};

export type NextPageState = {
  nextPage: number;
  nextTotalItems: number;
  nextTotalPages: number;
};

export function getNextPageAfterDelete({
  currentPage,
  itemsPerPage,
  totalItems,
}: DeletePaginationState): NextPageState {
  const nextTotalItems = Math.max(0, totalItems - 1);
  const nextTotalPages = Math.max(1, Math.ceil(nextTotalItems / itemsPerPage));

  return {
    nextPage: Math.min(currentPage, nextTotalPages),
    nextTotalItems,
    nextTotalPages,
  };
}
