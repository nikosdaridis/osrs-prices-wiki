import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as echarts from "echarts/core";
import { fetchTimeseries } from "./api";
import { disposeChart, renderChart } from "./chart";
import type { TimeseriesResponse } from "./types";

vi.mock("./api", () => ({ fetchTimeseries: vi.fn() }));
vi.mock("echarts/core", () => ({ init: vi.fn(), use: vi.fn() }));
vi.mock("echarts/charts", () => ({ BarChart: {}, LineChart: {} }));
vi.mock("echarts/components", () => ({
  DataZoomComponent: {},
  GridComponent: {},
  MarkLineComponent: {},
  TooltipComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));
vi.mock("echarts/features", () => ({ LegacyGridContainLabel: {} }));

const ITEM_ID = 4151;
const container = {} as HTMLElement;
const timeseriesResponse: TimeseriesResponse = {
  data: [
    {
      timestamp: 1,
      avgHighPrice: 1_400_000,
      avgLowPrice: 1_350_000,
      highPriceVolume: 10,
      lowPriceVolume: 8,
    },
  ],
};

function useFakeChart() {
  const chart = {
    getDom: vi.fn(() => container),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    setOption: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
  };
  vi.mocked(echarts.init).mockReturnValueOnce(
    chart as unknown as echarts.ECharts,
  );
  return chart;
}

function holdNextTimeseries(): () => void {
  let release: () => void = () => {};
  vi.mocked(fetchTimeseries).mockImplementationOnce(
    () =>
      new Promise<TimeseriesResponse>((resolve) => {
        release = () => resolve(timeseriesResponse);
      }),
  );
  return () => release();
}

describe("renderChart", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    disposeChart();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("ignores data that arrives after the panel closed", async () => {
    const chart = useFakeChart();
    const releaseTimeseries = holdNextTimeseries();
    const render = renderChart(container, ITEM_ID, "5m");

    disposeChart();
    releaseTimeseries();

    await expect(render).resolves.toBeNull();
    expect(chart.setOption).not.toHaveBeenCalled();
    expect(chart.hideLoading).not.toHaveBeenCalled();
  });

  it("leaves the loading mask to the newest render", async () => {
    const chart = useFakeChart();
    const releaseFiveMinute = holdNextTimeseries();
    const releaseOneHour = holdNextTimeseries();
    const fiveMinuteRender = renderChart(container, ITEM_ID, "5m");
    const oneHourRender = renderChart(container, ITEM_ID, "1h");

    releaseFiveMinute();
    await expect(fiveMinuteRender).resolves.toBeNull();
    expect(chart.hideLoading).not.toHaveBeenCalled();

    releaseOneHour();
    await expect(oneHourRender).resolves.toMatchObject({ high: 1_400_000 });
    expect(chart.setOption).toHaveBeenCalledTimes(1);
    expect(chart.hideLoading).toHaveBeenCalledTimes(1);
  });

  it("keeps a reopened chart's mask until its own data arrives", async () => {
    const closedChart = useFakeChart();
    const reopenedChart = useFakeChart();
    const releaseClosed = holdNextTimeseries();
    const releaseReopened = holdNextTimeseries();
    const closedRender = renderChart(container, ITEM_ID, "5m");
    disposeChart();
    const reopenedRender = renderChart(container, ITEM_ID, "5m");

    releaseClosed();
    await expect(closedRender).resolves.toBeNull();
    expect(closedChart.hideLoading).not.toHaveBeenCalled();
    expect(reopenedChart.hideLoading).not.toHaveBeenCalled();

    releaseReopened();
    await expect(reopenedRender).resolves.toMatchObject({ high: 1_400_000 });
    expect(reopenedChart.setOption).toHaveBeenCalledTimes(1);
    expect(reopenedChart.hideLoading).toHaveBeenCalledTimes(1);
  });
});
