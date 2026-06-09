import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  createGrid,
  themeQuartz,
  type ColDef,
  type ColumnState,
  type FilterModel,
  type GridApi,
  type GridOptions,
  type ICellRendererParams,
  type INumberFilterParams,
  type ITextFilterParams,
  type ValueFormatterParams,
} from "ag-grid-community";

import {
  colorVarFor,
  formatInt,
  formatPercent,
  formatShort,
  formatTimeAgo,
  formatTimeAgoFromUnix,
  FREE_TO_PLAY_ICON,
  iconUrl,
  MAX_GE_PRICE,
  MEMBER_ICON,
  tradeTimeColorVar,
  type ValueKind,
} from "./format";
import { escapeHtml } from "./html";
import { isNullish } from "./nullish";
import {
  COLOR_ACCENT,
  COLOR_ACCENT_SELECTION,
  COLOR_BG,
  COLOR_BORDER,
  COLOR_FG,
  COLOR_HEADER_TEXT,
  COLOR_ROW_BORDER,
  COLOR_ROW_HOVER,
} from "./theme";
import { readSearchScope, type SearchScope } from "./search-scope";
import type { Item } from "./types";
import { isWatched, toggleWatch } from "./watchlist";
import { parseAbbreviatedNumber } from "./parse-number";
import { RelativeTimeFilter } from "./filters/relative-time-filter";
import { MembersFilter } from "./filters/members-filter";
import { decorateFilterInputs } from "./filters/clear-button";

ModuleRegistry.registerModules([AllCommunityModule]);

const GRID_THEME = themeQuartz.withPart(colorSchemeDarkBlue).withParams({
  backgroundColor: COLOR_BG,
  foregroundColor: COLOR_FG,
  headerBackgroundColor: COLOR_BG,
  headerTextColor: COLOR_HEADER_TEXT,
  borderColor: COLOR_BORDER,
  rowBorder: { color: COLOR_ROW_BORDER, style: "solid", width: 1 },
  oddRowBackgroundColor: COLOR_BG,
  rowHoverColor: COLOR_ROW_HOVER,
  selectedRowBackgroundColor: COLOR_ACCENT_SELECTION,
  fontFamily: "inherit",
  fontSize: 14,
  headerFontSize: 13,
  rowHeight: 36,
  headerHeight: 36,
  cellHorizontalPadding: 12,
  wrapperBorder: false,
  columnBorder: false,
  iconSize: 13,
  accentColor: COLOR_ACCENT,
});

const CELL_FONT_PX = 14;
const HEADER_FONT_PX = 13;
const CONTENT_PADDING_PX = 12 * 2;
const HEADER_ICON_RESERVE_PX = 44;
const MONO_ADVANCE_RATIO = 0.6;

function monospaceCharacterWidth(fontPx: number): number {
  if (typeof document === "undefined") {
    return fontPx * MONO_ADVANCE_RATIO;
  }
  const context = document.createElement("canvas").getContext("2d");
  const root = document.body ?? document.documentElement;
  if (context === null || root === null) {
    return fontPx * MONO_ADVANCE_RATIO;
  }
  const fontFamily = getComputedStyle(root).fontFamily || "monospace";
  context.font = `${fontPx}px ${fontFamily}`;
  return context.measureText("0").width || fontPx * MONO_ADVANCE_RATIO;
}

const CELL_CHARACTER_PX = monospaceCharacterWidth(CELL_FONT_PX);
const HEADER_CHARACTER_PX = monospaceCharacterWidth(HEADER_FONT_PX);

function fitColumnWidth(headerName: string, widestValue: string): number {
  const valueWidth =
    Math.ceil(widestValue.length * CELL_CHARACTER_PX) + CONTENT_PADDING_PX;
  const headerWidth =
    Math.ceil(headerName.length * HEADER_CHARACTER_PX) +
    CONTENT_PADDING_PX +
    HEADER_ICON_RESERVE_PX;
  return Math.max(valueWidth, headerWidth);
}

const DEFAULT_MIN_COLUMN_WIDTH = fitColumnWidth("ROI", "");

const WIDEST_INT = formatInt(MAX_GE_PRICE);
const WIDEST_SHORT = "-999.99M";
const WIDEST_PERCENT = "+1234.56%";
const WIDEST_TIME = formatTimeAgo(59);
const WIDEST_LIMIT = "100,000";

