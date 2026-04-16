export type RouteNoticeState = {
  notice?: string;
};

export function readRouteNotice(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("notice" in state)) {
    return null;
  }

  const { notice } = state as RouteNoticeState;
  return typeof notice === "string" && notice.trim() ? notice : null;
}

export function clearRouteNotice() {
  window.history.replaceState({}, document.title);
}
