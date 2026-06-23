import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { LegacyGridContainLabel } from "echarts/features";

import { fetchTimeseries } from "./api";
import { formatInt, formatShort } from "./format";
import { isPresent } from "./nullish";
import {
  COLOR_ACCENT,
  COLOR_ACCENT_BAR,
  COLOR_ACCENT_FILL_MEDIUM,
  COLOR_ACCENT_FILL_NONE,
  COLOR_ACCENT_FILL_STRONG,
  COLOR_ACCENT_SELECTION,
  COLOR_AXIS_LABEL,
  COLOR_BG,
  COLOR_BORDER,
  COLOR_CHART_MASK,
  COLOR_CROSSHAIR,
  COLOR_FG,
  COLOR_LABEL_TEXT,
  COLOR_MUTED_TEXT,
  COLOR_NEGATIVE,
  COLOR_NEGATIVE_BAR,
  COLOR_ROW_BORDER,
} from "./theme";
import type { Timestep, TimeseriesPoint } from "./types";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
  LegacyGridContainLabel,
]);

const VOLUME_AXIS_HEADROOM = 4;
const SLIDER_HEIGHT_PX = 16;
const SLIDER_BOTTOM_PX = 8;
const GRID_BOTTOM_INSET_PX = 52;

let chartInstance: echarts.ECharts | null = null;
let resizeHandler: (() => void) | null = null;
let latestRenderId = 0;

