import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from "vitest";
import type { ColDef, GridApi, GridOptions } from "ag-grid-community";
import type { Item } from "./types";

vi.mock("ag-grid-community", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ag-grid-community")>()),
  createGrid: vi.fn(),
}));

const WEB_FONT_ADVANCE = 0.6;
const FALLBACK_FONT_ADVANCE = 0.55;
const GRID_FONT_FAMILY = '"Geist Mono Variable", Consolas, monospace';
const FONT_FAILED_WARNING = "grid: web font failed to load";
const container = {} as HTMLElement;

interface WebFont {
  finishLoading: () => void;
  failLoading: (error: Error) => void;
}

interface ColumnWidth {
  width: number | undefined;
  minWidth: number | undefined;
}

type CreateGridMock = MockedFunction<
  (typeof import("ag-grid-community"))["createGrid"]
>;

function stubBrowser(loadedAtStart: boolean): WebFont {
  let loaded = loadedAtStart;
  let finishLoading: () => void = () => {};
  let failLoading: (error: Error) => void = () => {};
  const pendingLoad = new Promise<FontFace[]>((resolve, reject) => {
    finishLoading = () => {
      loaded = true;
      resolve([]);
    };
    failLoading = reject;
  });
  const context = {
    font: "",
    measureText(text: string) {
      const advance = loaded ? WEB_FONT_ADVANCE : FALLBACK_FONT_ADVANCE;
      return { width: text.length * Number.parseFloat(this.font) * advance };
    },
  };
  vi.stubGlobal("document", {
    body: {},
    documentElement: {},
    createElement: () => ({ getContext: () => context }),
    fonts: { load: () => (loaded ? Promise.resolve([]) : pendingLoad) },
  });
  vi.stubGlobal("getComputedStyle", () => ({ fontFamily: GRID_FONT_FAMILY }));
  vi.stubGlobal("window", new EventTarget());
  return { finishLoading, failLoading };
}

async function importGrid() {
  const { createGrid } = await import("ag-grid-community");
  const createGridMock: CreateGridMock = vi.mocked(createGrid);
  createGridMock.mockReset();
  createGridMock.mockReturnValue({
    paginationGetCurrentPage: () => 0,
    paginationGetTotalPages: () => 0,
    paginationGetRowCount: () => 0,
    paginationGetPageSize: () => 0,
  } as unknown as GridApi);
  const grid = await import("./grid");
  return { createGridMock, grid };
}

function columnWidthsOf(
  createGridMock: CreateGridMock,
): Record<string, ColumnWidth> {
  const options = createGridMock.mock.lastCall?.[1] as GridOptions<Item>;
  const definitions = (options.columnDefs ?? []) as ColDef<Item>[];
  return Object.fromEntries(
    definitions.map((definition): [string, ColumnWidth] => [
      definition.colId ?? "",
      { width: definition.width, minWidth: definition.minWidth },
    ]),
  );
}

describe("initGrid column widths", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sizes the columns the same whether the web font has loaded or is still loading", async () => {
    stubBrowser(true);
    const loadedAtStart = await importGrid();
    await loadedAtStart.grid.initGrid(container);
    const widthsWithLoadedFont = columnWidthsOf(loadedAtStart.createGridMock);

    vi.resetModules();
    vi.unstubAllGlobals();
    const webFont = stubBrowser(false);
    const loadingAtStart = await importGrid();
    const gridReady = loadingAtStart.grid.initGrid(container);
    webFont.finishLoading();
    await gridReady;

    expect(columnWidthsOf(loadingAtStart.createGridMock)).toEqual(
      widthsWithLoadedFont,
    );
  });

  it("waits for the web font at most FONT_LOAD_TIMEOUT_MS", async () => {
    vi.useFakeTimers();
    stubBrowser(false);
    const { createGridMock, grid } = await importGrid();

    const gridReady = grid.initGrid(container);
    await vi.advanceTimersByTimeAsync(grid.FONT_LOAD_TIMEOUT_MS - 1);
    expect(createGridMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await gridReady;

    expect(createGridMock).toHaveBeenCalledTimes(1);
  });

  it("creates the grid and warns when the web font fails to load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loadError = new DOMException(
      "A network error occurred.",
      "NetworkError",
    );
    const webFont = stubBrowser(false);
    const { createGridMock, grid } = await importGrid();

    const gridReady = grid.initGrid(container);
    webFont.failLoading(loadError);
    await gridReady;

    expect(createGridMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(FONT_FAILED_WARNING, loadError);
  });
});
