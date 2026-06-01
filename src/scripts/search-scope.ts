export type SearchScope = "view" | "watchlist" | "all";

export const SEARCH_SCOPE_STORAGE_KEY = "osrs-prices-search-scope";
const STORAGE_KEY = SEARCH_SCOPE_STORAGE_KEY;

export function readSearchScope(): SearchScope {
  if (typeof window === "undefined") {
    return "view";
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "all" || stored === "watchlist" ? stored : "view";
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
