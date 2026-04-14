export function loadCollection<T>(storageKey: string, fallbackItems: T[]) {
  if (typeof window === "undefined") {
    return fallbackItems;
  }

  try {
    const storedItems = window.localStorage.getItem(storageKey);

    if (!storedItems) {
      window.localStorage.setItem(storageKey, JSON.stringify(fallbackItems));
      return fallbackItems;
    }

    const parsedItems = JSON.parse(storedItems) as T[];
    return Array.isArray(parsedItems) ? parsedItems : fallbackItems;
  } catch {
    return fallbackItems;
  }
}

export function saveCollection<T>(storageKey: string, items: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items));
}
