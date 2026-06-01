import { describe, expect, it } from "vitest";
import { parseAbbreviatedNumber } from "./parse-number";

describe("parseAbbreviatedNumber", () => {
  it("returns null for empty or null input", () => {
    expect(parseAbbreviatedNumber(null)).toBeNull();
    expect(parseAbbreviatedNumber("")).toBeNull();
    expect(parseAbbreviatedNumber("   ")).toBeNull();
  });

  it("expands k/m/b suffixes (case-insensitive)", () => {
    expect(parseAbbreviatedNumber("10k")).toBe(10_000);
    expect(parseAbbreviatedNumber("10K")).toBe(10_000);
    expect(parseAbbreviatedNumber("1m")).toBe(1_000_000);
    expect(parseAbbreviatedNumber("1.4b")).toBe(1_400_000_000);
    expect(parseAbbreviatedNumber("1.5k")).toBe(1500);
  });

  it("strips thousands separators and surrounding whitespace", () => {
    expect(parseAbbreviatedNumber("1,000")).toBe(1000);
    expect(parseAbbreviatedNumber("1,234,567")).toBe(1_234_567);
    expect(parseAbbreviatedNumber(" 2b ")).toBe(2_000_000_000);
  });

  it("handles plain and negative numbers", () => {
    expect(parseAbbreviatedNumber("5")).toBe(5);
    expect(parseAbbreviatedNumber("-5")).toBe(-5);
    expect(parseAbbreviatedNumber("-2k")).toBe(-2000);
    expect(parseAbbreviatedNumber("1.5")).toBe(1.5);
  });

  it("rejects trailing garbage instead of silently parsing a prefix", () => {
    expect(parseAbbreviatedNumber("5x")).toBeNull();
    expect(parseAbbreviatedNumber("abc")).toBeNull();
    expect(parseAbbreviatedNumber("-")).toBeNull();
    expect(parseAbbreviatedNumber(".")).toBeNull();
  });
});
