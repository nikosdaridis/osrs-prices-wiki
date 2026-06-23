import { type ColumnState } from "ag-grid-community";
import {
  applyView,
  captureViewState,
  getDefaultColumnState,
  setStateChangeCallback,
  type ViewState,
} from "./grid";
import { type RelativeTimeFilterModel } from "./filters/relative-time-filter";
import { dispatchAppEvent } from "./events";

export const VIEWS_STORAGE_KEY = "osrs-prices-views";
const STORAGE_KEY = VIEWS_STORAGE_KEY;

export interface PredefinedView {
  id: string;
  name: string;
  isPredefined: true;
  state: ViewState;
}

export interface CustomView {
  id: string;
  name: string;
  isPredefined: false;
  state: ViewState;
}

export type View = PredefinedView | CustomView;

interface StoredState {
  activeViewId: string;
  scratch: ViewState | null;
  custom: CustomView[];
}

interface ViewSpec {
  sortColId: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, unknown>;
  columns?: string[];
  extraVisibleColumns?: string[];
}

const BASELINE_VISIBLE: string[] = [
  "name",
  "buy",
  "sell",
  "margin",
  "tax",
  "roi",
  "high24h",
  "low24h",
  "change24h",
  "volume",
  "buyTime",
  "sellTime",
];

const HIGH_VOLUME_COLUMNS: string[] = [
  "name",
  "buy",
  "sell",
  "buyTime",
  "sellTime",
  "margin",
  "marginXVolume",
  "volume",
  "marginXLimit",
  "limit",
];

const HIGH_MARGIN_COLUMNS: string[] = [
  "name",
  "buy",
  "sell",
  "buyTime",
  "sellTime",
  "margin",
  "marginXLimit",
  "limit",
  "marginXVolume",
  "volume",
];

const RECENT_TRADE_HOURS = 1;
const RECENT_TRADE_FILTER: RelativeTimeFilterModel = {
  direction: "within",
  value: RECENT_TRADE_HOURS,
  unit: "hours",
};
const RECENT_TRADE_FILTER_MODEL = {
  buyTime: RECENT_TRADE_FILTER,
  sellTime: RECENT_TRADE_FILTER,
};

function makeViewState(spec: ViewSpec): ViewState {
  const baseColumnState = getDefaultColumnState();
  const withSort = (column: ColumnState, hide: boolean): ColumnState => ({
    ...column,
    hide,
    sort: column.colId === spec.sortColId ? (spec.sortDir ?? "desc") : null,
  });

  let columnState: ColumnState[];
  if (spec.columns !== undefined) {
    const visible = new Set<string>(spec.columns);
    const stateByColIdMap = new Map<string, ColumnState>(
      baseColumnState.map((column): [string, ColumnState] => [
        column.colId,
        column,
      ]),
    );
    const ordered: ColumnState[] = spec.columns
      .map((colId) => stateByColIdMap.get(colId))
      .filter((column): column is ColumnState => column !== undefined)
      .map((column) => withSort(column, false));
    const rest: ColumnState[] = baseColumnState
      .filter((column) => !visible.has(column.colId))
      .map((column) => withSort(column, true));
    columnState = [...ordered, ...rest];
  } else {
    const visible = new Set<string>([
      ...BASELINE_VISIBLE,
      ...(spec.extraVisibleColumns ?? []),
    ]);
    columnState = baseColumnState.map((column) =>
      withSort(column, !visible.has(column.colId)),
    );
  }

  return {
    columnState,
    filterModel: (spec.filters ?? {}) as ViewState["filterModel"],
    search: "",
    pageSize: 50,
  };
}

const HIGH_VOLUME_VIEW: PredefinedView = {
  id: "high-volume",
  name: "High Volume",
  isPredefined: true,
  state: makeViewState({
    sortColId: "marginXVolume",
    columns: HIGH_VOLUME_COLUMNS,
    filters: {
      ...RECENT_TRADE_FILTER_MODEL,
      volume: {
        filterType: "number",
        type: "greaterThanOrEqual",
        filter: 100_000,
      },
    },
  }),
};

const HIGH_MARGIN_VIEW: PredefinedView = {
  id: "high-margin",
  name: "High Margin",
  isPredefined: true,
  state: makeViewState({
    sortColId: "margin",
    columns: HIGH_MARGIN_COLUMNS,
    filters: { ...RECENT_TRADE_FILTER_MODEL },
  }),
};

export const PREDEFINED_VIEWS: PredefinedView[] = [
  HIGH_VOLUME_VIEW,
  HIGH_MARGIN_VIEW,
];

const DEFAULT_VIEW: PredefinedView = HIGH_VOLUME_VIEW;

export const DEFAULT_VIEW_ID: string = DEFAULT_VIEW.id;

function emptyStored(): StoredState {
  return { activeViewId: DEFAULT_VIEW_ID, scratch: null, custom: [] };
}

function read(): StoredState {
  if (typeof window === "undefined") {
    return emptyStored();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return emptyStored();
    }
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      activeViewId:
        typeof parsed.activeViewId === "string"
          ? parsed.activeViewId
          : DEFAULT_VIEW_ID,
      scratch: parsed.scratch ?? null,
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    };
  } catch {
    return emptyStored();
  }
}

function write(stored: StoredState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn("views: localStorage write failed", error);
  }
}

function viewsFor(stored: StoredState): View[] {
  return [...PREDEFINED_VIEWS, ...stored.custom];
}

export function listViews(): View[] {
  return viewsFor(read());
}

export function getActiveView(): View {
  const stored = read();
  return (
    viewsFor(stored).find((view) => view.id === stored.activeViewId) ??
    DEFAULT_VIEW
  );
}

export function setActiveView(viewId: string): void {
  const stored = read();
  stored.activeViewId = viewId;
  stored.scratch = null;
  write(stored);
  const view = viewsFor(stored).find(
    (candidateView) => candidateView.id === viewId,
  );
  if (view !== undefined) {
    applyView(view.state);
    dispatchAppEvent("view:change", { viewId });
  }
}

export function saveCurrentAsView(name: string): CustomView {
  const stored = read();
  const view: CustomView = {
    id: `custom-${crypto.randomUUID()}`,
    name: name.trim() || "Untitled view",
    isPredefined: false,
    state: captureViewState(),
  };
  stored.custom.push(view);
  stored.activeViewId = view.id;
  stored.scratch = null;
  write(stored);
  dispatchAppEvent("view:change", { viewId: view.id });
  return view;
}

export function deleteCustomView(viewId: string): void {
  const stored = read();
  stored.custom = stored.custom.filter((view) => view.id !== viewId);
  if (stored.activeViewId === viewId) {
    stored.activeViewId = DEFAULT_VIEW_ID;
    stored.scratch = null;
  }
  write(stored);
  if (stored.activeViewId === DEFAULT_VIEW_ID) {
    applyView(DEFAULT_VIEW.state);
  }
  dispatchAppEvent("view:change", { viewId: stored.activeViewId });
}

export function initViews(): void {
  const stored = read();
  const active =
    viewsFor(stored).find((view) => view.id === stored.activeViewId) ??
    DEFAULT_VIEW;

  applyView(stored.scratch ?? active.state);

  setStateChangeCallback(() => {
    const current = read();
    current.scratch = captureViewState();
    write(current);
  });

  dispatchAppEvent("view:change", { viewId: active.id });
}
