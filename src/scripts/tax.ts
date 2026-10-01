import { isNullish } from "./nullish";

const TAX_DIVISOR = 50;
const TAX_CAP = 5_000_000;
const TAX_MIN_PRICE = 50;

const OLD_SCHOOL_BOND_ID = 13190;
const PERCENT = 100;

export const BOND_CONVERSION_FEE_PERCENT = 10;

const TAX_EXEMPT_ITEM_IDS: ReadonlySet<number> = new Set([
  OLD_SCHOOL_BOND_ID, // Old school bond
  1755, // Chisel
  5325, // Gardening trowel
  1785, // Glassblowing pipe
  2347, // Hammer
  1733, // Needle
  233, // Pestle and mortar
  5341, // Rake
  8794, // Saw
  5329, // Secateurs
  5343, // Seed dibber
  1735, // Shears
  952, // Spade
  5331, // Watering can
  3014, // Energy potion(1)
  3012, // Energy potion(2)
  3010, // Energy potion(3)
  3008, // Energy potion(4)
  882, // Bronze arrow
  884, // Iron arrow
  886, // Steel arrow
  806, // Bronze dart
  807, // Iron dart
  808, // Steel dart
  558, // Mind rune
  365, // Bass
  2309, // Bread
  1891, // Cake
  2140, // Cooked chicken
  2142, // Cooked meat
  347, // Herring
  379, // Lobster
  355, // Mackerel
  2327, // Meat pie
  351, // Pike
  329, // Salmon
  315, // Shrimps
  361, // Tuna
  8011, // Ardougne teleport (tablet)
  8010, // Camelot teleport (tablet)
  28824, // Civitas illa fortis teleport
  8009, // Falador teleport (tablet)
  28790, // Kourend castle teleport (tablet)
  8008, // Lumbridge teleport (tablet)
  8013, // Teleport to house (tablet)
  8007, // Varrock teleport (tablet)
  3853, // Games necklace(8)
  2552, // Ring of dueling(8)
]);

export function calculateTax(
  buyPrice: number | null | undefined,
  itemId: number,
): number {
  if (
    isNullish(buyPrice) ||
    buyPrice < TAX_MIN_PRICE ||
    TAX_EXEMPT_ITEM_IDS.has(itemId)
  ) {
    return 0;
  }
  return Math.min(Math.floor(buyPrice / TAX_DIVISOR), TAX_CAP);
}

export function calculateConversionFee(
  buyPrice: number | null | undefined,
  itemId: number,
): number {
  if (isNullish(buyPrice) || itemId !== OLD_SCHOOL_BOND_ID) {
    return 0;
  }
  return Math.round((buyPrice * BOND_CONVERSION_FEE_PERCENT) / PERCENT);
}