type ItemColDef = ColDef<Item> & { colId: string };
type RawColDef = ItemColDef & { widestValue?: string };

function withFitWidth(definition: RawColDef): ItemColDef {
  if (definition.colId === "name") {
    return definition;
  }
  const { widestValue, ...rest } = definition;
  const headerName =
    typeof definition.headerName === "string" ? definition.headerName : "";
  const width = fitColumnWidth(headerName, widestValue ?? "");
  return { ...rest, width, minWidth: width };
}

export interface ViewState {
  columnState: ColumnState[];
  filterModel: FilterModel;
  search: string;
  pageSize: number;
}

interface GridState {
  api: GridApi<Item>;
  watchOnly: boolean;
  search: string;
  searchAll: boolean;
}

let state: GridState | null = null;
let stateChangeCallback: (() => void) | null = null;
let stateChangeDebounce: ReturnType<typeof setTimeout> | null = null;
let baseFilterModel: FilterModel | null = null;
let bypassing = false;
let totalItemCount = 0;
let filterInputObserver: MutationObserver | null = null;

const STATE_CHANGE_DEBOUNCE_MS = 250;

function notifyStateChange(): void {
  if (stateChangeCallback === null) {
    return;
  }
  if (stateChangeDebounce !== null) {
    clearTimeout(stateChangeDebounce);
  }
  stateChangeDebounce = setTimeout(() => {
    stateChangeCallback?.();
  }, STATE_CHANGE_DEBOUNCE_MS);
}

export interface PaginationChangeDetail {
  currentPage: number;
  totalPages: number;
  rowCount: number;
  pageSize: number;
}

export interface SearchResultDetail {
  scope: "view" | "all";
  query: string;
  rowCount: number;
  total: number;
}

function dispatchSearchResult(): void {
  if (state === null) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<SearchResultDetail>("search:result", {
      detail: {
        scope: state.searchAll ? "all" : "view",
        query: state.search,
        rowCount: state.api.paginationGetRowCount(),
        total: totalItemCount,
      },
    }),
  );
}

function dispatchPaginationChange(): void {
  if (state === null) {
    return;
  }
  const api = state.api;
  window.dispatchEvent(
    new CustomEvent<PaginationChangeDetail>("pagination:change", {
      detail: {
        currentPage: api.paginationGetCurrentPage(),
        totalPages: api.paginationGetTotalPages(),
        rowCount: api.paginationGetRowCount(),
        pageSize: api.paginationGetPageSize(),
      },
    }),
  );
}

function numberRenderer(kind: ValueKind, formatter: (value: number) => string) {
  return (parameters: ICellRendererParams<Item, number | null>): string => {
    const value = parameters.value;
    if (isNullish(value)) {
      return `<span style="color:var(--color-muted-foreground)">—</span>`;
    }
    return `<span style="color:${colorVarFor(value, kind)}">${formatter(value)}</span>`;
  };
}

function highlightName(name: string, search: string): string {
  if (search === "") {
    return escapeHtml(name);
  }
  const lowerName = name.toLowerCase();
  const lowerSearch = search.toLowerCase();
  let result = "";
  let position = 0;
  while (position < name.length) {
    const index = lowerName.indexOf(lowerSearch, position);
    if (index === -1) {
      result += escapeHtml(name.slice(position));
      break;
    }
    if (index > position) result += escapeHtml(name.slice(position, index));
    result +=
      `<mark style="background:transparent;color:var(--color-accent);font-weight:600">` +
      escapeHtml(name.slice(index, index + search.length)) +
      `</mark>`;
    position = index + search.length;
  }
  return result;
}

