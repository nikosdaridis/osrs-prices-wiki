import type {
  AveragePriceResponse,
  LatestResponse,
  MappingEntry,
  TimeseriesResponse,
  Timestep,
  VolumesResponse,
} from "./types";

const PRICES_BASE = "https://prices.runescape.wiki/api/v1/osrs";

const HEADERS: HeadersInit = {
  "x-application": "osrsprices.wiki",
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`request failed (${response.status}) for ${url}`);
  }
  return (await response.json()) as T;
}

export function fetchMapping(): Promise<MappingEntry[]> {
  return getJson<MappingEntry[]>(`${PRICES_BASE}/mapping`);
}

export function fetchLatest(): Promise<LatestResponse> {
  return getJson<LatestResponse>(`${PRICES_BASE}/latest`);
}

export function fetchVolumes(): Promise<VolumesResponse> {
  return getJson<VolumesResponse>(`${PRICES_BASE}/volumes`);
}

export function fetch24h(): Promise<AveragePriceResponse> {
  return getJson<AveragePriceResponse>(`${PRICES_BASE}/24h`);
}

export function fetchTimeseries(
  itemId: number,
  timestep: Timestep,
): Promise<TimeseriesResponse> {
  return getJson<TimeseriesResponse>(
    `${PRICES_BASE}/timeseries?timestep=${timestep}&id=${itemId}`,
  );
}
