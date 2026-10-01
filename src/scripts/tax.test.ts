import { describe, expect, it } from "vitest";
import { calculateConversionFee, calculateTax } from "./tax";

const ABYSSAL_WHIP_ID = 4151;
const OLD_SCHOOL_BOND_ID = 13190;
const GLASSBLOWING_PIPE_ID = 1785;
const ENERGY_POTION_1_DOSE_ID = 3014;
const GAMES_NECKLACE_8_ID = 3853;
const EMPTY_WATERING_CAN_ID = 5331;
const POISONED_BRONZE_ARROW_ID = 883;
const PRICE_ABOVE_32_BIT = 8_450_000_000;

describe("calculateTax", () => {
  it("applies the 2% GE fee with a floor and a cap", () => {
    expect(calculateTax(null, ABYSSAL_WHIP_ID)).toBe(0);
    expect(calculateTax(49, ABYSSAL_WHIP_ID)).toBe(0);
    expect(calculateTax(50, ABYSSAL_WHIP_ID)).toBe(1);
    expect(calculateTax(100, ABYSSAL_WHIP_ID)).toBe(2);
    expect(calculateTax(1_000_000, ABYSSAL_WHIP_ID)).toBe(20_000);
    expect(calculateTax(500_000_000, ABYSSAL_WHIP_ID)).toBe(5_000_000);
    expect(calculateTax(PRICE_ABOVE_32_BIT, ABYSSAL_WHIP_ID)).toBe(5_000_000);
  });

  it("charges nothing for tax-exempt items at any price", () => {
    const exemptItemIds = [
      OLD_SCHOOL_BOND_ID,
      GLASSBLOWING_PIPE_ID,
      ENERGY_POTION_1_DOSE_ID,
      GAMES_NECKLACE_8_ID,
      EMPTY_WATERING_CAN_ID,
    ];
    for (const itemId of exemptItemIds) {
      for (const price of [50, 11_338_228, PRICE_ABOVE_32_BIT]) {
        expect(calculateTax(price, itemId)).toBe(0);
      }
    }
  });

  it("still taxes the poisoned variants of exempt ammo", () => {
    expect(calculateTax(1_000, POISONED_BRONZE_ARROW_ID)).toBe(20);
  });
});

describe("calculateConversionFee", () => {
  it("charges 10% of the buy price to make a bought bond tradeable again", () => {
    expect(calculateConversionFee(11_338_228, OLD_SCHOOL_BOND_ID)).toBe(
      1_133_823,
    );
    expect(calculateConversionFee(10_000_000, OLD_SCHOOL_BOND_ID)).toBe(
      1_000_000,
    );
  });

  it("charges nothing for other items or without a buy price", () => {
    expect(calculateConversionFee(11_338_228, ABYSSAL_WHIP_ID)).toBe(0);
    expect(calculateConversionFee(11_338_228, GLASSBLOWING_PIPE_ID)).toBe(0);
    expect(calculateConversionFee(null, OLD_SCHOOL_BOND_ID)).toBe(0);
  });
});