function itemCellRenderer(parameters: ICellRendererParams<Item>): string {
  const item = parameters.data;
  if (item === undefined) {
    return "";
  }
  const watched = isWatched(item.id);
  const starColor = watched ? "var(--color-warn)" : "var(--color-muted)";
  const starFill = watched ? "currentColor" : "none";
  const safeName = highlightName(item.name, state?.search ?? "");
  return `
<div class="flex h-full w-full items-center gap-2">
    <button
        type="button"
        data-watch-id="${item.id}"
        class="watch-toggle grid size-4 shrink-0 place-items-center"
        style="color:${starColor}"
        aria-label="Toggle watchlist"
        title="Toggle watchlist">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="${starFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    </button>
    <img src="${item.iconUrl}" alt="" width="22" height="22" loading="lazy" decoding="async" class="shrink-0 object-contain" onerror="this.style.opacity='0.15'">
    <div class="flex min-w-0 flex-col leading-tight">
        <span class="truncate" style="color:var(--color-fg)">${safeName}</span>
        <span style="color:var(--color-muted-foreground); font-size:12px">#${item.id}</span>
    </div>
</div>`;
}

function membersCellRenderer(
  parameters: ICellRendererParams<Item, boolean>,
): string {
  const value = parameters.value;
  if (isNullish(value)) {
    return "";
  }
  const icon = value ? MEMBER_ICON : FREE_TO_PLAY_ICON;
  const title = value ? "Members" : "Free-to-play";
  return `<span class="flex h-full w-full items-center justify-center"><img src="${iconUrl(icon)}" alt="${title}" title="${title}" width="16" height="16" loading="lazy" decoding="async" class="object-contain" onerror="this.style.opacity='0.15'"></span>`;
}

const NUMBER_FILTER = "agNumberColumnFilter";
const TEXT_FILTER = "agTextColumnFilter";

const NUMBER_FILTER_OPTIONS = [
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "inRange",
  "equals",
  "notEqual",
] as const;
const TEXT_FILTER_OPTIONS = [
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
  "equals",
  "notEqual",
] as const;

const NUMBER_ALLOWED_CHARS = "\\d.,\\-kmbKMB";

const NUMBER_FILTER_PARAMS: INumberFilterParams = {
  filterOptions: [...NUMBER_FILTER_OPTIONS],
  allowedCharPattern: NUMBER_ALLOWED_CHARS,
  numberParser: (text: string | null): number | null =>
    parseAbbreviatedNumber(text),
};
const TEXT_FILTER_PARAMS: ITextFilterParams = {
  filterOptions: [...TEXT_FILTER_OPTIONS],
};

