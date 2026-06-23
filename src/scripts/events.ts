import type { SearchScope } from "./search-scope";

export interface SearchChangeDetail {
  value: string;
}

export interface SearchScopeChangeDetail {
  scope: SearchScope;
}

export interface SearchResultDetail {
  scope: "view" | "all";
  query: string;
  rowCount: number;
  total: number;
}

export interface PaginationChangeDetail {
  currentPage: number;
  totalPages: number;
  rowCount: number;
  pageSize: number;
}

export interface PageSizeChangeDetail {
  size: number;
}

export interface WatchlistChangeDetail {
  id: number;
  watched: boolean;
}

export interface ViewChangeDetail {
  viewId: string;
}

export interface DetailOpenDetail {
  itemId: number;
}

export interface AppEventDetailMap {
  "search:change": SearchChangeDetail;
  "search-scope:change": SearchScopeChangeDetail;
  "search:result": SearchResultDetail;
  "pagination:change": PaginationChangeDetail;
  "page-size:change": PageSizeChangeDetail;
  "watchlist:change": WatchlistChangeDetail;
  "view:change": ViewChangeDetail;
  "detail:open": DetailOpenDetail;
}

type AppCustomEventMap = {
  [K in keyof AppEventDetailMap]: CustomEvent<AppEventDetailMap[K]>;
};

declare global {
  interface WindowEventMap extends AppCustomEventMap {}
}

export function dispatchAppEvent<K extends keyof AppEventDetailMap>(
  name: K,
  detail: AppEventDetailMap[K],
): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