export interface ChartStats {
  current: number | null;
  high: number | null;
  low: number | null;
  average: number | null;
  changePercent: number | null;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function padToTwoDigits(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function makeAxisFormatter(timestep: Timestep): (value: number) => string {
  return (value: number) => {
    const date = new Date(value);
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
    const dateLabel = `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
    const timeLabel = `${padToTwoDigits(date.getHours())}:${padToTwoDigits(date.getMinutes())}`;
    switch (timestep) {
      case "5m":
      case "1h":
        return isMidnight ? dateLabel : timeLabel;
      case "6h":
      case "24h":
        return dateLabel;
    }
  };
}

function formatTooltipDate(timestamp: number, timestep: Timestep): string {
  const date = new Date(timestamp);
  const month = MONTH_SHORT[date.getMonth()];
  const day = date.getDate();
  const hour = padToTwoDigits(date.getHours());
  const minute = padToTwoDigits(date.getMinutes());
  switch (timestep) {
    case "5m":
    case "1h":
      return `${WEEKDAY_SHORT[date.getDay()]} ${month} ${day} · ${hour}:${minute}`;
    case "6h":
      return `${month} ${day} · ${hour}:${minute}`;
    case "24h":
      return `${month} ${day}, ${date.getFullYear()}`;
  }
}

export interface RenderChartOptions {
  silent?: boolean;
}

export async function renderChart(
  container: HTMLElement,
  itemId: number,
  timestep: Timestep,
  options: RenderChartOptions = {},
): Promise<ChartStats | null> {
  if (chartInstance === null || chartInstance.getDom() !== container) {
    if (chartInstance !== null) {
      chartInstance.dispose();
    }
    chartInstance = echarts.init(container, undefined, { renderer: "canvas" });
    if (resizeHandler !== null) {
      window.removeEventListener("resize", resizeHandler);
    }
    resizeHandler = () => chartInstance?.resize();
    window.addEventListener("resize", resizeHandler);
  }

  const renderId = ++latestRenderId;
  const silent = options.silent === true;

  if (!silent) {
    chartInstance.showLoading({
      text: "",
      color: COLOR_ACCENT,
      textColor: COLOR_FG,
      maskColor: COLOR_CHART_MASK,
    });
  }

  let stats: ChartStats = {
    current: null,
    high: null,
    low: null,
    average: null,
    changePercent: null,
  };

  try {
    const response = await fetchTimeseries(itemId, timestep);
    if (renderId !== latestRenderId) {
      return null;
    }
    const points = response.data;
    const buySeries: [number, number | null][] = [];
    const sellSeries: [number, number | null][] = [];
    const buyVolumeSeries: [number, number][] = [];
    const sellVolumeSeries: [number, number][] = [];
    let maxVolume = 0;
    for (const point of points) {
      const timestampMs = point.timestamp * 1000;
      const buyVolume = point.highPriceVolume ?? 0;
      const sellVolume = point.lowPriceVolume ?? 0;
      buySeries.push([timestampMs, point.avgHighPrice]);
      sellSeries.push([timestampMs, point.avgLowPrice]);
      buyVolumeSeries.push([timestampMs, buyVolume]);
      sellVolumeSeries.push([timestampMs, sellVolume]);
      const totalVolume = buyVolume + sellVolume;
      if (totalVolume > maxVolume) {
        maxVolume = totalVolume;
      }
    }
    const volumeAxisMax = maxVolume > 0 ? maxVolume * VOLUME_AXIS_HEADROOM : 1;

    stats = computeStats(points);

    const axisFormatter = makeAxisFormatter(timestep);
    const tooltipDate = (timestamp: number) =>
      formatTooltipDate(timestamp, timestep);

    const dataZoomControls = [
      {
        type: "inside",
        filterMode: "none",
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
        preventDefaultMouseMove: true,
      },
      {
        type: "slider",
        height: SLIDER_HEIGHT_PX,
        bottom: SLIDER_BOTTOM_PX,
        brushSelect: false,
        backgroundColor: "transparent",
        borderColor: "transparent",
        fillerColor: COLOR_ACCENT_SELECTION,
        dataBackground: {
          lineStyle: { color: COLOR_BORDER },
          areaStyle: { color: COLOR_ROW_BORDER },
        },
        selectedDataBackground: {
          lineStyle: { color: COLOR_ACCENT },
          areaStyle: { color: COLOR_ACCENT_FILL_MEDIUM },
        },
        handleStyle: { color: COLOR_ACCENT, borderColor: COLOR_ACCENT },
        moveHandleStyle: { color: COLOR_ACCENT },
        textStyle: { color: COLOR_MUTED_TEXT, fontSize: 11 },
        showDetail: false,
      },
    ];

    chartInstance.setOption(
      {
        grid: {
          left: 4,
          right: 4,
          top: 8,
          bottom: GRID_BOTTOM_INSET_PX,
          containLabel: true,
        },
        xAxis: {
          type: "time",
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: COLOR_AXIS_LABEL,
            fontSize: 12,
            hideOverlap: true,
            formatter: axisFormatter,
          },
          splitLine: { show: false },
          axisPointer: {
            label: {
              formatter: (parameters: { value: number }) =>
                tooltipDate(parameters.value),
            },
          },
        },
        yAxis: [
          {
            type: "value",
            scale: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
              color: COLOR_AXIS_LABEL,
              fontSize: 12,
              formatter: (value: number) => formatShort(value),
            },
            splitLine: {
              lineStyle: { color: COLOR_ROW_BORDER, type: "dashed" },
            },
            axisPointer: {
              label: {
                formatter: (parameters: { value: number }) =>
                  formatShort(parameters.value),
              },
            },
          },
          {
            type: "value",
            min: 0,
            max: volumeAxisMax,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false },
            axisPointer: { show: false },
          },
        ],
        axisPointer: { link: [{ xAxisIndex: "all" }], snap: true },
        tooltip: {
          trigger: "axis",
          backgroundColor: COLOR_BG,
          borderColor: COLOR_BORDER,
          borderWidth: 1,
          padding: 8,
          textStyle: { color: COLOR_FG, fontSize: 13, fontFamily: "inherit" },
          axisPointer: {
            type: "cross",
            snap: true,
            lineStyle: { color: COLOR_CROSSHAIR, type: "dashed" },
            crossStyle: { color: COLOR_CROSSHAIR, type: "dashed" },
            label: {
              backgroundColor: COLOR_BG,
              borderColor: COLOR_BORDER,
              borderWidth: 1,
              color: COLOR_FG,
              fontSize: 11,
            },
          },
          formatter: (parameters: unknown) =>
            tooltipFormatter(parameters, points, tooltipDate),
        },
        ...(silent ? {} : { dataZoom: dataZoomControls }),
        series: [
          {
            name: "Buy",
            type: "line",
            data: buySeries,
            showSymbol: false,
            smooth: 0.2,
            connectNulls: true,
            sampling: "lttb",
            lineStyle: { color: COLOR_ACCENT, width: 1.5 },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: COLOR_ACCENT_FILL_STRONG },
                  { offset: 1, color: COLOR_ACCENT_FILL_NONE },
                ],
              },
            },
            z: 2,
            markLine:
              stats.current !== null
                ? {
                    silent: true,
                    symbol: ["none", "none"],
                    lineStyle: {
                      color: COLOR_ACCENT,
                      type: "dashed",
                      width: 1,
                      opacity: 0.45,
                    },
                    label: {
                      show: false,
                    },
                    data: [{ yAxis: stats.current }],
                  }
                : undefined,
          },
          {
            name: "Sell",
            type: "line",
            data: sellSeries,
            showSymbol: false,
            smooth: 0.2,
            connectNulls: true,
            sampling: "lttb",
            lineStyle: {
              color: COLOR_NEGATIVE,
              width: 1,
              type: "dashed",
              opacity: 0.7,
            },
            z: 1,
          },
          {
            name: "Buy Vol",
            type: "bar",
            xAxisIndex: 0,
            yAxisIndex: 1,
            stack: "volume",
            data: buyVolumeSeries,
            barWidth: "60%",
            itemStyle: { color: COLOR_ACCENT_BAR },
            z: 0,
            silent: true,
          },
          {
            name: "Sell Vol",
            type: "bar",
            xAxisIndex: 0,
            yAxisIndex: 1,
            stack: "volume",
            data: sellVolumeSeries,
            barWidth: "60%",
            itemStyle: { color: COLOR_NEGATIVE_BAR },
            z: 0,
            silent: true,
          },
        ],
        animation: false,
      },
      silent
        ? { notMerge: false, replaceMerge: ["series"] }
        : { notMerge: true },
    );
  } finally {
    chartInstance.hideLoading();
  }

  return stats;
}

function computeStats(points: TimeseriesPoint[]): ChartStats {
  let count = 0;
  let sum = 0;
  let high = -Infinity;
  let low = Infinity;
  let first: number | null = null;
  let current: number | null = null;

  for (const point of points) {
    const buy = point.avgHighPrice;
    if (!isPresent(buy)) {
      continue;
    }
    if (count === 0) {
      first = buy;
    }
    current = buy;
    count += 1;
    sum += buy;
    if (buy > high) {
      high = buy;
    }
    if (buy < low) {
      low = buy;
    }
  }

  if (count === 0) {
    return {
      current: null,
      high: null,
      low: null,
      average: null,
      changePercent: null,
    };
  }

  const average = Math.round(sum / count);
  const changePercent =
    isPresent(first) && first > 0 && isPresent(current)
      ? ((current - first) / first) * 100
      : null;
  return { current, high, low, average, changePercent };
}

// Shape of echarts axis-tooltip callback entries; echarts types the formatter
// parameter as unknown, so this is asserted once after the Array.isArray check.
interface TooltipSeriesParameter {
  axisValue: number;
  dataIndex: number;
  seriesName: string;
  value: [number, number | null];
}

function tooltipFormatter(
  parameters: unknown,
  points: TimeseriesPoint[],
  dateFunction: (timestamp: number) => string,
): string {
  if (!Array.isArray(parameters)) {
    return "";
  }
  const typedParameters = parameters as TooltipSeriesParameter[];
  const first = typedParameters[0];
  if (first === undefined) {
    return "";
  }
  const dateString = dateFunction(first.axisValue);
  const point = points[first.dataIndex];

  let buyValue: number | null = null;
  let sellValue: number | null = null;
  for (const entry of typedParameters) {
    if (entry.seriesName === "Buy") {
      buyValue = entry.value[1];
    } else if (entry.seriesName === "Sell") {
      sellValue = entry.value[1];
    }
  }

  const buyDisplay = buyValue === null ? "—" : formatInt(buyValue);
  const sellDisplay = sellValue === null ? "—" : formatInt(sellValue);

  const buyVolume = point !== undefined ? point.highPriceVolume : 0;
  const sellVolume = point !== undefined ? point.lowPriceVolume : 0;
  const buyVolumeDisplay = buyVolume > 0 ? formatInt(buyVolume) : "—";
  const sellVolumeDisplay = sellVolume > 0 ? formatInt(sellVolume) : "—";

  return `<div style="font-size:12px; color:${COLOR_AXIS_LABEL}; margin-bottom:6px; letter-spacing:0.02em">${dateString}</div>
<table style="border-collapse:collapse">
    <tr>
        <td style="padding-right:10px"><span style="color:${COLOR_ACCENT}">●</span></td>
        <td style="padding-right:14px; color:${COLOR_LABEL_TEXT}">Buy</td>
        <td style="text-align:right; color:${COLOR_FG}; font-weight:600">${buyDisplay}</td>
    </tr>
    <tr>
        <td style="padding-right:10px"><span style="color:${COLOR_NEGATIVE}">●</span></td>
        <td style="padding-right:14px; color:${COLOR_LABEL_TEXT}">Sell</td>
        <td style="text-align:right; color:${COLOR_FG}; font-weight:600">${sellDisplay}</td>
    </tr>
    <tr>
        <td></td>
        <td style="padding-right:14px; color:${COLOR_AXIS_LABEL}">Buy Vol</td>
        <td style="text-align:right; color:${COLOR_MUTED_TEXT}">${buyVolumeDisplay}</td>
    </tr>
    <tr>
        <td></td>
        <td style="padding-right:14px; color:${COLOR_AXIS_LABEL}">Sell Vol</td>
        <td style="text-align:right; color:${COLOR_MUTED_TEXT}">${sellVolumeDisplay}</td>
    </tr>
</table>`;
}

export function disposeChart(): void {
  if (resizeHandler !== null) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  chartInstance?.dispose();
  chartInstance = null;
}
