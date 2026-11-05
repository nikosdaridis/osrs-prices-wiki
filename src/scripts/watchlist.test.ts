import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WatchlistChangeDetail } from "./events";

const ITEM_ID = 4151;
const WRITE_FAILED_WARNING = "watchlist: localStorage write failed";

const quotaExceededError = new DOMException(
  "The quota has been exceeded.",
  "QuotaExceededError",
);
const storageBlockedError = new DOMException(
  "Access is denied for this document.",
  "SecurityError",
);

function createWindowWithFullStorage(): EventTarget {
  return Object.assign(new EventTarget(), {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw quotaExceededError;
      },
    },
  });
}

function createWindowWithBlockedStorage(): EventTarget {
  return Object.defineProperty(new EventTarget(), "localStorage", {
    get: () => {
      throw storageBlockedError;
    },
  });
}

describe("toggleWatch when storage writes fail", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    {
      failure: "the quota is exceeded",
      createWindow: createWindowWithFullStorage,
      error: quotaExceededError,
    },
    {
      failure: "storage is blocked",
      createWindow: createWindowWithBlockedStorage,
      error: storageBlockedError,
    },
  ])(
    "keeps the toggle in memory and announces it when $failure",
    async ({ createWindow, error }) => {
      vi.stubGlobal("window", createWindow());
      const changes: WatchlistChangeDetail[] = [];
      window.addEventListener("watchlist:change", (event) => {
        changes.push(event.detail);
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { isWatched, toggleWatch } = await import("./watchlist");

      expect(toggleWatch(ITEM_ID)).toBe(true);
      expect(isWatched(ITEM_ID)).toBe(true);
      expect(toggleWatch(ITEM_ID)).toBe(false);
      expect(isWatched(ITEM_ID)).toBe(false);
      expect(changes).toEqual([
        { id: ITEM_ID, watched: true },
        { id: ITEM_ID, watched: false },
      ]);
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith(WRITE_FAILED_WARNING, error);
    },
  );
});
