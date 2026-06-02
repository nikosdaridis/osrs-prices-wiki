import Sortable from "sortablejs";

const STORAGE_KEY = "osrs-prices-detail-metrics-order";
const METRIC_ID_ATTR = "data-metric-id";
const GRID_ID = "metric-grid";
const HANDLE_SELECTOR = ".metric-tile__drag-handle";

const DEFAULT_ORDER: readonly string[] = [
  "m-buy",
  "m-sell",
  "m-margin",
  "m-potential",
  "m-last-buy",
  "m-last-sell",
  "m-roi",
  "m-margin-vol",
  "m-avgbuy",
  "m-avgsell",
  "m-change",
  "m-tax",
  "m-volume",
  "m-limit",
  "m-highalch",
  "m-lowalch",
];

function reconcile(saved: readonly string[]): string[] {
  const known = new Set(DEFAULT_ORDER);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of saved) {
    if (known.has(id) && !seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) {
      result.push(id);
    }
  }
  return result;
}

function read(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_ORDER];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [...DEFAULT_ORDER];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_ORDER];
    }
    return reconcile(
      parsed.filter((entry): entry is string => typeof entry === "string"),
    );
  } catch {
    return [...DEFAULT_ORDER];
  }
}

function write(order: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.warn("detail-metrics-order: localStorage write failed", error);
  }
}

export function getMetricsOrder(): string[] {
  return read();
}

function applyOrder(grid: HTMLElement, order: string[]): void {
  const tileByIdMap = new Map<string, HTMLElement>();
  grid.querySelectorAll<HTMLElement>(`[${METRIC_ID_ATTR}]`).forEach((tile) => {
    const id = tile.getAttribute(METRIC_ID_ATTR);
    if (id !== null) {
      tileByIdMap.set(id, tile);
    }
  });
  for (const id of order) {
    const tile = tileByIdMap.get(id);
    if (tile !== undefined) {
      grid.appendChild(tile);
    }
  }
}

export function initMetricsReorder(): void {
  if (typeof window === "undefined") {
    return;
  }
  const grid = document.getElementById(GRID_ID);
  if (grid === null) {
    return;
  }

  applyOrder(grid, read());

  const sortable = Sortable.create(grid, {
    animation: 150,
    dataIdAttr: METRIC_ID_ATTR,
    handle: HANDLE_SELECTOR,
    ghostClass: "metric-tile--ghost",
    onEnd: () => write(sortable.toArray()),
  });
}
