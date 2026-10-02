import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetch24h, fetchLatest, fetchMapping } from "./api";
import { deriveItem, POLL_INTERVAL_MS, startPolling } from "./poll";
import type {
  AveragePriceEntry,
  AveragePriceResponse,
  LatestEntry,
  LatestResponse,
  MappingEntry,
} from "./types";

vi.mock("./api", () => ({
  fetchMapping: vi.fn(),
  fetchLatest: vi.fn(),
  fetch24h: vi.fn(),
}));

const baseEntry: MappingEntry = {
  id: 4151,
  name: "Abyssal whip",
  examine: "A weapon once wielded by Abyssal demons.",
  icon: "Abyssal whip.png",
  members: true,
  limit: 70,
  lowalch: 72_000,
  highalch: 108_000,
};

describe("deriveItem", () => {
  it("computes all derived metrics from full data", () => {
    const latest: LatestEntry = {
      high: 2_000_000,
      highTime: 1_700_000_000,
      low: 1_900_000,
      lowTime: 1_700_000_100,
    };
    const average: AveragePriceEntry = {
      avgHighPrice: 1_950_000,
      avgLowPrice: 1_850_000,
      highPriceVolume: 100,
      lowPriceVolume: 200,
    };

    const item = deriveItem(baseEntry, latest, average);

    expect(item.buy).toBe(2_000_000);
    expect(item.sell).toBe(1_900_000);
    expect(item.tax).toBe(40_000);
    expect(item.margin).toBe(60_000);
    expect(item.roi).toBeCloseTo(3.157_894_7, 5);
    expect(item.high24h).toBe(1_950_000);
    expect(item.low24h).toBe(1_850_000);
    expect(item.volume).toBe(300);
    expect(item.change24h).toBeCloseTo(2.564_102_5, 5);
    expect(item.marginXLimit).toBe(4_200_000);
    expect(item.marginXVolume).toBe(18_000_000);

    expect(item.id).toBe(4151);
    expect(item.slug).toBe("Abyssal-whip");
    expect(item.members).toBe(true);
    expect(item.limit).toBe(70);
    expect(item.highalch).toBe(108_000);
    expect(item.buyTime).toBe(1_700_000_000);
  });

  it("yields null metrics for an untraded item with no snapshot", () => {
    const item = deriveItem(baseEntry, undefined, undefined);

    expect(item.buy).toBeNull();
    expect(item.sell).toBeNull();
    expect(item.tax).toBe(0);
    expect(item.margin).toBeNull();
    expect(item.roi).toBeNull();
    expect(item.high24h).toBeNull();
    expect(item.volume).toBe(0);
    expect(item.change24h).toBeNull();
    expect(item.marginXLimit).toBeNull();
    expect(item.marginXVolume).toBeNull();
    expect(item.buyTime).toBeNull();
  });

  it("charges no tax on a tax-exempt item", () => {
    const lobsterEntry: MappingEntry = {
      id: 379,
      name: "Lobster",
      examine: "This looks tricky to eat.",
      icon: "Lobster.png",
      members: false,
      limit: 13_000,
    };
    const latest: LatestEntry = {
      high: 114,
      highTime: 1,
      low: 108,
      lowTime: 1,
    };

    const item = deriveItem(lobsterEntry, latest, undefined);

    expect(item.tax).toBe(0);
    expect(item.conversionFee).toBe(0);
    expect(item.margin).toBe(6);
    expect(item.marginXLimit).toBe(78_000);
  });

  it("takes the bond's conversion fee instead of tax from its margin", () => {
    const bondEntry: MappingEntry = {
      id: 13190,
      name: "Old school bond",
      examine: "This bond can be redeemed for membership.",
      icon: "Old school bond.png",
      members: false,
      limit: 100,
    };
    const latest: LatestEntry = {
      high: 11_338_228,
      highTime: 1,
      low: 11_133_164,
      lowTime: 1,
    };

    const item = deriveItem(bondEntry, latest, undefined);

    expect(item.tax).toBe(0);
    expect(item.conversionFee).toBe(1_133_823);
    expect(item.margin).toBe(-928_759);
    expect(item.roi).toBeCloseTo(-8.342_1, 3);
    expect(item.marginXLimit).toBe(-92_875_900);
  });

  it("guards ROI against a zero sell price", () => {
    const latest: LatestEntry = {
      high: 100,
      highTime: 1,
      low: 0,
      lowTime: 1,
    };

    const item = deriveItem(baseEntry, latest, undefined);

    expect(item.margin).toBe(98);
    expect(item.roi).toBeNull();
  });

  it("treats a missing buy limit as zero (no margin × limit)", () => {
    const { limit: _omitLimit, ...entryWithoutLimit } = baseEntry;
    const latest: LatestEntry = {
      high: 200,
      highTime: 1,
      low: 100,
      lowTime: 1,
    };

    const item = deriveItem(entryWithoutLimit, latest, undefined);

    expect(item.limit).toBe(0);
    expect(item.marginXLimit).toBeNull();
  });
});

describe("startPolling", () => {
  const latestResponse: LatestResponse = {
    data: {
      "4151": { high: 2_000_000, highTime: 1, low: 1_900_000, lowTime: 1 },
    },
  };
  const averageResponse: AveragePriceResponse = { timestamp: 1, data: {} };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchMapping).mockResolvedValue([baseEntry]);
    vi.mocked(fetchLatest).mockResolvedValue(latestResponse);
    vi.mocked(fetch24h).mockResolvedValue(averageResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("waits a full interval before the first refresh", async () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    const stop = startPolling(onUpdate, onError);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
    expect(fetchLatest).not.toHaveBeenCalled();
    expect(fetch24h).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchLatest).toHaveBeenCalledTimes(1);
    expect(fetch24h).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0]?.[0]).toMatchObject([
      { id: 4151, buy: 2_000_000 },
    ]);
    expect(onError).not.toHaveBeenCalled();

    stop();
  });
});
