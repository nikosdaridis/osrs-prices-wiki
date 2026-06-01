import { describe, expect, it } from "vitest";
import { isNullish, isPresent } from "./nullish";

describe("isNullish", () => {
  it("is true for null and undefined", () => {
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
  });

  it("is false for present values, including falsy ones", () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish("")).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish(Number.NaN)).toBe(false);
  });
});

describe("isPresent", () => {
  it("is the negation of isNullish", () => {
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
    expect(isPresent(0)).toBe(true);
    expect(isPresent("")).toBe(true);
    expect(isPresent(false)).toBe(true);
  });
});
