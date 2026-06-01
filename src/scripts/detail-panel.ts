import { disposeChart, renderChart, type ChartStats } from "./chart";
import { initMetricsReorder } from "./detail-metrics-order";
import {
  colorVarFor,
  formatInt,
  formatPercent,
  formatShort,
  formatSigned,
  formatTimeAgoFromUnix,
  FREE_TO_PLAY_ICON,
  iconUrl,
  MEMBER_ICON,
  tradeTimeColorVar,
} from "./format";
import type { Item, Timestep } from "./types";
import { isWatched, toggleWatch } from "./watchlist";

const GOOD_VOLUME_THRESHOLD = 5_000;

let itemsRef: Item[] = [];
let currentItem: Item | null = null;
let currentTimestep: Timestep = "5m";

export function setItems(items: Item[]): void {
  itemsRef = items;
  if (currentItem !== null) {
    const activeItem = currentItem;
    const updated = items.find((item) => item.id === activeItem.id);
    if (updated !== undefined) {
      currentItem = updated;
      renderHeader(updated);
      renderMetrics(updated);
      void loadChart(updated.id, currentTimestep, true);
    }
  }
}

export function init(): void {
  const panel = document.getElementById("detail-panel");
  if (panel === null) {
    return;
  }

  window.addEventListener("detail:open", (event) => {
    const detail = (event as CustomEvent<{ itemId: number }>).detail;
    if (detail === undefined) {
      return;
    }
    const panelElement = document.getElementById("detail-panel");
    const isOpen =
      panelElement !== null && !panelElement.classList.contains("hidden");
    if (isOpen && currentItem !== null && currentItem.id === detail.itemId) {
      closePanel();
      return;
    }
    openPanel(detail.itemId);
  });

  document
    .getElementById("detail-close")
    ?.addEventListener("click", closePanel);

  panel
    .querySelectorAll<HTMLButtonElement>(".timestep-pill")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const timestep = button.dataset.timestep as Timestep;
        currentTimestep = timestep;
        panel
          .querySelectorAll<HTMLButtonElement>(".timestep-pill")
          .forEach((pill) => {
            pill.setAttribute("aria-selected", String(pill === button));
          });
        if (currentItem !== null) {
          void loadChart(currentItem.id, timestep);
        }
      });
    });

  document.getElementById("detail-star")?.addEventListener("click", () => {
    if (currentItem === null) {
      return;
    }
    toggleWatch(currentItem.id);
    renderStar(currentItem);
  });

  initMetricsReorder();
}

function openPanel(itemId: number): void {
  const item = itemsRef.find((entry) => entry.id === itemId);
  if (item === undefined) {
    return;
  }
  currentItem = item;
  const panel = document.getElementById("detail-panel");
  if (panel !== null) {
    panel.classList.remove("hidden");
  }
  renderHeader(item);
  renderMetrics(item);
  void loadChart(item.id, currentTimestep);
}

function closePanel(): void {
  currentItem = null;
  const panel = document.getElementById("detail-panel");
  if (panel !== null) {
    panel.classList.add("hidden");
  }
  disposeChart();
}

function renderHeader(item: Item): void {
  setText("detail-name", item.name);
  setText("detail-id", `#${item.id}`);
  setText("detail-examine", item.examine);
  const memberElement = document.getElementById("detail-members");
  if (memberElement !== null && memberElement instanceof HTMLImageElement) {
    const membershipLabel = item.members ? "Members" : "Free-to-play";
    memberElement.src = iconUrl(item.members ? MEMBER_ICON : FREE_TO_PLAY_ICON);
    memberElement.alt = membershipLabel;
    memberElement.title = membershipLabel;
  }

  const iconElement = document.getElementById("detail-icon");
  if (iconElement !== null && iconElement instanceof HTMLImageElement) {
    iconElement.style.opacity = "1";
    iconElement.src = item.iconUrl;
    iconElement.alt = item.name;
  }

  renderStar(item);

  const wikiLink = document.getElementById("detail-wiki");
  if (wikiLink !== null && wikiLink instanceof HTMLAnchorElement) {
    wikiLink.href = `https://oldschool.runescape.wiki/w/${encodeURIComponent(item.name.replace(/ /g, "_"))}`;
  }
}

