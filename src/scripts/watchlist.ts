const STORAGE_KEY = "osrs-prices-watchlist";

export interface WatchlistChangeDetail {
  id: number;
  watched: boolean;
}

let cachedIds: Set<number> | null = null;

function readFromStorage(): Set<number> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(
      parsed.filter((entry): entry is number => typeof entry === "number"),
    );
  } catch {
    return new Set();
  }
}

function getCache(): Set<number> {
  cachedIds ??= readFromStorage();
  return cachedIds;
}

function write(ids: Set<number>): void {
  cachedIds = ids;
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cachedIds = null;
    }
  });
}

export function getWatchlist(): Set<number> {
  return new Set(getCache());
}

export function isWatched(id: number): boolean {
  return getCache().has(id);
}

export function toggleWatch(id: number): boolean {
  const ids = new Set(getCache());
  const watched = !ids.has(id);
  if (watched) {
    ids.add(id);
  } else {
    ids.delete(id);
  }
  write(ids);
  window.dispatchEvent(
    new CustomEvent<WatchlistChangeDetail>("watchlist:change", {
      detail: { id, watched },
    }),
  );
  return watched;
}
