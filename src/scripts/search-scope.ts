export const SEARCH_SCOPES = ["view", "watchlist", "all"] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const SEARCH_SCOPE_STORAGE_KEY = "osrs-prices-search-scope";
const STORAGE_KEY = SEARCH_SCOPE_STORAGE_KEY;

export function isSearchScope(
  value: string | null | undefined,
): value is SearchScope {
  return (SEARCH_SCOPES as readonly string[]).includes(value ?? "");
}

export function readSearchScope(): SearchScope {
  if (typeof window === "undefined") {
    return "view";
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSearchScope(stored) ? stored : "view";
  } catch {
    return "view";
  }
}

export function writeSearchScope(scope: SearchScope): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, scope);
  } catch (error) {
    console.warn("search-scope: localStorage write failed", error);
  }
}