const RAW_COLUMN_DEFS: RawColDef[] = [
  {
    colId: "name",
    field: "name",
    headerName: "Item",
    minWidth: 220,
    flex: 2,
    pinned: "left",
    cellRenderer: itemCellRenderer,
    sortable: true,
    filter: TEXT_FILTER,
    suppressHeaderMenuButton: false,
  },
  {
    colId: "buy",
    field: "buy",
    headerName: "Buy",
    cellRenderer: numberRenderer("buy", (v) => formatInt(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_INT,
  },
  {
    colId: "sell",
    field: "sell",
    headerName: "Sell",
    cellRenderer: numberRenderer("sell", (v) => formatInt(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_INT,
  },
  {
    colId: "margin",
    field: "margin",
    headerName: "Margin",
    cellRenderer: numberRenderer("margin", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    sort: "desc",
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "tax",
    field: "tax",
    headerName: "Tax",
    cellRenderer: numberRenderer("tax", (v) =>
      v > 0 ? `-${formatShort(v)}` : formatShort(v),
    ),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "roi",
    field: "roi",
    headerName: "ROI",
    cellRenderer: numberRenderer("roi", (v) => formatPercent(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_PERCENT,
  },
  {
    colId: "high24h",
    field: "high24h",
    headerName: "24h Avg Buy",
    headerTooltip: "Average insta-buy price over the latest 24h period",
    cellRenderer: numberRenderer("neutral", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "low24h",
    field: "low24h",
    headerName: "24h Avg Sell",
    headerTooltip: "Average insta-sell price over the latest 24h period",
    cellRenderer: numberRenderer("neutral", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "change24h",
    field: "change24h",
    headerName: "Buy vs 24h Avg",
    headerTooltip: "Current insta-buy vs the 24h average buy price",
    cellRenderer: numberRenderer("change", (v) => formatPercent(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_PERCENT,
  },
  {
    colId: "volume",
    field: "volume",
    headerName: "Volume",
    cellRenderer: numberRenderer("volume", (v) => formatInt(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_INT,
  },
  {
    colId: "limit",
    field: "limit",
    headerName: "Limit",
    cellRenderer: numberRenderer("neutral", (v) => formatInt(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_LIMIT,
  },
  {
    colId: "highalch",
    field: "highalch",
    headerName: "High Alch",
    hide: true,
    cellRenderer: numberRenderer("neutral", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "lowalch",
    field: "lowalch",
    headerName: "Low Alch",
    hide: true,
    cellRenderer: numberRenderer("neutral", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "marginXLimit",
    field: "marginXLimit",
    headerName: "Margin × Limit",
    cellRenderer: numberRenderer("margin", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "marginXVolume",
    field: "marginXVolume",
    headerName: "Margin × Vol",
    hide: true,
    cellRenderer: numberRenderer("margin", (v) => formatShort(v)),
    type: "rightAligned",
    sortable: true,
    filter: NUMBER_FILTER,
    widestValue: WIDEST_SHORT,
  },
  {
    colId: "members",
    field: "members",
    headerName: "Members",
    hide: true,
    cellRenderer: membersCellRenderer,
    cellStyle: { textAlign: "center" },
    sortable: true,
    filter: MembersFilter,
    widestValue: "",
  },
  {
    colId: "buyTime",
    field: "buyTime",
    headerName: "Last Buy",
    sortable: true,
    filter: RelativeTimeFilter,
    valueFormatter: (parameters: ValueFormatterParams<Item, number | null>) =>
      formatTimeAgoFromUnix(parameters.value),
    cellStyle: (parameters) => ({ color: tradeTimeColorVar(parameters.value) }),
    widestValue: WIDEST_TIME,
  },
  {
    colId: "sellTime",
    field: "sellTime",
    headerName: "Last Sell",
    sortable: true,
    filter: RelativeTimeFilter,
    valueFormatter: (parameters: ValueFormatterParams<Item, number | null>) =>
      formatTimeAgoFromUnix(parameters.value),
    cellStyle: (parameters) => ({ color: tradeTimeColorVar(parameters.value) }),
    widestValue: WIDEST_TIME,
  },
];

function withSharedFilterParams(definition: RawColDef): RawColDef {
  if (definition.filter === NUMBER_FILTER) {
    return { ...definition, filterParams: NUMBER_FILTER_PARAMS };
  }
  if (definition.filter === TEXT_FILTER) {
    return { ...definition, filterParams: TEXT_FILTER_PARAMS };
  }
  return definition;
}

const COLUMN_DEFS: ItemColDef[] = RAW_COLUMN_DEFS.map(
  withSharedFilterParams,
).map(withFitWidth);

const AUTO_SIZE_COLUMN_IDS: string[] = COLUMN_DEFS.map(
  (definition) => definition.colId,
).filter((colId) => colId !== "name");

export function getDefaultColumnState(): ColumnState[] {
  return COLUMN_DEFS.map((definition) => {
    const sort =
      definition.sort === "asc" || definition.sort === "desc"
        ? definition.sort
        : null;
    return {
      colId: definition.colId,
      hide: definition.hide === true,
      width: definition.width,
      flex: definition.flex,
      pinned: definition.pinned ?? null,
      sort,
      sortIndex: null,
    };
  });
}

export interface ColumnGroup {
  label: string;
  colIds: readonly string[];
}

export const COLUMN_GROUPS: readonly ColumnGroup[] = [
  { label: "Identity", colIds: ["name", "members"] },
  {
    label: "Prices",
    colIds: ["buy", "sell", "high24h", "low24h", "change24h"],
  },
  {
    label: "Profit",
    colIds: ["margin", "tax", "roi", "marginXLimit", "marginXVolume"],
  },
  {
    label: "Activity",
    colIds: ["volume", "buyTime", "sellTime", "limit"],
  },
  { label: "Alchemy", colIds: ["highalch", "lowalch"] },
];

function externalFilterPasses(item: Item): boolean {
  if (state === null) {
    return true;
  }
  if (state.watchOnly && !isWatched(item.id)) {
    return false;
  }
  return true;
}

function applyScope(): void {
  if (state === null) {
    return;
  }
  const shouldBypass = state.searchAll && state.search !== "";
  if (shouldBypass && !bypassing) {
    baseFilterModel = state.api.getFilterModel();
    bypassing = true;
    state.api.setFilterModel(null);
    state.api.onFilterChanged();
  } else if (!shouldBypass && bypassing) {
    bypassing = false;
    state.api.setFilterModel(baseFilterModel);
    baseFilterModel = null;
    state.api.onFilterChanged();
  }
}

function updateCounts(): void {
  if (state === null) {
    return;
  }
  const visible = state.api.paginationGetRowCount();
  const visibleEl = document.getElementById("visible-count");
  if (visibleEl !== null) {
    visibleEl.textContent = visible.toLocaleString("en-US");
  }
  dispatchPaginationChange();
  dispatchSearchResult();
}

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_PAGE_SIZE = 25;

const OPTIONS: GridOptions<Item> = {
  theme: GRID_THEME,
  columnDefs: COLUMN_DEFS,
  rowData: [],
  localeText: {
    noMatchingRows: "No matching items",
    noRowsToShow: "No matching items",
  },
  pagination: true,
  paginationPageSize: DEFAULT_PAGE_SIZE,
  paginationPageSizeSelector: false,
  suppressPaginationPanel: true,
  defaultColDef: {
    minWidth: DEFAULT_MIN_COLUMN_WIDTH,
    resizable: true,
    sortable: true,
    suppressHeaderMenuButton: false,
    suppressMovable: false,
    floatingFilter: false,
  },
  rowSelection: {
    mode: "singleRow",
    checkboxes: false,
    enableClickSelection: true,
  },
  suppressCellFocus: true,
  animateRows: false,
  getRowId: (parameters) => String(parameters.data.id),
};

export function initGrid(container: HTMLElement): GridApi<Item> {
  const api = createGrid<Item>(container, {
    ...OPTIONS,
    isExternalFilterPresent: () =>
      state !== null && state.watchOnly && !bypassing,
    doesExternalFilterPass: (node) => {
      if (node.data === undefined) {
        return false;
      }
      return externalFilterPasses(node.data);
    },
    onCellClicked: (event) => {
      if (event.data === undefined) {
        return;
      }
      const target = event.event?.target;
      if (
        target instanceof Element &&
        target.closest(".watch-toggle") !== null
      ) {
        event.event?.stopPropagation();
        toggleWatch(event.data.id);
        const node = event.api.getRowNode(String(event.data.id));
        if (node !== undefined) {
          event.api.refreshCells({
            force: true,
            columns: ["name"],
            rowNodes: [node],
          });
        }
        return;
      }
      window.dispatchEvent(
        new CustomEvent("detail:open", { detail: { itemId: event.data.id } }),
      );
    },
    onFilterOpened: (event) => {
      filterInputObserver?.disconnect();
      filterInputObserver = decorateFilterInputs(event.eGui);
    },
    onModelUpdated: updateCounts,
    onPaginationChanged: () => {
      updateCounts();
      notifyStateChange();
    },
    onFilterChanged: () => {
      updateCounts();
      notifyStateChange();
    },
    onSortChanged: notifyStateChange,
    onColumnMoved: notifyStateChange,
    onColumnResized: notifyStateChange,
    onColumnVisible: notifyStateChange,
    onColumnPinned: notifyStateChange,
  });

  const initialScope = readSearchScope();
  state = {
    api,
    watchOnly: initialScope === "watchlist",
    search: "",
    searchAll: initialScope === "all",
  };

  window.addEventListener("search:change", (event) => {
    const detail = (event as CustomEvent<{ value: string }>).detail;
    if (detail === undefined || state === null) {
      return;
    }
    state.search = detail.value.trim();
    api.setGridOption("quickFilterText", state.search);
    applyScope();
    api.refreshCells({ force: true, columns: ["name"] });
    notifyStateChange();
  });

  window.addEventListener("search-scope:change", (event) => {
    const detail = (event as CustomEvent<{ scope: SearchScope }>).detail;
    if (detail === undefined || state === null) {
      return;
    }
    state.searchAll = detail.scope === "all";
    state.watchOnly = detail.scope === "watchlist";
    applyScope();
    api.onFilterChanged();
    api.refreshCells({ force: true, columns: ["name"] });
    dispatchSearchResult();
  });

  window.addEventListener("page-size:change", (event) => {
    const detail = (event as CustomEvent<{ size: number }>).detail;
    if (detail === undefined) {
      return;
    }
    api.setGridOption("paginationPageSize", detail.size);
    notifyStateChange();
  });

  window.addEventListener("watchlist:change", () => {
    if (state?.watchOnly === true) {
      api.onFilterChanged();
    }
    api.refreshCells({ force: true, columns: ["name"] });
  });

  dispatchPaginationChange();

  return api;
}

export function setRowData(items: Item[]): void {
  totalItemCount = items.length;
  state?.api.setGridOption("rowData", items);
}

export function setStateChangeCallback(callback: (() => void) | null): void {
  stateChangeCallback = callback;
}

export function applyView(view: ViewState): void {
  if (state === null) {
    return;
  }

  bypassing = false;
  baseFilterModel = null;

  state.search = view.search;

  state.api.setGridOption("paginationPageSize", view.pageSize);
  state.api.setGridOption("quickFilterText", view.search);
  state.api.applyColumnState({
    state: view.columnState,
    applyOrder: true,
    defaultState: {
      sort: null,
      hide: false,
      pinned: null,
      width: undefined,
      flex: undefined,
    },
  });
  state.api.setFilterModel(view.filterModel);
  state.api.onFilterChanged();

  syncSearchInput(view.search);

  applyScope();

  state.api.autoSizeColumns(AUTO_SIZE_COLUMN_IDS, false);
}

export function captureViewState(): ViewState {
  if (state === null) {
    return {
      columnState: getDefaultColumnState(),
      filterModel: {},
      search: "",
      pageSize: FALLBACK_PAGE_SIZE,
    };
  }
  return {
    columnState: state.api.getColumnState(),
    filterModel: bypassing
      ? (baseFilterModel ?? {})
      : state.api.getFilterModel(),
    search: state.search,
    pageSize: state.api.paginationGetPageSize(),
  };
}

function syncSearchInput(value: string): void {
  const input = document.getElementById("search");
  if (input instanceof HTMLInputElement) {
    input.value = value;
  }
}

export type PinSide = "left" | "right" | null;

export interface ColumnVisibilityEntry {
  colId: string;
  headerName: string;
  hide: boolean;
  pinned: PinSide;
}

export function getColumnVisibility(): ColumnVisibilityEntry[] {
  return COLUMN_DEFS.map((definition) => {
    const colId = definition.colId;
    const column = state?.api.getColumn(colId) ?? null;
    const hide =
      column !== null ? !column.isVisible() : definition.hide === true;
    const livePinned = column !== null ? column.getPinned() : definition.pinned;
    const pinned: PinSide =
      livePinned === "left" ? "left" : livePinned === "right" ? "right" : null;
    return {
      colId,
      headerName:
        typeof definition.headerName === "string"
          ? definition.headerName
          : colId,
      hide,
      pinned,
    };
  });
}

export function setColumnVisible(colId: string, visible: boolean): void {
  state?.api.setColumnsVisible([colId], visible);
}

export function setColumnPinned(colId: string, side: PinSide): void {
  if (state === null) {
    return;
  }
  state.api.setColumnsPinned([colId], side);
}

export function getVisibleColumnCount(): number {
  return getColumnVisibility().filter((column) => !column.hide).length;
}

export function paginationNext(): void {
  state?.api.paginationGoToNextPage();
}

export function paginationPrev(): void {
  state?.api.paginationGoToPreviousPage();
}

export function paginationFirst(): void {
  state?.api.paginationGoToFirstPage();
}

export function paginationLast(): void {
  state?.api.paginationGoToLastPage();
}

const ALWAYS_VISIBLE_COLUMNS: readonly string[] = ["name"];

export function showAllColumns(): void {
  if (state === null) {
    return;
  }
  const ids: string[] = COLUMN_DEFS.map((definition) => definition.colId);
  state.api.setColumnsVisible(ids, true);
}

export function hideAllColumns(): void {
  if (state === null) {
    return;
  }
  const ids: string[] = COLUMN_DEFS.map(
    (definition) => definition.colId,
  ).filter((id) => !ALWAYS_VISIBLE_COLUMNS.includes(id));
  state.api.setColumnsVisible(ids, false);
}
