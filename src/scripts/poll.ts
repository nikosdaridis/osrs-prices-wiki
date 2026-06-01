import { fetch24h, fetchLatest, fetchMapping } from "./api";
import { buildItemSlug, calculateTax, iconUrl } from "./format";
import { isPresent } from "./nullish";
import type {
  AveragePriceEntry,
  Item,
  LatestEntry,
  MappingEntry,
} from "./types";

const POLL_INTERVAL_MS = 60_000;
const COUNTDOWN_TICK_MS = 1_000;

let mappingCache: MappingEntry[] | null = null;
let refreshedAt: number | null = null;
let nextRefreshAt: number | null = null;
let isRefreshing: boolean = false;

async function loadMapping(): Promise<MappingEntry[]> {
  if (mappingCache !== null) {
    return mappingCache;
  }
  mappingCache = await fetchMapping();
  return mappingCache;
}

export async function fetchSnapshot(): Promise<Item[]> {
  isRefreshing = true;
  try {
    const [mapping, latest, average24h] = await Promise.all([
      loadMapping(),
      fetchLatest(),
      fetch24h(),
    ]);
    refreshedAt = Date.now();
    nextRefreshAt = refreshedAt + POLL_INTERVAL_MS;
    return buildItems(mapping, latest.data, average24h.data);
  } finally {
    isRefreshing = false;
  }
}

export function deriveItem(
  entry: MappingEntry,
  latest: LatestEntry | undefined,
  average: AveragePriceEntry | undefined,
): Item {
  const buy = latest?.high ?? null;
  const sell = latest?.low ?? null;
  const tax = calculateTax(buy);
  const margin = isPresent(buy) && isPresent(sell) ? buy - sell - tax : null;
  const roi =
    isPresent(margin) && isPresent(sell) && sell > 0
      ? (margin / sell) * 100
      : null;

  const high24h = average?.avgHighPrice ?? null;
  const low24h = average?.avgLowPrice ?? null;
  const volume =
    (average?.highPriceVolume ?? 0) + (average?.lowPriceVolume ?? 0);
  const change24h =
    isPresent(buy) && isPresent(high24h) && high24h > 0
      ? ((buy - high24h) / high24h) * 100
      : null;

  const limit = entry.limit ?? 0;
  const marginXLimit = isPresent(margin) && limit > 0 ? margin * limit : null;
  const marginXVolume =
    isPresent(margin) && volume > 0 ? margin * volume : null;

  const buyTime = latest?.highTime ?? null;
  const sellTime = latest?.lowTime ?? null;

  return {
    id: entry.id,
    name: entry.name,
    slug: buildItemSlug(entry.name),
    icon: entry.icon,
    iconUrl: iconUrl(entry.icon),
    examine: entry.examine,
    members: entry.members,
    limit,
    highalch: entry.highalch ?? 0,
    lowalch: entry.lowalch ?? 0,
    buy,
    sell,
    buyTime,
    sellTime,
    volume,
    tax,
    margin,
    roi,
    marginXLimit,
    marginXVolume,
    high24h,
    low24h,
    change24h,
  };
}

function buildItems(
  mapping: MappingEntry[],
  latestMap: Record<string, LatestEntry>,
  averageMap: Record<string, AveragePriceEntry>,
): Item[] {
  return mapping.map((entry) => {
    const key = String(entry.id);
    return deriveItem(entry, latestMap[key], averageMap[key]);
  });
}

export function getRefreshedAt(): number | null {
  return refreshedAt;
}

export function startPolling(
  onUpdate: (items: Item[]) => void,
  onError: (error: unknown) => void,
): () => void {
  let stopped = false;

  const pollTick = async () => {
    try {
      const items = await fetchSnapshot();
      if (!stopped) {
        onUpdate(items);
      }
    } catch (error) {
      if (!stopped) {
        onError(error);
      }
    }
  };

  void pollTick();
  const timer = setInterval(() => void pollTick(), POLL_INTERVAL_MS);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

export function startRefreshCountdown(elementId: string): () => void {
  const update = () => {
    const element = document.getElementById(elementId);
    if (element === null) {
      return;
    }
    if (refreshedAt === null) {
      element.textContent = "…";
      return;
    }
    if (isRefreshing || nextRefreshAt === null) {
      element.textContent = "Refreshing…";
      return;
    }
    const secondsRemaining = Math.max(
      0,
      Math.ceil((nextRefreshAt - Date.now()) / 1000),
    );
    element.textContent = `${secondsRemaining}s`;
  };

  update();
  const timer = setInterval(update, COUNTDOWN_TICK_MS);
  return () => clearInterval(timer);
}
