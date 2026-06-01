export interface MappingEntry {
  id: number;
  name: string;
  examine: string;
  icon: string;
  members: boolean;
  limit?: number;
  lowalch?: number;
  highalch?: number;
  value?: number;
}

export interface LatestEntry {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
}

export interface LatestResponse {
  data: Record<string, LatestEntry>;
}

export interface VolumesResponse {
  timestamp: number;
  data: Record<string, number>;
}

export interface AveragePriceEntry {
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number;
  lowPriceVolume: number;
}

export interface AveragePriceResponse {
  timestamp: number;
  data: Record<string, AveragePriceEntry>;
}

export interface TimeseriesPoint {
  timestamp: number;
  avgHighPrice: number | null;
  avgLowPrice: number | null;
  highPriceVolume: number;
  lowPriceVolume: number;
}

export interface TimeseriesResponse {
  data: TimeseriesPoint[];
}

export type Timestep = "5m" | "1h" | "6h" | "24h";

export interface Item {
  id: number;
  name: string;
  slug: string;
  icon: string;
  iconUrl: string;
  examine: string;
  members: boolean;
  limit: number;
  highalch: number;
  lowalch: number;

  buy: number | null;
  sell: number | null;
  buyTime: number | null;
  sellTime: number | null;

  volume: number;

  tax: number;
  margin: number | null;
  roi: number | null;

  marginXLimit: number | null;
  marginXVolume: number | null;

  high24h: number | null;
  low24h: number | null;
  change24h: number | null;
}