function renderStar(item: Item): void {
  const starElement = document.getElementById("detail-star");
  if (starElement === null) {
    return;
  }
  const watched = isWatched(item.id);
  starElement.setAttribute("aria-pressed", String(watched));
  starElement.style.color = watched
    ? "var(--color-warn)"
    : "var(--color-muted)";
  const svg = starElement.querySelector("svg");
  if (svg !== null) {
    svg.setAttribute("fill", watched ? "currentColor" : "none");
  }
}

function renderMetrics(item: Item): void {
  setMetric("m-buy", formatInt(item.buy), colorVarFor(item.buy, "buy"));
  setMetric("m-sell", formatInt(item.sell), colorVarFor(item.sell, "sell"));
  setMetric("m-avgbuy", formatShort(item.high24h), "var(--color-fg)");
  setMetric("m-avgsell", formatShort(item.low24h), "var(--color-fg)");
  setMetric(
    "m-margin",
    formatShort(item.margin),
    colorVarFor(item.margin, "margin"),
  );
  const taxPercent =
    item.buy !== null && item.buy > 0 ? (item.tax / item.buy) * 100 : 0;
  const taxDisplay =
    item.tax > 0
      ? `-${formatShort(item.tax)} (${taxPercent.toFixed(2)}%)`
      : formatShort(item.tax);
  setMetric("m-tax", taxDisplay, colorVarFor(item.tax, "tax"));
  setMetric("m-roi", formatPercent(item.roi), colorVarFor(item.roi, "roi"));
  setMetric(
    "m-potential",
    formatSigned(item.marginXLimit),
    colorVarFor(item.marginXLimit, "profit"),
  );
  setMetric(
    "m-change",
    formatPercent(item.change24h),
    colorVarFor(item.change24h, "change"),
  );
  setMetric(
    "m-volume",
    item.volume.toLocaleString("en-US"),
    item.volume >= GOOD_VOLUME_THRESHOLD
      ? "var(--color-accent)"
      : "var(--color-fg)",
  );
  setMetric(
    "m-limit",
    item.limit > 0 ? item.limit.toLocaleString("en-US") : "—",
    "var(--color-fg)",
  );
  setMetric(
    "m-last-buy",
    formatTimeAgoFromUnix(item.buyTime),
    tradeTimeColorVar(item.buyTime),
  );
  setMetric(
    "m-last-sell",
    formatTimeAgoFromUnix(item.sellTime),
    tradeTimeColorVar(item.sellTime),
  );
  setMetric(
    "m-margin-vol",
    formatSigned(item.marginXVolume),
    colorVarFor(item.marginXVolume, "profit"),
  );
  setMetric(
    "m-highalch",
    item.highalch > 0 ? formatShort(item.highalch) : "—",
    "var(--color-fg)",
  );
  setMetric(
    "m-lowalch",
    item.lowalch > 0 ? formatShort(item.lowalch) : "—",
    "var(--color-fg)",
  );
}

function renderChartStats(stats: ChartStats): void {
  setMetric(
    "chart-change",
    formatPercent(stats.changePercent),
    colorVarFor(stats.changePercent, "change"),
  );
  setMetric("chart-high", formatShort(stats.high), "var(--color-fg)");
  setMetric("chart-low", formatShort(stats.low), "var(--color-fg)");
  setMetric("chart-avg", formatShort(stats.average), "var(--color-fg)");
}

async function loadChart(
  itemId: number,
  timestep: Timestep,
  silent = false,
): Promise<void> {
  const container = document.getElementById("chart");
  if (container === null) {
    return;
  }
  try {
    const stats = await renderChart(container, itemId, timestep, { silent });
    if (stats !== null) {
      renderChartStats(stats);
    }
  } catch (error) {
    console.error("chart load failed", error);
  }
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element !== null) {
    element.textContent = value;
  }
}

function setMetric(id: string, value: string, color: string): void {
  const element = document.getElementById(id);
  if (element === null) {
    return;
  }
  element.textContent = value;
  element.style.color = color;
}
