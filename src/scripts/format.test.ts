import { describe, expect, it } from "vitest";
import {
  buildItemSlug,
  calculateTax,
  colorClassFor,
  colorVarFor,
  formatInt,
  formatPercent,
  formatShort,
  formatSigned,
  formatTimeAgo,
  formatTimeAgoFromUnix,
  iconUrl,
} from "./format";

describe("formatShort", () => {
  it("renders the em dash for nullish or non-finite input", () => {
    expect(formatShort(null)).toBe("—");
    expect(formatShort(undefined)).toBe("—");
    expect(formatShort(Number.NaN)).toBe("—");
    expect(formatShort(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("rounds values under 1000 with no suffix", () => {
    expect(formatShort(0)).toBe("0");
    expect(formatShort(999)).toBe("999");
    expect(formatShort(999.4)).toBe("999");
  });

  it("abbreviates thousands at one decimal, millions and billions at two", () => {
    expect(formatShort(1000)).toBe("1K");
    expect(formatShort(1500)).toBe("1.5K");
    expect(formatShort(1_000_000)).toBe("1M");
    expect(formatShort(1_234_567)).toBe("1.23M");
    expect(formatShort(1_234_000)).toBe("1.23M");
    expect(formatShort(1_000_000_000)).toBe("1B");
    expect(formatShort(1_623_456_789)).toBe("1.62B");
    expect(formatShort(2_147_483_647)).toBe("2.15B");
  });

  it("trims trailing zeros so exact millions and billions keep one decimal", () => {
    expect(formatShort(1_600_000)).toBe("1.6M");
    expect(formatShort(1_600_000_000)).toBe("1.6B");
  });

  it("keeps the sign for negatives", () => {
    expect(formatShort(-1500)).toBe("-1.5K");
    expect(formatShort(-1_623_456_789)).toBe("-1.62B");
  });
});

describe("formatSigned", () => {
  it("prefixes a plus for positive values only", () => {
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(5)).toBe("+5");
    expect(formatSigned(-5)).toBe("-5");
    expect(formatSigned(1500)).toBe("+1.5K");
    expect(formatSigned(null)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats with two decimals and a leading plus for positives", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(0)).toBe("0.00%");
    expect(formatPercent(5)).toBe("+5.00%");
    expect(formatPercent(-5)).toBe("-5.00%");
    expect(formatPercent(5.126)).toBe("+5.13%");
  });
});

describe("formatInt", () => {
  it("groups thousands with US separators", () => {
    expect(formatInt(null)).toBe("—");
    expect(formatInt(0)).toBe("0");
    expect(formatInt(1000)).toBe("1,000");
    expect(formatInt(1_234_567)).toBe("1,234,567");
    expect(formatInt(1234.6)).toBe("1,235");
  });
});

describe("formatTimeAgo", () => {
  it("guards nullish and negative input", () => {
    expect(formatTimeAgo(null)).toBe("—");
    expect(formatTimeAgo(-1)).toBe("—");
  });

  it("climbs the relative-time scale", () => {
    expect(formatTimeAgo(3)).toBe("just now");
    expect(formatTimeAgo(5)).toBe("5 seconds ago");
    expect(formatTimeAgo(59)).toBe("59 seconds ago");
    expect(formatTimeAgo(60)).toBe("1 minute ago");
    expect(formatTimeAgo(120)).toBe("2 minutes ago");
    expect(formatTimeAgo(3600)).toBe("1 hour ago");
    expect(formatTimeAgo(86_400)).toBe("1 day ago");
  });
});

describe("formatTimeAgoFromUnix", () => {
  it("derives seconds-ago from the provided clock", () => {
    expect(formatTimeAgoFromUnix(null)).toBe("—");
    // now = 100s; traded at 40s -> 60s ago -> "1 minute ago".
    expect(formatTimeAgoFromUnix(40, 100_000)).toBe("1 minute ago");
  });
});

describe("calculateTax", () => {
  it("applies the 2% GE fee with a floor and a cap", () => {
    expect(calculateTax(null)).toBe(0);
    expect(calculateTax(49)).toBe(0);
    expect(calculateTax(50)).toBe(1);
    expect(calculateTax(100)).toBe(2);
    expect(calculateTax(1_000_000)).toBe(20_000);
    expect(calculateTax(500_000_000)).toBe(5_000_000);
  });
});

describe("buildItemSlug", () => {
  it("replaces spaces with hyphens", () => {
    expect(buildItemSlug("Abyssal whip")).toBe("Abyssal-whip");
    expect(buildItemSlug("Saradomin's blessed sword")).toBe(
      "Saradomin's-blessed-sword",
    );
  });
});

describe("iconUrl", () => {
  it("builds a wiki image URL with underscores for spaces", () => {
    expect(iconUrl("Abyssal whip.png")).toBe(
      "https://oldschool.runescape.wiki/images/Abyssal_whip.png",
    );
    expect(iconUrl("Member icon.png")).toBe(
      "https://oldschool.runescape.wiki/images/Member_icon.png",
    );
  });
});

describe("colorClassFor", () => {
  it("colors profit-style kinds by sign and others neutral", () => {
    expect(colorClassFor(null, "margin")).toBe("text-muted-foreground");
    expect(colorClassFor(5, "margin")).toBe("text-accent");
    expect(colorClassFor(-5, "roi")).toBe("text-negative");
    expect(colorClassFor(0, "profit")).toBe("text-muted-foreground");
    expect(colorClassFor(5, "buy")).toBe("text-fg");
    expect(colorClassFor(5, "volume")).toBe("text-fg");
  });
});

describe("colorVarFor", () => {
  it("mirrors colorClassFor as CSS variables", () => {
    expect(colorVarFor(null, "roi")).toBe("var(--color-muted-foreground)");
    expect(colorVarFor(5, "roi")).toBe("var(--color-accent)");
    expect(colorVarFor(-5, "profit")).toBe("var(--color-negative)");
    expect(colorVarFor(5, "volume")).toBe("var(--color-fg)");
  });
});
