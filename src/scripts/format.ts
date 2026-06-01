import { isNullish } from "./nullish";

const ICONS_BASE = "https://oldschool.runescape.wiki/images";

export const MAX_GE_PRICE = 2_147_483_647;
export const MEMBER_ICON = "Member icon.png";
export const FREE_TO_PLAY_ICON = "Free-to-play icon.png";

// Thousands stay at one decimal; millions and billions carry a second decimal
// so large prices read precisely (e.g. 1.62M, 1.62B). Trailing zeros are still
// trimmed by trimDecimal, so exact values render as 1.6M / 1.6B.
const THOUSANDS_FRACTION_DIGITS = 1;
const MILLIONS_FRACTION_DIGITS = 2;
const BILLIONS_FRACTION_DIGITS = 2;

export function formatShort(value: number | null | undefined): string {
  if (isNullish(value) || !Number.isFinite(value)) {
    return "—";
  }

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs < 1000) {
    return `${sign}${Math.round(abs)}`;
  }
  if (abs < 1_000_000) {
    return `${sign}${trimDecimal((abs / 1000).toFixed(THOUSANDS_FRACTION_DIGITS))}K`;
  }
  if (abs < 1_000_000_000) {
    return `${sign}${trimDecimal((abs / 1_000_000).toFixed(MILLIONS_FRACTION_DIGITS))}M`;
  }
  return `${sign}${trimDecimal((abs / 1_000_000_000).toFixed(BILLIONS_FRACTION_DIGITS))}B`;
}

export function formatSigned(value: number | null | undefined): string {
  if (isNullish(value) || !Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  const formatted = formatShort(value);
  return value > 0 ? `+${formatted}` : formatted;
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (isNullish(value) || !Number.isFinite(value)) {
    return "—";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatInt(value: number | null | undefined): string {
  if (isNullish(value) || !Number.isFinite(value)) {
    return "—";
  }
  return Math.round(value).toLocaleString("en-US");
}

function trimDecimal(formatted: string): string {
  return formatted.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

const WEEKS_PER_MONTH = 4.345;

const RELATIVE_BUCKETS: Array<[number, string]> = [
  [60, "minute"],
  [60, "hour"],
  [24, "day"],
  [7, "week"],
  [WEEKS_PER_MONTH, "month"],
  [12, "year"],
];

export function formatTimeAgo(secondsAgo: number | null | undefined): string {
  if (isNullish(secondsAgo) || !Number.isFinite(secondsAgo) || secondsAgo < 0) {
    return "—";
  }
  if (secondsAgo < 5) {
    return "just now";
  }

  let value = secondsAgo;
  let unit = "second";
  for (const [divisor, nextUnit] of RELATIVE_BUCKETS) {
    if (value < divisor) {
      break;
    }
    value = value / divisor;
    unit = nextUnit;
  }
  const rounded = Math.floor(value);
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

export function formatTimeAgoFromUnix(
  unixSeconds: number | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (isNullish(unixSeconds)) {
    return "—";
  }
  return formatTimeAgo(nowMs / 1000 - unixSeconds);
}

export function formatClock(date: Date = new Date()): string {
  return date.toTimeString().slice(0, 8);
}

export function buildItemSlug(name: string): string {
  return name.replace(/ /g, "-");
}

export function iconUrl(icon: string): string {
  return `${ICONS_BASE}/${encodeURIComponent(icon.replace(/ /g, "_"))}`;
}

const TAX_DIVISOR = 50;
const TAX_CAP = 5_000_000;
const TAX_MIN_PRICE = 50;

export function calculateTax(buyPrice: number | null | undefined): number {
  if (isNullish(buyPrice) || buyPrice < TAX_MIN_PRICE) {
    return 0;
  }
  return Math.min(Math.floor(buyPrice / TAX_DIVISOR), TAX_CAP);
}

export type ValueKind =
  | "buy"
  | "sell"
  | "tax"
  | "margin"
  | "profit"
  | "roi"
  | "change"
  | "volume"
  | "neutral";

// Semantic color role a value resolves to, decoupled from how it is applied
type ColorKind = "accent" | "negative" | "muted" | "fg";

const COLOR_KIND_CLASS_MAP: Record<ColorKind, string> = {
  accent: "text-accent",
  negative: "text-negative",
  muted: "text-muted-foreground",
  fg: "text-fg",
};

const COLOR_KIND_CSS_VARIABLE_MAP: Record<ColorKind, string> = {
  accent: "var(--color-accent)",
  negative: "var(--color-negative)",
  muted: "var(--color-muted-foreground)",
  fg: "var(--color-fg)",
};

function colorKindFor(
  value: number | null | undefined,
  kind: ValueKind,
): ColorKind {
  if (isNullish(value)) {
    return "muted";
  }

  switch (kind) {
    case "margin":
    case "profit":
    case "roi":
      if (value > 0) {
        return "accent";
      }
      if (value < 0) {
        return "negative";
      }
      return "muted";
    case "buy":
    case "sell":
    case "tax":
    case "change":
    case "volume":
    case "neutral":
    default:
      return "fg";
  }
}

/**
 * Resolves the Tailwind text-color class for a value of the given {@link kind}.
 *
 * @param value - The numeric value (or nullish) being colored.
 * @param kind - The semantic column kind driving the coloring rules.
 * @returns A Tailwind `text-*` class name.
 */
export function colorClassFor(
  value: number | null | undefined,
  kind: ValueKind,
): string {
  return COLOR_KIND_CLASS_MAP[colorKindFor(value, kind)];
}

const RECENT_TRADE_SECONDS = 5 * 60;

/**
 * Resolves the CSS custom-property reference for a last-buy/last-sell trade
 * time: accent when the trade happened within the recent window, muted
 * otherwise. Mirrors the coloring used in the item detail panel.
 *
 * @param unixSeconds - The trade timestamp in Unix seconds, or nullish.
 * @param nowMs - The current time in milliseconds (defaults to now).
 * @returns A `var(--color-*)` string.
 */
export function tradeTimeColorVar(
  unixSeconds: number | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (
    !isNullish(unixSeconds) &&
    nowMs / 1000 - unixSeconds <= RECENT_TRADE_SECONDS
  ) {
    return "var(--color-accent)";
  }
  return "var(--color-muted)";
}

/**
 * Resolves the CSS custom-property reference (`var(--color-*)`) for a value of
 * the given {@link kind}, for inline-style sinks such as grid cell renderers.
 *
 * @param value - The numeric value (or nullish) being colored.
 * @param kind - The semantic column kind driving the coloring rules.
 * @returns A `var(--color-*)` string.
 */
export function colorVarFor(
  value: number | null | undefined,
  kind: ValueKind,
): string {
  return COLOR_KIND_CSS_VARIABLE_MAP[colorKindFor(value, kind)];
}
